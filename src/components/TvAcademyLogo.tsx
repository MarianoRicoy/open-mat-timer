"use client";

import { LogoScaledImage } from "@/components/LogoScaledImage";

interface TvAcademyLogoProps {
  logoDataUrl: string | null;
  logoZoom: number;
  variant?: "hero";
}

export function TvAcademyLogo({
  logoDataUrl,
  logoZoom,
  variant = "hero",
}: TvAcademyLogoProps) {
  if (!logoDataUrl || variant !== "hero") {
    return null;
  }

  return (
    <div className="flex min-h-0 w-[78%] max-w-[78%] flex-[0_0_38%] items-center justify-center overflow-hidden px-[1%]">
      <LogoScaledImage
        src={logoDataUrl}
        zoom={logoZoom}
        alt="Logo de la academia"
        className="flex h-full w-full items-center justify-center"
        imgClassName="max-h-full max-w-full object-contain object-center"
      />
    </div>
  );
}
