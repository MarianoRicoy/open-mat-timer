"use client";

import { useRef, useState } from "react";
import { useTimerContext } from "@/contexts/TimerProvider";
import { readImageFileAsDataUrl } from "@/lib/logo";

export function AcademyLogoControl() {
  const { logoDataUrl, setLogo, isRemoteMode } = useTimerContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const onPickFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setError(null);
    const dataUrl = await readImageFileAsDataUrl(file);
    if (!dataUrl) {
      setError("Usá PNG, JPG o WebP de hasta 400 KB.");
      return;
    }

    setLogo(dataUrl);
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
        Logo en TV
      </h2>
      <p className="mt-2 text-sm text-zinc-500">
        Subí el logo de la academia para la vista TV (hasta ~25 % de alto y 55 %
        de ancho del área 16:9). No afecta el cronómetro en curso.
        {isRemoteMode ? " Se sincroniza con la sala vinculada." : ""} Si el
        archivo tiene mucho margen transparente, puede verse chico hasta que la
        app lo compensa automáticamente.
      </p>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-24 w-full max-w-[220px] items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/80 p-3">
          {logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL from user upload
            <img
              src={logoDataUrl}
              alt="Vista previa del logo"
              className="max-h-20 max-w-full object-contain"
            />
          ) : (
            <span className="text-xs text-zinc-500">Sin logo</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
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
                setLogo(null);
              }}
              className="min-h-11 rounded-full border border-zinc-600 px-5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-400"
            >
              Quitar
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </section>
  );
}
