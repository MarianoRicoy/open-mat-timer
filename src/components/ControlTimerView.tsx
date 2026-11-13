"use client";

import Link from "next/link";
import { useTimerContext } from "@/contexts/TimerProvider";
import { RemotePairingPanel } from "@/components/RemotePairingPanel";
import { computeTotalDurationMs, formatDurationMs } from "@/lib/timer";

function ConfigField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-zinc-400">
      <span className="font-medium">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          if (!Number.isNaN(parsed) && parsed >= 1) {
            onChange(parsed);
          }
        }}
        className="min-h-12 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-xl text-zinc-100 outline-none ring-amber-500/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </label>
  );
}

export function ControlTimerView() {
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
    roomCode,
  } = useTimerContext();

  const totalDurationMs = computeTotalDurationMs(config);
  const tvHref = roomCode ? `/tv?room=${roomCode}` : "/tv";

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
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-6 pb-10 sm:gap-8 sm:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-500">
            Open Mat Timer
          </p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-50 sm:text-3xl">
            Panel de control
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Configurá desde el celular y mostrá el cronómetro en la TV.
          </p>
        </div>
        <Link
          href={tvHref}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 px-5 text-sm font-semibold text-zinc-100 transition hover:border-amber-500/60 hover:text-amber-300"
        >
          Vista TV
        </Link>
      </header>

      <RemotePairingPanel variant="control" />

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
            Presets
          </h2>
          <button
            type="button"
            onClick={toggleSoundsMuted}
            className="min-h-10 rounded-full border border-zinc-700 px-4 text-xs font-semibold uppercase tracking-wide text-zinc-300 transition hover:border-zinc-500"
            aria-pressed={soundsMuted}
          >
            {soundsMuted ? "Sonido off" : "Sonido on"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {presets.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={!isEditable}
                onClick={() => applyPreset(preset)}
                className={`min-h-16 rounded-xl border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  isActive
                    ? "border-amber-500/80 bg-amber-500/10 text-amber-100"
                    : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-500"
                }`}
              >
                <span className="block text-sm font-semibold">{preset.name}</span>
                <span className="mt-0.5 block text-[11px] leading-tight text-zinc-500">
                  {preset.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 sm:grid-cols-3 sm:p-5">
        <ConfigField
          label="Rondas"
          value={config.rounds}
          disabled={!isEditable}
          onChange={(rounds) => patchConfig({ rounds })}
        />
        <ConfigField
          label="Ronda (seg)"
          value={config.roundDurationSec}
          disabled={!isEditable}
          onChange={(roundDurationSec) => patchConfig({ roundDurationSec })}
        />
        <ConfigField
          label="Descanso (seg)"
          value={config.restDurationSec}
          disabled={!isEditable}
          onChange={(restDurationSec) => patchConfig({ restDurationSec })}
        />
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 text-center sm:p-8">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-400">
          {phaseLabel}
        </p>
        <p
          className="mt-3 font-mono text-6xl font-bold tabular-nums tracking-tight text-zinc-50 sm:text-7xl"
          aria-live="polite"
          aria-atomic="true"
        >
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
              Restante sesión:{" "}
              <span className="font-medium text-zinc-300">
                {formatDurationMs(snapshot.sessionRemainingMs)}
              </span>
              {" · "}
              Ronda {snapshot.displayRound}/{config.rounds}
            </>
          )}
        </p>
      </section>

      <section className="flex flex-wrap justify-center gap-3">
        {snapshot.status === "idle" && (
          <button
            type="button"
            onClick={start}
            className="min-h-12 min-w-[9.5rem] rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
          >
            Iniciar
          </button>
        )}
        {snapshot.status === "running" && (
          <button
            type="button"
            onClick={pause}
            className="min-h-12 min-w-[9.5rem] rounded-full bg-zinc-100 px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-white"
          >
            Pausar
          </button>
        )}
        {snapshot.status === "paused" && (
          <button
            type="button"
            onClick={resume}
            className="min-h-12 min-w-[9.5rem] rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
          >
            Reanudar
          </button>
        )}
        {snapshot.status !== "idle" && (
          <button
            type="button"
            onClick={reset}
            className="min-h-12 min-w-[9.5rem] rounded-full border border-zinc-600 px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-400 hover:text-white"
          >
            Reiniciar
          </button>
        )}
      </section>
    </div>
  );
}
