"use client";

interface TvAcademyLogoProps {
  logoDataUrl: string | null;
  compact?: boolean;
}

export function TvAcademyLogo({ logoDataUrl, compact = false }: TvAcademyLogoProps) {
  if (!logoDataUrl) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- synced data URL from session
    <img
      src={logoDataUrl}
      alt="Logo de la academia"
      className={
        compact
          ? "max-h-12 max-w-[10rem] object-contain sm:max-h-14 sm:max-w-[12rem]"
          : "max-h-[clamp(3rem,8vw,5.5rem)] max-w-[min(40vw,22rem)] object-contain"
      }
    />
  );
}
