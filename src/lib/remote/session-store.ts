import { TRAINING_PRESETS } from "@/lib/presets";
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
  type TimerState,
} from "@/lib/timer";
import { normalizeLogoDataUrl } from "@/lib/logo";
import { normalizeLogoZoom } from "@/lib/logo-zoom";
import type { RemoteSessionRecord, SessionCommand, SessionPayload } from "./types";

const DEFAULT_CONFIG: SessionConfig = TRAINING_PRESETS[3]?.config ?? {
  rounds: 5,
  roundDurationSec: 300,
  restDurationSec: 60,
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type SessionMap = Map<string, RemoteSessionRecord>;

const globalStore = globalThis as typeof globalThis & {
  __openMatRemoteSessions?: SessionMap;
};

function getSessionMap(): SessionMap {
  if (!globalStore.__openMatRemoteSessions) {
    globalStore.__openMatRemoteSessions = new Map();
  }
  return globalStore.__openMatRemoteSessions;
}

export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function generateRoomCode(map: SessionMap): string {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    let code = "";
    for (let index = 0; index < 6; index += 1) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    if (!map.has(code)) {
      return code;
    }
  }

  throw new Error("Could not allocate a unique room code");
}

export function advanceRunningState(state: TimerState, nowMs: number): TimerState {
  if (state.status !== "running") {
    return state;
  }

  if (isSessionComplete(state, nowMs)) {
    return completeTimer(state);
  }

  return state;
}

function toPayload(session: RemoteSessionRecord, nowMs: number): SessionPayload {
  const state = advanceRunningState(session.state, nowMs);

  return {
    code: session.code,
    revision: session.revision,
    serverNowMs: nowMs,
    config: session.config,
    state,
    activePresetId: session.activePresetId,
    logoDataUrl: session.logoDataUrl,
    logoZoom: session.logoZoom,
    snapshot: getTimerSnapshot({ ...state, config: session.config }, nowMs),
  };
}

export function createRemoteSession(nowMs: number = Date.now()): SessionPayload {
  const map = getSessionMap();
  const code = generateRoomCode(map);

  const config = { ...DEFAULT_CONFIG };
  const record: RemoteSessionRecord = {
    code,
    createdAtMs: nowMs,
    updatedAtMs: nowMs,
    revision: 1,
    config,
    state: createTimerState(config),
    activePresetId: TRAINING_PRESETS[3]?.id ?? null,
    logoDataUrl: null,
    logoZoom: 1,
  };

  map.set(code, record);
  return toPayload(record, nowMs);
}

export function getRemoteSession(
  code: string,
  nowMs: number = Date.now(),
): SessionPayload | null {
  const record = getSessionMap().get(normalizeRoomCode(code));
  if (!record) {
    return null;
  }

  const advancedState = advanceRunningState(record.state, nowMs);
  if (advancedState !== record.state) {
    record.state = advancedState;
    record.updatedAtMs = nowMs;
    record.revision += 1;
  }

  return toPayload(record, nowMs);
}

export function applyRemoteSessionCommand(
  code: string,
  command: SessionCommand,
  nowMs: number = Date.now(),
): SessionPayload | null {
  const normalizedCode = normalizeRoomCode(code);
  const map = getSessionMap();
  const record = map.get(normalizedCode);

  if (!record) {
    return null;
  }

  let nextState = advanceRunningState(record.state, nowMs);
  let nextConfig = record.config;
  let nextPresetId = record.activePresetId;

  switch (command.type) {
    case "setLogo": {
      record.logoDataUrl = normalizeLogoDataUrl(command.logoDataUrl);
      record.updatedAtMs = nowMs;
      record.revision += 1;
      return toPayload(record, nowMs);
    }
    case "setLogoZoom": {
      record.logoZoom = normalizeLogoZoom(command.zoom);
      record.updatedAtMs = nowMs;
      record.revision += 1;
      return toPayload(record, nowMs);
    }
    case "start":
      nextState = startTimer({ ...nextState, config: nextConfig }, nowMs);
      break;
    case "pause":
      nextState = pauseTimer({ ...nextState, config: nextConfig }, nowMs);
      break;
    case "resume":
      nextState = startTimer({ ...nextState, config: nextConfig }, nowMs);
      break;
    case "reset":
      nextState = resetTimer(nextConfig);
      break;
    case "patchConfig": {
      if (nextState.status !== "idle" && nextState.status !== "completed") {
        break;
      }
      nextConfig = { ...nextConfig, ...command.partial };
      nextState =
        nextState.status === "completed"
          ? createTimerState(nextConfig)
          : updateTimerConfig({ ...nextState, config: nextConfig }, nextConfig);
      nextPresetId = null;
      break;
    }
    case "applyPreset": {
      if (nextState.status !== "idle" && nextState.status !== "completed") {
        break;
      }
      const preset = TRAINING_PRESETS.find((item) => item.id === command.presetId);
      if (!preset) {
        break;
      }
      nextConfig = preset.config;
      nextState = createTimerState(preset.config);
      nextPresetId = preset.id;
      break;
    }
    default:
      break;
  }

  nextState = advanceRunningState(nextState, nowMs);

  record.config = nextConfig;
  record.state = nextState;
  record.activePresetId = nextPresetId;
  record.updatedAtMs = nowMs;
  record.revision += 1;

  return toPayload(record, nowMs);
}

/** Test helper */
export function clearRemoteSessions(): void {
  getSessionMap().clear();
}
