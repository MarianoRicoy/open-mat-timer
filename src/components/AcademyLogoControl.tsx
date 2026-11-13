"use client";

import { useRef, useState } from "react";
import { useTimerContext } from "@/contexts/TimerProvider";
import { LogoScaledImage } from "@/components/LogoScaledImage";
import { readImageFileAsDataUrl } from "@/lib/logo";
import { MAX_LOGO_ZOOM, MIN_LOGO_ZOOM } from "@/lib/logo-zoom";

export function AcademyLogoControl() {
  const { logoDataUrl, logoZoom, setLogo, setLogoZoom, isRemoteMode } =
    useTimerContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const onPickFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setError(null);
    setNotice(null);
    const dataUrl = await readImageFileAsDataUrl(file);
    if (!dataUrl) {
      setError("No se pudo leer la imagen. Usá PNG, JPG, WebP o SVG.");
      return;
    }

    const result = await setLogo(dataUrl);
    if (!result.ok) {
      setError(
        isRemoteMode
          ? "No se pudo enviar el logo a la sala. Revisá la vinculación."
          : "No se pudo guardar el logo.",
      );
      return;
    }

    if (result.message) {
      setNotice(result.message);
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
        Logo en TV
      </h2>
      <p className="mt-2 text-sm text-zinc-500">
        Subí PNG, JPG, WebP o SVG. Ajustá el zoom si el archivo trae margen negro
        opaco o transparente alrededor del dibujo.
        {isRemoteMode ? " Se sincroniza con la sala vinculada." : ""}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/80 p-3">
          {logoDataUrl ? (
            <LogoScaledImage
              src={logoDataUrl}
              zoom={logoZoom}
              alt="Vista previa del logo"
              className="flex h-full w-full items-center justify-center overflow-hidden"
              imgClassName="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="text-xs text-zinc-500">Sin logo</span>
          )}
        </div>

        <div className="flex flex-col justify-center rounded-xl border border-zinc-800 bg-black p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Vista aprox. TV (16:9)
          </p>
          <div className="mt-2 aspect-video w-full overflow-hidden rounded-md border border-zinc-900 bg-black">
            {logoDataUrl ? (
              <div className="flex h-full flex-col items-center px-2 pt-2">
                <div className="flex h-[42%] w-[70%] items-center justify-center overflow-hidden">
                  <LogoScaledImage
                    src={logoDataUrl}
                    zoom={logoZoom}
                    alt=""
                    className="flex h-full w-full items-center justify-center"
                    imgClassName="max-h-full max-w-full object-contain"
                  />
                </div>
                <p className="mt-auto pb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-amber-500/80">
                  Ronda · reloj
                </p>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-zinc-600">
                Sin logo
              </div>
            )}
          </div>
        </div>
      </div>

      {logoDataUrl && (
        <label className="mt-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-zinc-400">
            <span className="font-medium">Zoom en TV</span>
            <span className="font-mono text-zinc-200">{logoZoom.toFixed(2)}×</span>
          </div>
          <input
            type="range"
            min={MIN_LOGO_ZOOM}
            max={MAX_LOGO_ZOOM}
            step={0.05}
            value={logoZoom}
            onChange={(event) => setLogoZoom(Number.parseFloat(event.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-amber-500"
          />
          <p className="text-xs text-zinc-600">
            El auto-zoom detecta transparencia y letterbox negro. Este control se
            suma sin recortar el diseño.
          </p>
        </label>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            void onPickFile(file);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="min-h-11 rounded-full bg-zinc-100 px-5 text-sm font-semibold text-zinc-900 transition hover:bg-white"
        >
          {logoDataUrl ? "Reemplazar" : "Cargar logo"}
        </button>
        {logoDataUrl && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setNotice(null);
              void setLogo(null);
            }}
            className="min-h-11 rounded-full border border-zinc-600 px-5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-400"
          >
            Quitar
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      {notice && <p className="mt-2 text-sm text-amber-300">{notice}</p>}
    </section>
  );
}
