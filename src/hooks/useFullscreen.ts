"use client";

import { useCallback, useEffect, useState } from "react";

export function useFullscreen<T extends HTMLElement>() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
    };
  }, []);

  const enter = useCallback(async (node: T | null) => {
    if (!node || document.fullscreenElement) {
      return;
    }

    try {
      await node.requestFullscreen();
    } catch {
      /* user gesture or browser policy */
    }
  }, []);

  const exit = useCallback(async () => {
    if (!document.fullscreenElement) {
      return;
    }

    try {
      await document.exitFullscreen();
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(
    async (node: T | null) => {
      if (document.fullscreenElement) {
        await exit();
        return;
      }

      await enter(node);
    },
    [enter, exit],
  );

  return { isFullscreen, toggle, enter, exit };
}
