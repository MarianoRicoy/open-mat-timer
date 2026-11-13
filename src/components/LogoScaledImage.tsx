"use client";

import { useCallback, useMemo, useState } from "react";
import { measureLogoContentBoost } from "@/lib/logo-trim";
import { clampLogoZoom } from "@/lib/logo-zoom";

interface LogoScaledImageProps {
  src: string;
  zoom: number;
  alt: string;
  className?: string;
  imgClassName?: string;
}

export function LogoScaledImage({
  src,
  zoom,
  alt,
  className,
  imgClassName,
}: LogoScaledImageProps) {
  const [contentBoost, setContentBoost] = useState(1);
  const userZoom = clampLogoZoom(zoom);
  const totalScale = useMemo(
    () => Math.min(4.25, userZoom * contentBoost),
    [userZoom, contentBoost],
  );

  const onLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    setContentBoost(measureLogoContentBoost(event.currentTarget));
  }, []);

  return (
    <div className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element -- user data URL */}
      <img
        src={src}
        alt={alt}
        onLoad={onLoad}
        className={imgClassName}
        style={{
          transform: totalScale > 1 ? `scale(${totalScale})` : undefined,
          transformOrigin: "center",
        }}
      />
    </div>
  );
}
