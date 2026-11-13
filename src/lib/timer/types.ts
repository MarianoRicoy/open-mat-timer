export interface SessionConfig {
  rounds: number;
  roundDurationSec: number;
  restDurationSec: number;
}

export type PhaseKind = "round" | "rest";

export interface Phase {
  kind: PhaseKind;
  /** Round index for `round` phases; for `rest`, the round that just ended. */
  roundNumber: number;
  durationMs: number;
}

export type TimerStatus = "idle" | "running" | "paused" | "completed";

export interface TimerState {
  config: SessionConfig;
  status: TimerStatus;
  sessionStartMs: number | null;
  accumulatedPauseMs: number;
  pauseStartedMs: number | null;
}

export interface TimerSnapshot {
  status: TimerStatus;
  phase: Phase | null;
  phaseRemainingMs: number;
  sessionRemainingMs: number;
  sessionElapsedMs: number;
  totalDurationMs: number;
  /** Active round number while fighting; upcoming round during rest. */
  displayRound: number;
}
