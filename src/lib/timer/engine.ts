import { buildPhases, computeTotalDurationMs } from "./phases";
import type { SessionConfig, TimerSnapshot, TimerState } from "./types";

export function createTimerState(config: SessionConfig): TimerState {
  return {
    config,
    status: "idle",
    sessionStartMs: null,
    accumulatedPauseMs: 0,
    pauseStartedMs: null,
  };
}

function getEffectiveElapsedMs(state: TimerState, nowMs: number): number {
  if (state.sessionStartMs === null) {
    return 0;
  }

  if (state.status === "paused" && state.pauseStartedMs !== null) {
    return state.pauseStartedMs - state.sessionStartMs - state.accumulatedPauseMs;
  }

  return nowMs - state.sessionStartMs - state.accumulatedPauseMs;
}

function completedSnapshot(state: TimerState, totalDurationMs: number): TimerSnapshot {
  return {
    status: "completed",
    phase: null,
    phaseRemainingMs: 0,
    sessionRemainingMs: 0,
    sessionElapsedMs: totalDurationMs,
    totalDurationMs,
    displayRound: state.config.rounds,
  };
}

function idleSnapshot(state: TimerState, totalDurationMs: number): TimerSnapshot {
  const phases = buildPhases(state.config);

  return {
    status: "idle",
    phase: phases[0] ?? null,
    phaseRemainingMs: phases[0]?.durationMs ?? 0,
    sessionRemainingMs: totalDurationMs,
    sessionElapsedMs: 0,
    totalDurationMs,
    displayRound: 1,
  };
}

export function getTimerSnapshot(state: TimerState, nowMs: number): TimerSnapshot {
  const totalDurationMs = computeTotalDurationMs(state.config);

  if (state.status === "idle") {
    return idleSnapshot(state, totalDurationMs);
  }

  if (state.status === "completed") {
    return completedSnapshot(state, totalDurationMs);
  }

  const elapsedMs = getEffectiveElapsedMs(state, nowMs);

  if (elapsedMs >= totalDurationMs) {
    return completedSnapshot(state, totalDurationMs);
  }

  const phases = buildPhases(state.config);
  let offsetMs = 0;

  for (const phase of phases) {
    const phaseEndMs = offsetMs + phase.durationMs;

    if (elapsedMs < phaseEndMs) {
      const phaseElapsedMs = elapsedMs - offsetMs;
      const displayRound =
        phase.kind === "round" ? phase.roundNumber : phase.roundNumber + 1;

      return {
        status: state.status,
        phase,
        phaseRemainingMs: phase.durationMs - phaseElapsedMs,
        sessionRemainingMs: totalDurationMs - elapsedMs,
        sessionElapsedMs: elapsedMs,
        totalDurationMs,
        displayRound,
      };
    }

    offsetMs = phaseEndMs;
  }

  return completedSnapshot(state, totalDurationMs);
}

export function isSessionComplete(state: TimerState, nowMs: number): boolean {
  if (state.status === "completed") {
    return true;
  }

  if (state.sessionStartMs === null) {
    return false;
  }

  const totalDurationMs = computeTotalDurationMs(state.config);
  return getEffectiveElapsedMs(state, nowMs) >= totalDurationMs;
}

export function startTimer(state: TimerState, nowMs: number): TimerState {
  if (state.status === "completed") {
    return state;
  }

  if (state.status === "idle") {
    return {
      ...state,
      status: "running",
      sessionStartMs: nowMs,
      accumulatedPauseMs: 0,
      pauseStartedMs: null,
    };
  }

  if (state.status === "paused" && state.pauseStartedMs !== null) {
    return {
      ...state,
      status: "running",
      accumulatedPauseMs: state.accumulatedPauseMs + (nowMs - state.pauseStartedMs),
      pauseStartedMs: null,
    };
  }

  return state;
}

export function pauseTimer(state: TimerState, nowMs: number): TimerState {
  if (state.status !== "running") {
    return state;
  }

  return {
    ...state,
    status: "paused",
    pauseStartedMs: nowMs,
  };
}

export function completeTimer(state: TimerState): TimerState {
  if (state.status === "idle") {
    return state;
  }

  return {
    ...state,
    status: "completed",
    pauseStartedMs: null,
  };
}

export function resetTimer(config: SessionConfig): TimerState {
  return createTimerState(config);
}

export function updateTimerConfig(
  state: TimerState,
  config: SessionConfig,
): TimerState {
  if (state.status !== "idle") {
    return state;
  }

  return createTimerState(config);
}
