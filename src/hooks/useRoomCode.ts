"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { normalizeRoomCode } from "@/lib/remote/session-store";

export function useRoomCode() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryRoom = searchParams.get("room");
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);

  const roomCode = queryRoom
    ? normalizeRoomCode(queryRoom)
    : joinedRoom
      ? normalizeRoomCode(joinedRoom)
      : null;

  function setRoomCode(code: string | null, options?: { updateUrl?: boolean }) {
    const normalized = code ? normalizeRoomCode(code) : null;
    setJoinedRoom(normalized);

    if (options?.updateUrl !== false) {
      const params = new URLSearchParams(searchParams.toString());
      if (normalized) {
        params.set("room", normalized);
      } else {
        params.delete("room");
      }

      const next = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
      router.replace(next);
    }
  }

  return { roomCode, setRoomCode };
}
