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
  const hasLogo = Boolean(logoDataUrl);

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

  const chromeClass = isFullscreen
    ? "pointer-events-auto opacity-[0.22] transition-opacity duration-200 hover:opacity-95"
    : "pointer-events-auto opacity-100";

  return (
    <div
      ref={containerRef}
      className="relative h-dvh w-full overflow-hidden bg-black text-white"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,197,24,0.07),transparent_58%)]" />

      <header
        className={`absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-3 py-2 sm:px-6 sm:py-3 ${chromeClass}`}
      >
        <Link
          href={controlHref}
          className="min-h-9 rounded-full border border-zinc-700/80 bg-zinc-950/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 sm:min-h-10 sm:px-4 sm:text-xs"
        >
          Control
        </Link>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-600 sm:text-xs">
          Open Mat · TV
        </p>
        <button
          type="button"
          onClick={() => void toggle(containerRef.current)}
          className="min-h-9 rounded-full border border-zinc-700/80 bg-zinc-950/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 sm:min-h-10 sm:px-4 sm:text-xs"
        >
          {isFullscreen ? "Salir FS" : "Pantalla completa"}
        </button>
      </header>

      {!isFullscreen && roomCode && (
        <aside className="absolute right-2 bottom-2 z-20 max-w-[min(17rem,34vw)] opacity-75 sm:right-4 sm:bottom-4">
          <RemotePairingPanel variant="tv" layout="compact" />
        </aside>
      )}

      <main className="flex h-full w-full items-center justify-center px-2 pb-2 pt-12 sm:px-4 sm:pt-14">
        <div className="tv-stage flex h-full max-h-full w-full max-w-full flex-col items-center justify-center rounded-xl border border-zinc-900/50 bg-zinc-950/30 px-[3%] py-[2%]">
          {hasLogo ? (
            <TvAcademyLogo logoDataUrl={logoDataUrl} variant="hero" />
          ) : (
            <div className="flex-[0_0_4%] shrink-0" aria-hidden />
          )}

          <p
            className={`shrink-0 text-[clamp(1rem,3.2vh,2.25rem)] font-bold uppercase tracking-[0.32em] ${accent} ${
              hasLogo ? "mt-[1%]" : "mt-[2%]"
            }`}
          >
            {title}
          </p>

          <p
            className={`mt-[1%] flex min-h-0 w-full flex-1 items-center justify-center font-mono font-bold leading-none tabular-nums tracking-tight ${glow} drop-shadow-[0_0_48px_rgba(245,197,24,0.12)] ${
              hasLogo
                ? "text-[clamp(3.5rem,20vh,11rem)]"
                : "text-[clamp(4.5rem,26vh,14rem)]"
            }`}
            aria-live="polite"
            aria-atomic="true"
          >
            {displayTime}
          </p>

          <p className="mt-[1%] shrink-0 text-[clamp(1.1rem,4.2vh,2.75rem)] font-semibold tabular-nums text-zinc-200">
            <span className="text-white">{currentRound}</span>
            <span className="mx-2 text-zinc-600">/</span>
            <span className="text-zinc-400">{config.rounds}</span>
          </p>

          {snapshot.status === "paused" && (
            <p className="mt-[1%] shrink-0 text-[clamp(0.85rem,2.5vh,1.5rem)] font-semibold uppercase tracking-[0.22em] text-zinc-400">
              Pausado
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
