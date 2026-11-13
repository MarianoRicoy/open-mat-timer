"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "@/lib/timer";

const DEFAULT_CONFIG: SessionConfig = {
  rounds: 3,
  roundDurationSec: 300,
  restDurationSec: 60,
};

export function useMatTimer() {
  const [config, setConfig] = useState<SessionConfig>(DEFAULT_CONFIG);
  const [state, setState] = useState(() => createTimerState(DEFAULT_CONFIG));
  const [nowMs, setNowMs] = useState(0);

  const isEditable = state.status === "idle";

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

  const snapshot: TimerSnapshot = useMemo(
    () => getTimerSnapshot(state, nowMs),
    [state, nowMs],
  );

  const patchConfig = useCallback(
    (partial: Partial<SessionConfig>) => {
      setConfig((previous) => {
        const next = { ...previous, ...partial };
        setState((current) => updateTimerConfig(current, next));
        return next;
      });
    },
    [],
  );

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
  }, [config]);

  return {
    config,
    patchConfig,
    snapshot,
    isEditable,
    start,
    pause,
    resume,
    reset,
  };
}
