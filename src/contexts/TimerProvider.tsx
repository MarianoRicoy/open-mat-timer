"use client";

import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  completeTimer,
  createTimerState,
  getTimerSnapshot,
  isSessionComplete,
  pauseTimer,
  resetTimer,
  startTimer,
  updateTimerConfig,
  type SessionConfig,
  type TimerSnapshot,
  type TimerState,
} from "@/lib/timer";
import { TRAINING_PRESETS, type TrainingPreset } from "@/lib/presets";
import { normalizeRoomCode } from "@/lib/remote/session-store";
import type { SessionPayload } from "@/lib/remote/types";
import { playRoundEndSound, playRoundStartSound } from "@/lib/sounds";
import { useRoomCode } from "@/hooks/useRoomCode";

const DEFAULT_CONFIG: SessionConfig = TRAINING_PRESETS[3]?.config ?? {
  rounds: 5,
  roundDurationSec: 300,
  restDurationSec: 60,
};

const SOUNDS_MUTED_KEY = "open-mat-timer:sounds-muted";
const REMOTE_POLL_MS = 400;

function getPhaseSignature(snapshot: TimerSnapshot): string {
  if (snapshot.status === "idle") {
    return "idle";
  }

  if (snapshot.status === "completed") {
    return "completed";
  }

  if (!snapshot.phase) {
    return snapshot.status;
  }

  return `${snapshot.phase.kind}-${snapshot.phase.roundNumber}`;
}

interface TimerContextValue {
  config: SessionConfig;
  snapshot: TimerSnapshot;
  isEditable: boolean;
  soundsMuted: boolean;
  activePresetId: string | null;
  presets: TrainingPreset[];
  roomCode: string | null;
  isRemoteMode: boolean;
  remoteConnected: boolean;
  remoteError: string | null;
  patchConfig: (partial: Partial<SessionConfig>) => void;
  applyPreset: (preset: TrainingPreset) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  toggleSoundsMuted: () => void;
  joinRoom: (code: string) => Promise<boolean>;
  leaveRoom: () => void;
  ensureHostRoom: () => Promise<string | null>;
}

const TimerContext = createContext<TimerContextValue | null>(null);

