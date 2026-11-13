"use client";

import {
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
import { playRoundEndSound, playRoundStartSound } from "@/lib/sounds";

const DEFAULT_CONFIG: SessionConfig = TRAINING_PRESETS[3]?.config ?? {
  rounds: 5,
  roundDurationSec: 300,
  restDurationSec: 60,
};

const SOUNDS_MUTED_KEY = "open-mat-timer:sounds-muted";

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
  patchConfig: (partial: Partial<SessionConfig>) => void;
  applyPreset: (preset: TrainingPreset) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  toggleSoundsMuted: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SessionConfig>(DEFAULT_CONFIG);
  const [state, setState] = useState<TimerState>(() => createTimerState(DEFAULT_CONFIG));
  const [nowMs, setNowMs] = useState(0);
  const [activePresetId, setActivePresetId] = useState<string | null>(
    TRAINING_PRESETS[3]?.id ?? null,
  );
  const [soundsMuted, setSoundsMuted] = useState(false);
  const previousPhaseRef = useRef<string>("idle");

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

  const snapshot = useMemo(
    () => getTimerSnapshot(state, nowMs),
    [state, nowMs],
  );

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

  const patchConfig = useCallback((partial: Partial<SessionConfig>) => {
    setConfig((previous) => {
      const next = { ...previous, ...partial };
      setState((current) => updateTimerConfig(current, next));
      setActivePresetId(null);
      return next;
    });
  }, []);

  const applyPreset = useCallback((preset: TrainingPreset) => {
    setState((current) => {
      if (current.status !== "idle") {
        return current;
      }

      setConfig(preset.config);
      setActivePresetId(preset.id);
      return createTimerState(preset.config);
    });
  }, []);

  const start = useCallback(() => {
    const currentNow = Date.now();
    setNowMs(currentNow);
    setState((current) => startTimer(current, currentNow));
  }, []);

  const pause = useCallback(() => {
    const currentNow = Date.now();
    setNowMs(currentNow);
    setState((current) => pauseTimer(current, currentNow));
  }, []);

  const resume = useCallback(() => {
    start();
  }, [start]);

  const reset = useCallback(() => {
    const currentNow = Date.now();
    setNowMs(currentNow);
    setState(resetTimer(config));
    previousPhaseRef.current = "idle";
  }, [config]);

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

  const value = useMemo(
    (): TimerContextValue => ({
      config,
      snapshot,
      isEditable,
      soundsMuted,
      activePresetId,
      presets: TRAINING_PRESETS,
      patchConfig,
      applyPreset,
      start,
      pause,
      resume,
      reset,
      toggleSoundsMuted,
    }),
    [
      config,
      snapshot,
      isEditable,
      soundsMuted,
      activePresetId,
      patchConfig,
      applyPreset,
      start,
      pause,
      resume,
      reset,
      toggleSoundsMuted,
    ],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimerContext(): TimerContextValue {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimerContext must be used within TimerProvider");
  }
  return context;
}
