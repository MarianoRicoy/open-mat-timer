"use client";

import { useCallback, useState } from "react";
import { measureLogoContentBoost } from "@/lib/logo-trim";

interface TvAcademyLogoProps {
  logoDataUrl: string | null;
  variant?: "hero";
}

export function TvAcademyLogo({
  logoDataUrl,
  variant = "hero",
}: TvAcademyLogoProps) {
  const [contentBoost, setContentBoost] = useState(1);

  const onLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    setContentBoost(measureLogoContentBoost(event.currentTarget));
  }, []);

  if (!logoDataUrl || variant !== "hero") {
    return null;
  }

  return (
    <div
      className="flex min-h-0 w-[55%] max-w-[55%] flex-[0_0_25%] items-center justify-center px-[2%]"
    >
      <div className="flex h-full w-full items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- synced data URL from session */}
        <img
          src={logoDataUrl}
          alt="Logo de la academia"
          onLoad={onLoad}
          className="max-h-full max-w-full object-contain object-center"
          style={{
            transform: contentBoost > 1 ? `scale(${contentBoost})` : undefined,
            transformOrigin: "center",
          }}
        />
      </div>
    </div>
  );
}
