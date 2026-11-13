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
  const { config, snapshot, roomCode, logoDataUrl, logoZoom } = useTimerContext();
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
    ? "pointer-events-auto opacity-[0.18] transition-opacity duration-200 hover:opacity-90"
    : "pointer-events-auto opacity-100";

  const showRoundMeta =
    snapshot.status !== "idle" && snapshot.status !== "completed";

  return (
    <div
      ref={containerRef}
      className="relative h-dvh w-full overflow-hidden bg-black text-white"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_62%,rgba(245,197,24,0.08),transparent_55%)]" />

      <header
        className={`absolute start-0 end-0 top-0 z-30 flex items-start justify-between gap-2 px-2 py-2 sm:px-4 ${chromeClass}`}
      >
        <Link
          href={controlHref}
          className="min-h-8 rounded-full border border-zinc-800/90 bg-black/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 sm:min-h-9 sm:text-xs"
        >
          Control
        </Link>
        <p className="hidden pt-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-700 sm:block sm:text-xs">
          Open Mat · TV
        </p>
        <button
          type="button"
          onClick={() => void toggle(containerRef.current)}
          className="min-h-8 rounded-full border border-zinc-800/90 bg-black/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 sm:min-h-9 sm:text-xs"
        >
          {isFullscreen ? "Salir FS" : "Pantalla completa"}
        </button>
      </header>

      {!isFullscreen && roomCode && (
        <aside className="absolute end-2 bottom-2 z-20 max-w-[min(16rem,32vw)] opacity-70 sm:end-3 sm:bottom-3">
          <RemotePairingPanel variant="tv" layout="compact" />
        </aside>
      )}

      <main className="flex h-dvh w-full items-center justify-center px-1 pb-1 pt-10 sm:px-2 sm:pt-11">
        <div className="tv-stage relative flex h-full max-h-full w-full max-w-full flex-col items-center overflow-hidden rounded-lg border border-zinc-900/40 bg-zinc-950/20 px-[2%] pb-[2.5%] pt-[1.5%]">
          {hasLogo ? (
            <TvAcademyLogo
              logoDataUrl={logoDataUrl}
              logoZoom={logoZoom}
              variant="hero"
            />
          ) : (
            <div className="flex-[0_0_12%] shrink-0" aria-hidden />
          )}

          <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-[clamp(0.5rem,1.8vh,1.25rem)]">
            <p
              className={`shrink-0 text-center text-[clamp(1.05rem,3.4vh,2.5rem)] font-bold uppercase tracking-[0.28em] ${accent}`}
            >
              <span>{title}</span>
              {showRoundMeta && (
                <span className="ml-[0.35em] font-mono tracking-[0.12em] text-zinc-100">
                  {currentRound}
                  <span className="mx-1 text-zinc-600">/</span>
                  {config.rounds}
                </span>
              )}
            </p>

            <p
              className={`shrink-0 font-mono font-bold leading-none tabular-nums tracking-tight ${glow} drop-shadow-[0_0_56px_rgba(245,197,24,0.14)] ${
                hasLogo
                  ? "text-[clamp(4.5rem,22vh,14rem)]"
                  : "text-[clamp(5rem,26vh,15rem)]"
              }`}
              aria-live="polite"
              aria-atomic="true"
            >
              {displayTime}
            </p>

            {snapshot.status === "paused" && (
              <p className="shrink-0 text-[clamp(0.8rem,2.2vh,1.35rem)] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Pausado
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