function TimerProviderInner({ children }: { children: ReactNode }) {
  const { roomCode, setRoomCode } = useRoomCode();
  const isRemoteMode = Boolean(roomCode);

  const [config, setConfig] = useState<SessionConfig>(DEFAULT_CONFIG);
  const [state, setState] = useState<TimerState>(() => createTimerState(DEFAULT_CONFIG));
  const [nowMs, setNowMs] = useState(0);
  const [activePresetId, setActivePresetId] = useState<string | null>(
    TRAINING_PRESETS[3]?.id ?? null,
  );
  const [soundsMuted, setSoundsMuted] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const previousPhaseRef = useRef<string>("idle");

  const syncFromPayload = useCallback((payload: SessionPayload) => {
    setConfig(payload.config);
    setState(payload.state);
    setActivePresetId(payload.activePresetId);
    setNowMs(payload.serverNowMs);
    setRemoteConnected(true);
    setRemoteError(null);
  }, []);

  const fetchRemoteSession = useCallback(async () => {
    if (!roomCode) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${roomCode}`, { cache: "no-store" });
      if (!response.ok) {
        setRemoteConnected(false);
        setRemoteError(
          response.status === 404 ? "Sala no encontrada" : "Sin conexión con la sala",
        );
        return;
      }

      const payload = (await response.json()) as SessionPayload;
      syncFromPayload(payload);
    } catch {
      setRemoteConnected(false);
      setRemoteError("Sin conexión con la sala");
    }
  }, [roomCode, syncFromPayload]);

  useEffect(() => {
    if (!roomCode) {
      return;
    }

    const initialTimeout = window.setTimeout(() => {
      void fetchRemoteSession();
    }, 0);
    const intervalId = window.setInterval(() => {
      void fetchRemoteSession();
    }, REMOTE_POLL_MS);

    return () => {
      window.clearTimeout(initialTimeout);
      window.clearInterval(intervalId);
    };
  }, [roomCode, fetchRemoteSession]);

  const sendRemoteCommand = useCallback(
    async (body: Record<string, unknown>) => {
      if (!roomCode) {
        return;
      }

      try {
        const response = await fetch(`/api/sessions/${roomCode}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          setRemoteError("No se pudo enviar el comando");
          return;
        }

        const payload = (await response.json()) as SessionPayload;
        syncFromPayload(payload);
      } catch {
        setRemoteError("No se pudo enviar el comando");
      }
    },
    [roomCode, syncFromPayload],
  );

  useEffect(() => {
    if (state.status !== "running") {
      return;
    }

    let frameId = 0;

    const tick = () => {
      const currentNow = Date.now();
      setNowMs(currentNow);

      if (!isRemoteMode) {
        setState((currentState) => {
          if (currentState.status !== "running") {
            return currentState;
          }

          if (isSessionComplete(currentState, currentNow)) {
            return completeTimer(currentState);
          }

          return currentState;
        });
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [state.status, isRemoteMode]);

  const snapshot = useMemo(() => {
    const effectiveNow = nowMs > 0 ? nowMs : state.sessionStartMs ?? 0;
    return getTimerSnapshot({ ...state, config }, effectiveNow);
  }, [state, config, nowMs]);

  const isEditable = state.status === "idle";

  useEffect(() => {
    const signature = getPhaseSignature(snapshot);

    if (signature === "idle") {
      previousPhaseRef.current = "idle";
      return;
    }

    if (previousPhaseRef.current === signature) {
      return;
    }

    const previous = previousPhaseRef.current;
    previousPhaseRef.current = signature;

    if (soundsMuted) {
      return;
    }

    if (signature === "completed") {
      playRoundEndSound();
      return;
    }

    if (snapshot.phase?.kind === "rest" && previous.startsWith("round")) {
      playRoundEndSound();
      return;
    }

    if (
      snapshot.phase?.kind === "round" &&
      (previous === "idle" || previous.startsWith("rest"))
    ) {
      playRoundStartSound();
    }
  }, [snapshot, soundsMuted]);

  const patchConfig = useCallback(
    (partial: Partial<SessionConfig>) => {
      if (isRemoteMode) {
        void sendRemoteCommand({ type: "patchConfig", partial });
        return;
      }

      setConfig((previous) => {
        const next = { ...previous, ...partial };
        setState((current) => updateTimerConfig(current, next));
        setActivePresetId(null);
        return next;
      });
    },
    [isRemoteMode, sendRemoteCommand],
  );

  const applyPreset = useCallback(
    (preset: TrainingPreset) => {
      if (isRemoteMode) {
        void sendRemoteCommand({ type: "applyPreset", presetId: preset.id });
        return;
      }

      setState((current) => {
        if (current.status !== "idle") {
          return current;
        }

        setConfig(preset.config);
        setActivePresetId(preset.id);
        return createTimerState(preset.config);
      });
    },
    [isRemoteMode, sendRemoteCommand],
  );

  const start = useCallback(() => {
    if (isRemoteMode) {
      void sendRemoteCommand({ type: "start" });
      return;
    }

    const currentNow = Date.now();
    setNowMs(currentNow);
    setState((current) => startTimer(current, currentNow));
  }, [isRemoteMode, sendRemoteCommand]);

  const pause = useCallback(() => {
    if (isRemoteMode) {
      void sendRemoteCommand({ type: "pause" });
      return;
    }

    const currentNow = Date.now();
    setNowMs(currentNow);
    setState((current) => pauseTimer(current, currentNow));
  }, [isRemoteMode, sendRemoteCommand]);

  const resume = useCallback(() => {
    if (isRemoteMode) {
      void sendRemoteCommand({ type: "resume" });
      return;
    }

    start();
  }, [isRemoteMode, sendRemoteCommand, start]);

  const reset = useCallback(() => {
    if (isRemoteMode) {
      void sendRemoteCommand({ type: "reset" });
      previousPhaseRef.current = "idle";
      return;
    }

    const currentNow = Date.now();
    setNowMs(currentNow);
    setState(resetTimer(config));
    previousPhaseRef.current = "idle";
  }, [config, isRemoteMode, sendRemoteCommand]);

  const toggleSoundsMuted = useCallback(() => {
    setSoundsMuted((previous) => {
      const next = !previous;
      try {
        window.localStorage.setItem(SOUNDS_MUTED_KEY, String(next));
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  }, []);

  const joinRoom = useCallback(
    async (code: string) => {
      const normalized = normalizeRoomCode(code);
      if (!normalized) {
        return false;
      }

      try {
        const response = await fetch(`/api/sessions/${normalized}`, { cache: "no-store" });
        if (!response.ok) {
          setRemoteError("Código inválido o sala expirada");
          return false;
        }

        const payload = (await response.json()) as SessionPayload;
        setRoomCode(normalized);
        syncFromPayload(payload);
        return true;
      } catch {
        setRemoteError("No se pudo vincular la sala");
        return false;
      }
    },
    [setRoomCode, syncFromPayload],
  );

  const leaveRoom = useCallback(() => {
    setRoomCode(null);
    setRemoteConnected(false);
    setRemoteError(null);
  }, [setRoomCode]);

  const ensureHostRoom = useCallback(async () => {
    if (roomCode) {
      return roomCode;
    }

    try {
      const response = await fetch("/api/sessions", { method: "POST" });
      if (!response.ok) {
        setRemoteError("No se pudo crear la sala");
        return null;
      }

      const payload = (await response.json()) as SessionPayload;
      setRoomCode(payload.code);
      syncFromPayload(payload);
      return payload.code;
    } catch {
      setRemoteError("No se pudo crear la sala");
      return null;
    }
  }, [roomCode, setRoomCode, syncFromPayload]);

  const value = useMemo(
    (): TimerContextValue => ({
      config,
      snapshot,
      isEditable,
      soundsMuted,
      activePresetId,
      presets: TRAINING_PRESETS,
      roomCode,
      isRemoteMode,
      remoteConnected,
      remoteError,
      patchConfig,
      applyPreset,
      start,
      pause,
      resume,
      reset,
      toggleSoundsMuted,
      joinRoom,
      leaveRoom,
      ensureHostRoom,
    }),
    [
      config,
      snapshot,
      isEditable,
      soundsMuted,
      activePresetId,
      roomCode,
      isRemoteMode,
      remoteConnected,
      remoteError,
      patchConfig,
      applyPreset,
      start,
      pause,
      resume,
      reset,
      toggleSoundsMuted,
      joinRoom,
      leaveRoom,
      ensureHostRoom,
    ],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function TimerProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <TimerProviderInner>{children}</TimerProviderInner>
    </Suspense>
  );
}

export function useTimerContext(): TimerContextValue {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimerContext must be used within TimerProvider");
  }
  return context;
}
