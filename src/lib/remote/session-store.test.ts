import { describe, expect, it } from "vitest";
import {
  applyRemoteSessionCommand,
  clearRemoteSessions,
  createRemoteSession,
  getRemoteSession,
} from "./session-store";

describe("remote session store", () => {
  it("creates and reads a session by code", () => {
    clearRemoteSessions();
    const created = createRemoteSession(1_000);
    const loaded = getRemoteSession(created.code, 1_500);

    expect(loaded?.code).toBe(created.code);
    expect(loaded?.snapshot.status).toBe("idle");
  });

  it("keeps timer state authoritative across clients", () => {
    clearRemoteSessions();
    const created = createRemoteSession(0);
    const code = created.code;

    applyRemoteSessionCommand(code, { type: "start" }, 100);
    const paused = applyRemoteSessionCommand(code, { type: "pause" }, 5_100);
    expect(paused?.snapshot.status).toBe("paused");

    const reloaded = getRemoteSession(code, 60_000);
    expect(reloaded?.snapshot.phaseRemainingMs).toBeGreaterThan(0);
    expect(reloaded?.snapshot.status).toBe("paused");
  });

  it("recovers running progress after reload", () => {
    clearRemoteSessions();
    const { code } = createRemoteSession(10_000);
    applyRemoteSessionCommand(
      code,
      {
        type: "patchConfig",
        partial: { rounds: 1, roundDurationSec: 10, restDurationSec: 0 },
      },
      10_000,
    );
    applyRemoteSessionCommand(code, { type: "start" }, 10_000);

    const tick = getRemoteSession(code, 17_000);
    expect(tick?.snapshot.phase?.kind).toBe("round");
    expect(tick?.snapshot.phaseRemainingMs).toBeLessThanOrEqual(3_000);
  });
});
