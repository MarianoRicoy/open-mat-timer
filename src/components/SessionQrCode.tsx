"use client";

import { QRCodeSVG } from "qrcode.react";

export function SessionQrCode({ value }: { value: string }) {
  return (
    <QRCodeSVG
      value={value}
      size={168}
      bgColor="#09090b"
      fgColor="#fafafa"
      level="M"
      marginSize={2}
      className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
    />
  );
}
