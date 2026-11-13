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

  it("updates logo without changing timer status", () => {
    clearRemoteSessions();
    const { code } = createRemoteSession(0);
    const logo =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    applyRemoteSessionCommand(code, { type: "start" }, 1_000);
    const beforePause = applyRemoteSessionCommand(code, { type: "pause" }, 2_000);
    const afterLogo = applyRemoteSessionCommand(
      code,
      { type: "setLogo", logoDataUrl: logo },
      2_500,
    );
    const reloaded = getRemoteSession(code, 3_000);

    expect(beforePause?.snapshot.status).toBe("paused");
    expect(afterLogo?.snapshot.status).toBe("paused");
    expect(afterLogo?.logoDataUrl).toBe(logo);
    expect(reloaded?.logoDataUrl).toBe(logo);
    expect(reloaded?.snapshot.status).toBe("paused");
    expect(reloaded?.snapshot.phaseRemainingMs).toBe(
      beforePause?.snapshot.phaseRemainingMs,
    );

    const cleared = applyRemoteSessionCommand(
      code,
      { type: "setLogo", logoDataUrl: null },
      3_500,
    );
    expect(cleared?.logoDataUrl).toBeNull();
    expect(cleared?.snapshot.status).toBe("paused");
  });
});
