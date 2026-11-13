import { useState } from "react";
import { useMobileTimer } from "@app/providers/LocalTimerProvider";
import { MobileLogoControl } from "@app/components/MobileLogoControl";
import { computeTotalDurationMs, formatDurationMs } from "@shared/lib/timer";

function ConfigField({
  label,
  value,
  disabled,
  onChange,
  min = 1,
  step = 1,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
}) {
  const [draft, setDraft] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);

  const parseInput = (raw: string): number | null => {
    const parsed = step === 1 ? Number.parseInt(raw, 10) : Number.parseFloat(raw);
    if (Number.isNaN(parsed) || parsed < min) {
      return null;
    }
    return parsed;
  };

  return (
    <label className="flex flex-col gap-1.5 text-sm text-zinc-400">
      <span className="font-medium">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={isFocused ? draft : String(value)}
        disabled={disabled}
        onFocus={() => {
          setDraft(String(value));
          setIsFocused(true);
        }}
        onChange={(event) => {
          setDraft(event.target.value);
          const parsed = parseInput(event.target.value);
          if (parsed !== null) {
            onChange(parsed);
          }
        }}
        onBlur={() => {
          setIsFocused(false);
          const parsed = parseInput(draft);
          if (parsed !== null && parsed !== value) {
            onChange(parsed);
          }
        }}
        className="min-h-12 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-xl text-zinc-100 outline-none ring-amber-500/40 focus:ring-2 disabled:opacity-50"
      />
    </label>
  );
}

export function MobileControlView() {
  const {
    config,
    snapshot,
    isEditable,
    soundsMuted,
    activePresetId,
    presets,
    patchConfig,
    applyPreset,
    start,
    pause,
    resume,
    reset,
    toggleSoundsMuted,
  } = useMobileTimer();

  const totalDurationMs = computeTotalDurationMs(config);

  const phaseLabel =
    snapshot.status === "completed"
      ? "Sesión terminada"
      : snapshot.phase?.kind === "rest"
        ? `Descanso · ronda ${snapshot.displayRound}`
        : snapshot.status === "idle"
          ? "Listo para iniciar"
          : `Ronda ${snapshot.displayRound}`;

  const primaryTime =
    snapshot.status === "idle"
      ? totalDurationMs
      : snapshot.phaseRemainingMs;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-6 pb-12">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-500">
          Open Mat Timer
        </p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-50">Panel móvil</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Cronómetro local sin internet. Los cambios se guardan en el teléfono.
        </p>
      </header>

      <MobileLogoControl />

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
            Presets
          </h2>
          <button
            type="button"
            onClick={toggleSoundsMuted}
            className="min-h-10 rounded-full border border-zinc-700 px-4 text-xs font-semibold uppercase text-zinc-300"
          >
            {soundsMuted ? "Sonido off" : "Sonido on"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={!isEditable}
              onClick={() => applyPreset(preset)}
              className={`min-h-16 rounded-xl border px-3 py-2 text-left disabled:opacity-50 ${
                activePresetId === preset.id
                  ? "border-amber-500/80 bg-amber-500/10 text-amber-100"
                  : "border-zinc-700 bg-zinc-900 text-zinc-200"
              }`}
            >
              <span className="block text-sm font-semibold">{preset.name}</span>
              <span className="mt-0.5 block text-[11px] text-zinc-500">
                {preset.subtitle}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 sm:grid-cols-3">
        <ConfigField
          label="Rondas"
          value={config.rounds}
          disabled={!isEditable}
          onChange={(rounds) => patchConfig({ rounds })}
        />
        <ConfigField
          label="Ronda (min)"
          value={config.roundDurationSec / 60}
          disabled={!isEditable}
          onChange={(minutes) => patchConfig({ roundDurationSec: minutes * 60 })}
        />
        <ConfigField
          label="Descanso (min)"
          value={config.restDurationSec / 60}
          min={0}
          step={0.5}
          disabled={!isEditable}
          onChange={(minutes) =>
            patchConfig({ restDurationSec: Math.round(minutes * 60) })
          }
        />
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-400">
          {phaseLabel}
        </p>
        <p className="mt-3 font-mono text-6xl font-bold tabular-nums text-zinc-50">
          {formatDurationMs(primaryTime)}
        </p>
        <p className="mt-4 text-sm text-zinc-500">
          {snapshot.status === "idle" ? (
            <>
              Duración total:{" "}
              <span className="font-semibold text-amber-300">
                {formatDurationMs(totalDurationMs)}
              </span>
            </>
          ) : (
            <>
              Restante sesión: {formatDurationMs(snapshot.sessionRemainingMs)} · Ronda{" "}
              {snapshot.displayRound}/{config.rounds}
            </>
          )}
        </p>
      </section>

      <section className="flex flex-wrap justify-center gap-3">
        {snapshot.status === "idle" && (
          <button
            type="button"
            onClick={start}
            className="min-h-12 min-w-[9.5rem] rounded-full bg-amber-500 px-6 text-sm font-semibold text-zinc-950"
          >
            Iniciar
          </button>
        )}
        {snapshot.status === "running" && (
          <button
            type="button"
            onClick={pause}
            className="min-h-12 min-w-[9.5rem] rounded-full bg-zinc-100 px-6 text-sm font-semibold text-zinc-900"
          >
            Pausar
          </button>
        )}
        {snapshot.status === "paused" && (
          <button
            type="button"
            onClick={resume}
            className="min-h-12 min-w-[9.5rem] rounded-full bg-amber-500 px-6 text-sm font-semibold text-zinc-950"
          >
            Reanudar
          </button>
        )}
        {snapshot.status !== "idle" && (
          <button
            type="button"
            onClick={reset}
            className="min-h-12 min-w-[9.5rem] rounded-full border border-zinc-600 px-6 text-sm font-semibold text-zinc-200"
          >
            Reiniciar
          </button>
        )}
      </section>
    </div>
  );
}
