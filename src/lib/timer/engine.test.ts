import { describe, expect, it } from "vitest";
import {
  computeTotalDurationMs,
  createTimerState,
  getTimerSnapshot,
  pauseTimer,
  startTimer,
} from "./index";
import { buildPhases } from "./phases";

describe("session duration", () => {
  it("totals 40s for 3 rounds of 10s with 5s rest", () => {
    const config = { rounds: 3, roundDurationSec: 10, restDurationSec: 5 };
    expect(computeTotalDurationMs(config)).toBe(40_000);
    expect(buildPhases(config)).toHaveLength(5);
  });

  it("skips rest phases when rest is zero", () => {
    const config = { rounds: 3, roundDurationSec: 10, restDurationSec: 0 };
    expect(computeTotalDurationMs(config)).toBe(30_000);
    expect(buildPhases(config)).toHaveLength(3);
  });
});

describe("timer engine", () => {
  it("tracks elapsed time from timestamps instead of interval counts", () => {
    const config = { rounds: 3, roundDurationSec: 10, restDurationSec: 5 };
    let state = createTimerState(config);
    const t0 = 1_000_000;

    state = startTimer(state, t0);

    let snapshot = getTimerSnapshot(state, t0 + 7_500);
    expect(snapshot.phase?.kind).toBe("round");
    expect(snapshot.phaseRemainingMs).toBe(2_500);
    expect(snapshot.sessionRemainingMs).toBe(32_500);

    snapshot = getTimerSnapshot(state, t0 + 10_500);
    expect(snapshot.phase?.kind).toBe("rest");
    expect(snapshot.phaseRemainingMs).toBe(4_500);
  });

  it("does not count time while paused", () => {
    const config = { rounds: 1, roundDurationSec: 20, restDurationSec: 0 };
      let state = createTimerState(config);
    const t0 = 0;

    state = startTimer(state, t0);
    state = pauseTimer(state, t0 + 5_000);
    state = startTimer(state, t0 + 60_000);

    const snapshot = getTimerSnapshot(state, t0 + 65_000);
    expect(snapshot.phaseRemainingMs).toBe(10_000);
    expect(snapshot.sessionRemainingMs).toBe(10_000);
  });

  it("marks session complete after the last round", () => {
    const config = { rounds: 2, roundDurationSec: 5, restDurationSec: 0 };
      let state = createTimerState(config);
    const t0 = 0;

    state = startTimer(state, t0);
    const snapshot = getTimerSnapshot(state, t0 + 10_000);

    expect(snapshot.status).toBe("completed");
    expect(snapshot.sessionRemainingMs).toBe(0);
    expect(snapshot.phase).toBeNull();
  });
});
