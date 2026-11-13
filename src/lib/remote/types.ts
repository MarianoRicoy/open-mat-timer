import type { SessionConfig, TimerSnapshot, TimerState } from "@/lib/timer";

export interface RemoteSessionRecord {
  code: string;
  createdAtMs: number;
  updatedAtMs: number;
  revision: number;
  config: SessionConfig;
  state: TimerState;
  activePresetId: string | null;
  logoDataUrl: string | null;
  logoZoom: number;
}

export type SessionCommand =
  | { type: "start" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "reset" }
  | { type: "patchConfig"; partial: Partial<SessionConfig> }
  | { type: "applyPreset"; presetId: string }
  | { type: "setLogo"; logoDataUrl: string | null }
  | { type: "setLogoZoom"; zoom: number };

export interface SessionPayload {
  code: string;
  revision: number;
  serverNowMs: number;
  config: SessionConfig;
  state: TimerState;
  activePresetId: string | null;
  logoDataUrl: string | null;
  logoZoom: number;
  snapshot: TimerSnapshot;
}
