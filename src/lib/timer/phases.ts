import type { Phase, SessionConfig } from "./types";

export function buildPhases(config: SessionConfig): Phase[] {
  const phases: Phase[] = [];

  for (let round = 1; round <= config.rounds; round += 1) {
    phases.push({
      kind: "round",
      roundNumber: round,
      durationMs: config.roundDurationSec * 1000,
    });

    if (round < config.rounds && config.restDurationSec > 0) {
      phases.push({
        kind: "rest",
        roundNumber: round,
        durationMs: config.restDurationSec * 1000,
      });
    }
  }

  return phases;
}

export function computeTotalDurationMs(config: SessionConfig): number {
  return buildPhases(config).reduce((total, phase) => total + phase.durationMs, 0);
}
