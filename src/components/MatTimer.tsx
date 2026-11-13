"use client";

import { useMatTimer } from "@/hooks/useMatTimer";
import { formatDurationMs } from "@/lib/timer";

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
    <label className="flex flex-col gap-1 text-sm text-zinc-400">
      <span>{label}</span>
      <input
        type="number"
        min={1}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          if (!Number.isNaN(parsed) && parsed >= 1) {
            onChange(parsed);
          }
        }}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-lg text-zinc-100 outline-none ring-amber-500/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </label>
  );
}

export function MatTimer() {
  const { config, patchConfig, snapshot, isEditable, start, pause, resume, reset } =
    useMatTimer();

  const phaseLabel =
    snapshot.status === "completed"
      ? "Sesión terminada"
      : snapshot.phase?.kind === "rest"
        ? `Descanso · antes de ronda ${snapshot.displayRound}`
        : `Ronda ${snapshot.displayRound} de ${config.rounds}`;

  const primaryTime =
    snapshot.status === "idle"
      ? snapshot.totalDurationMs
      : snapshot.phaseRemainingMs;

  const phaseAccent =
    snapshot.phase?.kind === "rest" ? "text-sky-400" : "text-amber-400";

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-10">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-500">
          Open Mat Timer
        </p>
        <h1 className="mt-2 text-3xl font-bold text-zinc-50">
          Cronómetro para el tatami
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Jiujitsu, MMA y entrenamiento por rondas — gratis para tu academia.
        </p>
      </header>

      <section className="grid grid-cols-3 gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
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

      <section className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-8 text-center shadow-2xl shadow-black/50">
        <p className={`text-sm font-medium uppercase tracking-wide ${phaseAccent}`}>
          {phaseLabel}
        </p>
        <p
          className="mt-4 font-mono text-7xl font-bold tabular-nums tracking-tight text-zinc-50 sm:text-8xl"
          aria-live="polite"
          aria-atomic="true"
        >
          {formatDurationMs(primaryTime)}
        </p>
        <p className="mt-4 text-sm text-zinc-500">
          {snapshot.status === "idle" ? (
            <>
              Tiempo total de la sesión:{" "}
              <span className="font-medium text-zinc-300">
                {formatDurationMs(snapshot.totalDurationMs)}
              </span>
            </>
          ) : (
            <>
              Restante en la sesión:{" "}
              <span className="font-medium text-zinc-300">
                {formatDurationMs(snapshot.sessionRemainingMs)}
              </span>
            </>
          )}
        </p>
      </section>

      <section className="flex flex-wrap justify-center gap-3">
        {snapshot.status === "idle" && (
          <button
            type="button"
            onClick={start}
            className="min-w-[9rem] rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
          >
            Iniciar
          </button>
        )}
        {snapshot.status === "running" && (
          <button
            type="button"
            onClick={pause}
            className="min-w-[9rem] rounded-full bg-zinc-100 px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-white"
          >
            Pausar
          </button>
        )}
        {snapshot.status === "paused" && (
          <button
            type="button"
            onClick={resume}
            className="min-w-[9rem] rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
          >
            Reanudar
          </button>
        )}
        {snapshot.status !== "idle" && (
          <button
            type="button"
            onClick={reset}
            className="min-w-[9rem] rounded-full border border-zinc-600 px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-400 hover:text-white"
          >
            Reiniciar
          </button>
        )}
      </section>
    </div>
  );
}
