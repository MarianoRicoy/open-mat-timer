"use client";

import { useEffect, useMemo, useState } from "react";
import { useTimerContext } from "@/contexts/TimerProvider";
import { normalizeRoomCode } from "@/lib/remote/session-store";
import { SessionQrCode } from "@/components/SessionQrCode";

interface RemotePairingPanelProps {
  variant: "control" | "tv";
}

export function RemotePairingPanel({ variant }: RemotePairingPanelProps) {
  const {
    roomCode,
    isRemoteMode,
    remoteConnected,
    remoteError,
    joinRoom,
    leaveRoom,
    ensureHostRoom,
  } = useTimerContext();
  const [inputCode, setInputCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const mountTimeout = window.setTimeout(() => {
      setIsClient(true);
    }, 0);
    return () => {
      window.clearTimeout(mountTimeout);
    };
  }, []);

  useEffect(() => {
    if (variant !== "tv" || roomCode) {
      return;
    }

    void ensureHostRoom();
  }, [variant, roomCode, ensureHostRoom]);

  const pairingUrl =
    isClient && roomCode ? `${window.location.origin}/?room=${roomCode}` : null;

  const formattedCode = useMemo(
    () => (roomCode ? roomCode.split("").join(" ") : ""),
    [roomCode],
  );

  const onJoin = async () => {
    setJoinError(null);
    setIsJoining(true);
    const ok = await joinRoom(inputCode);
    setIsJoining(false);

    if (!ok) {
      setJoinError(remoteError ?? "No se pudo vincular");
    }
  };

  if (variant === "control" && isRemoteMode) {
    return (
      <section className="rounded-2xl border border-emerald-700/40 bg-emerald-950/20 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-emerald-100">
            <p className="font-semibold">Vinculado a la sala</p>
            <p className="mt-1 font-mono text-lg tracking-[0.3em]">{formattedCode}</p>
            <p className="mt-1 text-xs text-emerald-300/80">
              {remoteConnected ? "Sincronizado con la TV" : "Reconectando…"}
            </p>
          </div>
          <button
            type="button"
            onClick={leaveRoom}
            className="min-h-10 rounded-full border border-emerald-600/60 px-4 text-xs font-semibold uppercase tracking-wide text-emerald-100"
          >
            Desvincular
          </button>
        </div>
      </section>
    );
  }

  if (variant === "control") {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
          Control remoto (misma red Wi‑Fi)
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Escaneá el QR de la TV o ingresá el código de 6 caracteres. Sin internet
          externo: solo tu red local y este servidor.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={inputCode}
            onChange={(event) => {
              setInputCode(normalizeRoomCode(event.target.value).slice(0, 6));
              setJoinError(null);
            }}
            placeholder="Código sala"
            className="min-h-12 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 font-mono text-lg tracking-[0.35em] text-zinc-100 uppercase outline-none ring-amber-500/40 focus:ring-2"
          />
          <button
            type="button"
            disabled={inputCode.length < 6 || isJoining}
            onClick={() => void onJoin()}
            className="min-h-12 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
          >
            {isJoining ? "Vinculando…" : "Vincular"}
          </button>
        </div>
        {joinError && <p className="mt-2 text-sm text-red-400">{joinError}</p>}
        <p className="mt-3 text-xs text-zinc-500">
          Sin vincular, el cronómetro funciona solo en este dispositivo (offline).
        </p>
      </section>
    );
  }

  return (
    <section className="mb-6 w-full max-w-[1600px] rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-6">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
            Vincular celular
          </p>
          <p className="mt-2 font-mono text-4xl font-bold tracking-[0.35em] text-white sm:text-5xl">
            {formattedCode || "······"}
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Escaneá el QR o ingresá el código en el panel de control.
          </p>
          {remoteError && (
            <p className="mt-2 text-sm text-red-400">{remoteError}</p>
          )}
        </div>
        {pairingUrl && (
          <div className="flex flex-col items-center gap-2">
            <SessionQrCode value={pairingUrl} />
            <p className="max-w-[12rem] break-all text-center text-[10px] text-zinc-500">
              {pairingUrl}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
