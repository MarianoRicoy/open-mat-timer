import { useRef, useState } from "react";
import { useMobileTimer } from "@app/providers/LocalTimerProvider";
import { LogoScaledImage } from "@shared/components/LogoScaledImage";
import { readImageFileAsDataUrl } from "@shared/lib/logo";
import { MAX_LOGO_ZOOM, MIN_LOGO_ZOOM } from "@shared/lib/logo-zoom";

export function MobileLogoControl() {
  const { logoDataUrl, logoZoom, setLogo, setLogoZoom } = useMobileTimer();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const onPickFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    setError(null);
    const dataUrl = await readImageFileAsDataUrl(file);
    if (!dataUrl) {
      setError("No se pudo leer la imagen. Usá PNG, JPG, WebP o SVG.");
      return;
    }
    const result = await setLogo(dataUrl);
    if (!result.ok) {
      setError("No se pudo guardar el logo.");
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
        Logo de academia
      </h2>
      <p className="mt-2 text-sm text-zinc-500">
        Se guarda en el teléfono. En una versión futura se enviará a la TV por
        Chromecast.
      </p>

      <div className="mt-4 flex h-28 items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/80 p-3">
        {logoDataUrl ? (
          <LogoScaledImage
            src={logoDataUrl}
            zoom={logoZoom}
            alt="Logo"
            className="flex h-full w-full items-center justify-center overflow-hidden"
            imgClassName="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-xs text-zinc-500">Sin logo</span>
        )}
      </div>

      {logoDataUrl && (
        <label className="mt-4 flex flex-col gap-2">
          <div className="flex justify-between text-sm text-zinc-400">
            <span>Zoom</span>
            <span className="font-mono">{logoZoom.toFixed(2)}×</span>
          </div>
          <input
            type="range"
            min={MIN_LOGO_ZOOM}
            max={MAX_LOGO_ZOOM}
            step={0.05}
            value={logoZoom}
            onChange={(e) => setLogoZoom(Number.parseFloat(e.target.value))}
            className="accent-amber-500"
          />
        </label>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            void onPickFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="min-h-11 rounded-full bg-zinc-100 px-5 text-sm font-semibold text-zinc-900"
        >
          {logoDataUrl ? "Reemplazar" : "Cargar logo"}
        </button>
        {logoDataUrl && (
          <button
            type="button"
            onClick={() => void setLogo(null)}
            className="min-h-11 rounded-full border border-zinc-600 px-5 text-sm font-semibold text-zinc-200"
          >
            Quitar
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </section>
  );
}
