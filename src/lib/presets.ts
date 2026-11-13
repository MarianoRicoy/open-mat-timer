import type { SessionConfig } from "@/lib/timer";

export interface TrainingPreset {
  id: string;
  name: string;
  subtitle: string;
  config: SessionConfig;
}

export const TRAINING_PRESETS: TrainingPreset[] = [
  {
    id: "test-25s",
    name: "Prueba 25s",
    subtitle: "1 ronda · 25 s (test)",
    config: { rounds: 1, roundDurationSec: 25, restDurationSec: 0 },
  },
  {
    id: "guetho-5",
    name: "5 min",
    subtitle: "1 ronda continua",
    config: { rounds: 1, roundDurationSec: 300, restDurationSec: 0 },
  },
  {
    id: "guetho-8",
    name: "8 min",
    subtitle: "1 ronda continua",
    config: { rounds: 1, roundDurationSec: 480, restDurationSec: 0 },
  },
  {
    id: "guetho-12",
    name: "12 min",
    subtitle: "1 ronda continua",
    config: { rounds: 1, roundDurationSec: 720, restDurationSec: 0 },
  },
  {
    id: "open-mat-12x6",
    name: "Open mat",
    subtitle: "12 rondas · 6 min · 1 min desc",
    config: { rounds: 12, roundDurationSec: 360, restDurationSec: 60 },
  },
  {
    id: "comp-3x5",
    name: "Comp",
    subtitle: "3 rondas · 5 min · 2 min desc",
    config: { rounds: 3, roundDurationSec: 300, restDurationSec: 120 },
  },
  {
    id: "drill-10x2",
    name: "Drills",
    subtitle: "10 rondas · 2 min · 30 s desc",
    config: { rounds: 10, roundDurationSec: 120, restDurationSec: 30 },
  },
];
