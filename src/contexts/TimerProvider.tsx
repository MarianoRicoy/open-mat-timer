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
import { usePathname } from "next/navigation";
import { useRoomCode } from "@/hooks/useRoomCode";
import { isValidLogoDataUrl } from "@/lib/logo";
import { DEFAULT_LOGO_ZOOM, clampLogoZoom } from "@/lib/logo-zoom";

const SESSION_SYNC_CHANNEL = "open-mat-timer:session-sync";

const DEFAULT_CONFIG: SessionConfig = TRAINING_PRESETS[3]?.config ?? {
  rounds: 5,
  roundDurationSec: 300,
  restDurationSec: 60,
};

const SOUNDS_MUTED_KEY = "open-mat-timer:sounds-muted";
const LOCAL_LOGO_KEY = "open-mat-timer:logo";
const LOCAL_LOGO_ZOOM_KEY = "open-mat-timer:logo-zoom";
const REMOTE_POLL_MS_IDLE = 12_000;
const REMOTE_POLL_MS_ACTIVE = 3_000;
const REMOTE_POLL_MS_DONE = 8_000;
const REMOTE_POLL_MS_HIDDEN = 15_000;

function getRemotePollMs(status: TimerState["status"]): number {
  if (status === "running" || status === "paused") {
    return REMOTE_POLL_MS_ACTIVE;
  }
  if (status === "completed") {
    return REMOTE_POLL_MS_DONE;
  }
  return REMOTE_POLL_MS_IDLE;
}

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
  logoDataUrl: string | null;
  logoZoom: number;
  setLogo: (
    logoDataUrl: string | null,
  ) => Promise<{ ok: boolean; message?: string }>;
  setLogoZoom: (zoom: number) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

function TimerProviderInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isTvClient = pathname === "/tv";
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
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoZoom, setLogoZoomState] = useState(DEFAULT_LOGO_ZOOM);
  const previousPhaseRef = useRef<string>("idle");
  const remoteRevisionRef = useRef(0);
  const timerStatusRef = useRef<TimerState["status"]>("idle");
  const pollingRoomRef = useRef<string | null>(null);
  const sessionSyncRef = useRef<BroadcastChannel | null>(null);

  const syncFromPayload = useCallback((payload: SessionPayload) => {
    remoteRevisionRef.current = payload.revision;
    setConfig(payload.config);
    setState(payload.state);
    setActivePresetId(payload.activePresetId);
    setLogoDataUrl(payload.logoDataUrl);
    setLogoZoomState(payload.logoZoom);
    setNowMs(payload.serverNowMs);
    setRemoteConnected(true);
    setRemoteError(null);

    try {
      sessionSyncRef.current?.postMessage({
        roomCode: payload.code,
        payload,
      });
    } catch {
      /* ignore broadcast errors */
    }
  }, []);

  useEffect(() => {
    if (!roomCode || typeof BroadcastChannel === "undefined") {
      sessionSyncRef.current?.close();
      sessionSyncRef.current = null;
      return;
    }

    const channel = new BroadcastChannel(SESSION_SYNC_CHANNEL);
    sessionSyncRef.current = channel;

    channel.onmessage = (event: MessageEvent<{ roomCode: string; payload: SessionPayload }>) => {
      const data = event.data;
      if (!data?.payload || normalizeRoomCode(data.roomCode) !== roomCode) {
        return;
      }
      if (data.payload.revision <= remoteRevisionRef.current) {
        return;
      }
      remoteRevisionRef.current = data.payload.revision;
      setConfig(data.payload.config);
      setState(data.payload.state);
      setActivePresetId(data.payload.activePresetId);
      setLogoDataUrl(data.payload.logoDataUrl);
      setLogoZoomState(data.payload.logoZoom);
      setNowMs(data.payload.serverNowMs);
      setRemoteConnected(true);
      setRemoteError(null);
    };

    return () => {
      channel.close();
      if (sessionSyncRef.current === channel) {
        sessionSyncRef.current = null;
      }
    };
  }, [roomCode]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(LOCAL_LOGO_KEY);
        if (stored && isValidLogoDataUrl(stored)) {
          setLogoDataUrl(stored);
        }
        const storedZoom = window.localStorage.getItem(LOCAL_LOGO_ZOOM_KEY);
        if (storedZoom) {
          const parsed = Number.parseFloat(storedZoom);
          if (!Number.isNaN(parsed)) {
            setLogoZoomState(clampLogoZoom(parsed));
          }
        }
      } catch {
        /* ignore storage errors */
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    timerStatusRef.current = state.status;
  }, [state.status]);

  const fetchRemoteSession = useCallback(async () => {
    if (!roomCode) {
      return;
    }

    try {
      const response = await fetch(
        `/api/sessions/${roomCode}?revision=${remoteRevisionRef.current}`,
        { cache: "no-store" },
      );

      if (response.status === 204) {
        return;
      }

      if (!response.ok) {
        setRemoteConnected(false);
        if (response.status === 404) {
          setRemoteError(
            "Esta sala ya no existe (servidor reiniciado). Abrí /tv o creá un código nuevo.",
          );
          setRoomCode(null);
        } else {
          setRemoteError("Sin conexión con la sala");
        }
        return;
      }

      const payload = (await response.json()) as SessionPayload;
      syncFromPayload(payload);
    } catch {
      setRemoteConnected(false);
      setRemoteError("Sin conexión con la sala");
    }
  }, [roomCode, setRoomCode, syncFromPayload]);

  useEffect(() => {
    if (!roomCode) {
      pollingRoomRef.current = null;
      return;
    }

    if (pollingRoomRef.current !== roomCode) {
      remoteRevisionRef.current = 0;
      pollingRoomRef.current = roomCode;
    }

    if (!isTvClient) {
      let cancelled = false;

      const refresh = () => {
        if (!cancelled) {
          void fetchRemoteSession();
        }
      };

      refresh();

      const onVisibility = () => {
        if (document.visibilityState === "visible") {
          refresh();
        }
      };

      document.addEventListener("visibilitychange", onVisibility);
      return () => {
        cancelled = true;
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }

    let cancelled = false;
    let timeoutId = 0;

    const scheduleNext = (delayMs: number) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        void poll();
      }, delayMs);
    };

    const poll = async () => {
      if (cancelled) {
        return;
      }

      const hidden = document.visibilityState === "hidden";
      if (hidden) {
        scheduleNext(REMOTE_POLL_MS_HIDDEN);
        return;
      }

      await fetchRemoteSession();

      if (cancelled) {
        return;
      }

      scheduleNext(getRemotePollMs(timerStatusRef.current));
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !cancelled) {
        void fetchRemoteSession();
        scheduleNext(getRemotePollMs(timerStatusRef.current));
      }
    };

    void poll();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [roomCode, fetchRemoteSession, isTvClient]);

  const persistLocalLogo = useCallback((nextLogo: string | null) => {
    try {
      if (nextLogo) {
        window.localStorage.setItem(LOCAL_LOGO_KEY, nextLogo);
      } else {
        window.localStorage.removeItem(LOCAL_LOGO_KEY);
      }
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const persistLocalLogoZoom = useCallback((zoom: number) => {
    try {
      window.localStorage.setItem(LOCAL_LOGO_ZOOM_KEY, String(clampLogoZoom(zoom)));
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const sendRemoteCommand = useCallback(
    async (
      body: Record<string, unknown>,
    ): Promise<{ ok: true } | { ok: false; status: number }> => {
      if (!roomCode) {
        return { ok: false, status: 0 };
      }

      try {
        const response = await fetch(`/api/sessions/${roomCode}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          if (response.status === 404) {
            setRemoteError(
              "Esta sala ya no existe (¿reiniciaste el servidor?). Abrí /tv de nuevo.",
            );
          } else {
            setRemoteError(
              body.type === "setLogo"
                ? "No se pudo sincronizar el logo con la sala"
                : "No se pudo enviar el comando",
            );
          }
          return { ok: false, status: response.status };
        }

        const payload = (await response.json()) as SessionPayload;
        syncFromPayload(payload);
        return { ok: true };
      } catch {
        setRemoteError(
          body.type === "setLogo"
            ? "No se pudo sincronizar el logo con la sala"
            : "No se pudo enviar el comando",
        );
        return { ok: false, status: 0 };
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

      setState((currentState) => {
        if (currentState.status !== "running") {
          return currentState;
        }

        if (isSessionComplete(currentState, currentNow)) {
          return completeTimer(currentState);
        }

        return currentState;
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [state.status]);

  const snapshot = useMemo(() => {
    const effectiveNow = nowMs > 0 ? nowMs : state.sessionStartMs ?? 0;
    return getTimerSnapshot({ ...state, config }, effectiveNow);
  }, [state, config, nowMs]);

  const isEditable = state.status === "idle" || state.status === "completed";

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

  const applyConfigPatch = useCallback((partial: Partial<SessionConfig>) => {
    setConfig((previous) => {
      const next = { ...previous, ...partial };
      setState((current) => {
        if (current.status === "idle") {
          return updateTimerConfig(current, next);
        }
        if (current.status === "completed") {
          return createTimerState(next);
        }
        return current;
      });
      setActivePresetId(null);
      return next;
    });
  }, []);

  const patchConfig = useCallback(
    (partial: Partial<SessionConfig>) => {
      if (!isEditable) {
        return;
      }

      applyConfigPatch(partial);

      if (isRemoteMode) {
        void sendRemoteCommand({ type: "patchConfig", partial });
      }
    },
    [applyConfigPatch, isEditable, isRemoteMode, sendRemoteCommand],
  );

  const applyPreset = useCallback(
    (preset: TrainingPreset) => {
      if (!isEditable) {
        return;
      }

      setConfig(preset.config);
      setActivePresetId(preset.id);
      setState((current) => {
        if (current.status === "idle" || current.status === "completed") {
          return createTimerState(preset.config);
        }
        return current;
      });

      if (isRemoteMode) {
        void sendRemoteCommand({ type: "applyPreset", presetId: preset.id });
      }
    },
    [isEditable, isRemoteMode, sendRemoteCommand],
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

  const setLogo = useCallback(
    async (
      nextLogo: string | null,
    ): Promise<{ ok: boolean; message?: string }> => {
      if (nextLogo !== null && !isValidLogoDataUrl(nextLogo)) {
        return { ok: false };
      }

      const previousLogo = logoDataUrl;
      setLogoDataUrl(nextLogo);

      persistLocalLogo(nextLogo);

      if (isRemoteMode) {
        const result = await sendRemoteCommand({
          type: "setLogo",
          logoDataUrl: nextLogo,
        });
        if (!result.ok) {
          if (result.status === 404) {
            setRoomCode(null);
            setRemoteConnected(false);
            return {
              ok: true,
              message:
                "Logo guardado en este equipo. La sala expiró: abrí /tv o tocá «Crear sala nueva».",
            };
          }
          setLogoDataUrl(previousLogo);
          persistLocalLogo(previousLogo);
          return { ok: false };
        }
        return { ok: true };
      }

      return { ok: true };
    },
    [
      isRemoteMode,
      logoDataUrl,
      persistLocalLogo,
      sendRemoteCommand,
      setRoomCode,
    ],
  );

  const setLogoZoom = useCallback(
    (zoom: number) => {
      const next = clampLogoZoom(zoom);
      setLogoZoomState(next);
      persistLocalLogoZoom(next);

      if (isRemoteMode) {
        void sendRemoteCommand({ type: "setLogoZoom", zoom: next });
      }
    },
    [isRemoteMode, persistLocalLogoZoom, sendRemoteCommand],
  );

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
      logoDataUrl,
      logoZoom,
      setLogo,
      setLogoZoom,
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
      logoDataUrl,
      logoZoom,
      setLogo,
      setLogoZoom,
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
