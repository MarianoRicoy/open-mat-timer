"use client";

import Link from "next/link";
import { useRef } from "react";
import { useTimerContext } from "@/contexts/TimerProvider";
import { RemotePairingPanel } from "@/components/RemotePairingPanel";
import { TvAcademyLogo } from "@/components/TvAcademyLogo";
import { useFullscreen } from "@/hooks/useFullscreen";
import { formatDurationMs } from "@/lib/timer";

function phaseTitle(
  status: string,
  phaseKind: "round" | "rest" | undefined,
): string {
  if (status === "completed") {
    return "FIN";
  }

  if (status === "idle") {
    return "LISTO";
  }

  if (phaseKind === "rest") {
    return "DESCANSO";
  }

  return "RONDA";
}

export function TvTimerView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { config, snapshot, roomCode, logoDataUrl } = useTimerContext();
  const { isFullscreen, toggle } = useFullscreen<HTMLDivElement>();
  const controlHref = roomCode ? `/?room=${roomCode}` : "/";

  const displayTime =
    snapshot.status === "idle"
      ? formatDurationMs(snapshot.totalDurationMs)
      : formatDurationMs(snapshot.phaseRemainingMs);

  const title = phaseTitle(snapshot.status, snapshot.phase?.kind);
  const isRest = snapshot.phase?.kind === "rest";
  const isFight = snapshot.phase?.kind === "round" && snapshot.status !== "idle";
  const accent = isRest ? "text-cyan-400" : isFight ? "text-amber-400" : "text-zinc-300";
  const glow = isRest ? "text-cyan-300" : isFight ? "text-amber-300" : "text-white";

  const currentRound =
    snapshot.status === "idle"
      ? 1
      : snapshot.status === "completed"
        ? config.rounds
        : snapshot.displayRound;

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-dvh w-full flex-col bg-black text-white"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,197,24,0.08),transparent_55%)]" />

      <header className="relative z-10 flex items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-5">
        <Link
          href={controlHref}
          className="pointer-events-auto min-h-10 rounded-full border border-zinc-700/80 bg-zinc-950/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-300 transition hover:border-zinc-500 hover:text-white sm:text-sm"
        >
          Control
        </Link>
        {logoDataUrl ? (
          <TvAcademyLogo logoDataUrl={logoDataUrl} compact />
        ) : (
          <p className="text-xs font-semibold uppercase tracking-[0.45em] text-zinc-500 sm:text-sm">
            Open Mat · TV
          </p>
        )}
        <button
          type="button"
          onClick={() => void toggle(containerRef.current)}
          className="pointer-events-auto min-h-10 rounded-full border border-zinc-700/80 bg-zinc-950/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-300 transition hover:border-amber-500/60 hover:text-amber-200 sm:text-sm"
        >
          {isFullscreen ? "Salir pantalla completa" : "Pantalla completa"}
        </button>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-4 sm:px-10">
        {!isFullscreen && <RemotePairingPanel variant="tv" />}
        <div className="flex aspect-video w-full max-w-[1600px] flex-col items-center justify-center rounded-2xl border border-zinc-900/80 bg-zinc-950/40 px-4 py-8 sm:px-12 sm:py-10">
          <div className="mb-4 flex min-h-[3.5rem] items-center justify-center">
            <TvAcademyLogo logoDataUrl={logoDataUrl} />
          </div>
          <p
            className={`text-[clamp(1.25rem,3.5vw,2.5rem)] font-bold uppercase tracking-[0.35em] ${accent}`}
          >
            {title}
          </p>

          <p
            className={`mt-2 font-mono text-[clamp(4.5rem,22vw,14rem)] font-bold leading-none tabular-nums tracking-tight ${glow} drop-shadow-[0_0_40px_rgba(245,197,24,0.15)]`}
            aria-live="polite"
            aria-atomic="true"
          >
            {displayTime}
          </p>

          <p className="mt-6 text-[clamp(1.5rem,4vw,3rem)] font-semibold tabular-nums text-zinc-200">
            <span className="text-white">{currentRound}</span>
            <span className="mx-2 text-zinc-600">/</span>
            <span className="text-zinc-400">{config.rounds}</span>
          </p>

          {snapshot.status === "paused" && (
            <p className="mt-4 text-[clamp(1rem,2.5vw,1.75rem)] font-semibold uppercase tracking-[0.25em] text-zinc-400">
              Pausado
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
