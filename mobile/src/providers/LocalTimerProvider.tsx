import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { App } from "@capacitor/app";
import {
  completeTimer,
  createTimerState,
  getTimerSnapshot,
  isSessionComplete,
  pauseTimer,
  resetTimer,
  startTimer,
  updateTimerConfig,
  type SessionConfig,
  type TimerSnapshot,
  type TimerState,
} from "@shared/lib/timer";
import { TRAINING_PRESETS, type TrainingPreset } from "@shared/lib/presets";
import { isValidLogoDataUrl } from "@shared/lib/logo";
import { DEFAULT_LOGO_ZOOM, clampLogoZoom } from "@shared/lib/logo-zoom";
import { playRoundEndSound, playRoundStartSound } from "@shared/lib/sounds";
import { readPref, writePref } from "@app/storage/preferences";

const KEYS = {
  config: "omt:config",
  preset: "omt:preset",
  muted: "omt:sounds-muted",
  logo: "omt:logo",
  logoZoom: "omt:logo-zoom",
  session: "omt:session",
} as const;

const DEFAULT_CONFIG: SessionConfig = TRAINING_PRESETS[3]?.config ?? {
  rounds: 5,
  roundDurationSec: 300,
  restDurationSec: 60,
};

interface PersistedSession {
  config: SessionConfig;
  state: TimerState;
  activePresetId: string | null;
}

function getPhaseSignature(snapshot: TimerSnapshot): string {
  if (snapshot.status === "idle") {
    return "idle";
  }
  if (snapshot.status === "completed") {
    return "completed";
  }
  if (!snapshot.phase) {
    return snapshot.status;
  }
  return `${snapshot.phase.kind}-${snapshot.phase.roundNumber}`;
}

export interface MobileTimerContextValue {
  config: SessionConfig;
  snapshot: TimerSnapshot;
  isEditable: boolean;
  soundsMuted: boolean;
  activePresetId: string | null;
  presets: TrainingPreset[];
  logoDataUrl: string | null;
  logoZoom: number;
  patchConfig: (partial: Partial<SessionConfig>) => void;
  applyPreset: (preset: TrainingPreset) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  toggleSoundsMuted: () => void;
  setLogo: (logoDataUrl: string | null) => Promise<{ ok: boolean; message?: string }>;
  setLogoZoom: (zoom: number) => void;
  hydrated: boolean;
}

const TimerContext = createContext<MobileTimerContextValue | null>(null);

export function LocalTimerProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [config, setConfig] = useState<SessionConfig>(DEFAULT_CONFIG);
  const [state, setState] = useState<TimerState>(() => createTimerState(DEFAULT_CONFIG));
  const [nowMs, setNowMs] = useState(0);
  const [activePresetId, setActivePresetId] = useState<string | null>(
    TRAINING_PRESETS[3]?.id ?? null,
  );
  const [soundsMuted, setSoundsMuted] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoZoom, setLogoZoomState] = useState(DEFAULT_LOGO_ZOOM);
  const previousPhaseRef = useRef<string>("idle");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [
          configRaw,
          presetRaw,
          mutedRaw,
          logoRaw,
          zoomRaw,
          sessionRaw,
        ] = await Promise.all([
          readPref(KEYS.config),
          readPref(KEYS.preset),
          readPref(KEYS.muted),
          readPref(KEYS.logo),
          readPref(KEYS.logoZoom),
          readPref(KEYS.session),
        ]);

        if (cancelled) {
          return;
        }

        if (configRaw) {
          const parsed = JSON.parse(configRaw) as SessionConfig;
          setConfig(parsed);
        }

        if (presetRaw) {
          setActivePresetId(presetRaw);
        }

        if (mutedRaw === "true") {
          setSoundsMuted(true);
        }

        if (logoRaw && isValidLogoDataUrl(logoRaw)) {
          setLogoDataUrl(logoRaw);
        }

        if (zoomRaw) {
          const z = Number.parseFloat(zoomRaw);
          if (!Number.isNaN(z)) {
            setLogoZoomState(clampLogoZoom(z));
          }
        }

        if (sessionRaw) {
          const session = JSON.parse(sessionRaw) as PersistedSession;
          setConfig(session.config);
          setActivePresetId(session.activePresetId);
          const now = Date.now();
          let nextState = session.state;
          if (nextState.status === "running" && isSessionComplete(nextState, now)) {
            nextState = completeTimer(nextState);
          }
          setState(nextState);
        } else if (configRaw) {
          setState(createTimerState(JSON.parse(configRaw) as SessionConfig));
        }
      } catch {
        /* defaults */
      } finally {
        if (!cancelled) {
          setHydrated(true);
          setNowMs(Date.now());
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const persistSession = useCallback(
    async (nextConfig: SessionConfig, nextState: TimerState, presetId: string | null) => {
      if (nextState.status === "idle" || nextState.status === "completed") {
        await writePref(KEYS.session, null);
        return;
      }
      const payload: PersistedSession = {
        config: nextConfig,
        state: nextState,
        activePresetId: presetId,
      };
      await writePref(KEYS.session, JSON.stringify(payload));
    },
    [],
  );

  const persistConfig = useCallback(async (next: SessionConfig) => {
    await writePref(KEYS.config, JSON.stringify(next));
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void persistSession(config, state, activePresetId);
  }, [hydrated, config, state, activePresetId, persistSession]);

  useEffect(() => {
    const resumeClock = () => setNowMs(Date.now());

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        resumeClock();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    const sub = App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        resumeClock();
      }
    });

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      void sub.then((handle) => handle.remove());
    };
  }, []);

  const snapshot = useMemo(() => {
    const effectiveNow = nowMs > 0 ? nowMs : state.sessionStartMs ?? 0;
    return getTimerSnapshot({ ...state, config }, effectiveNow);
  }, [state, config, nowMs]);

  const isEditable = state.status === "idle" || state.status === "completed";

  useEffect(() => {
    if (state.status !== "running") {
      return;
    }

    let frameId = 0;
    const tick = () => {
      const currentNow = Date.now();
      setNowMs(currentNow);
      setState((currentState) => {
        if (currentState.status !== "running") {
          return currentState;
        }
        if (isSessionComplete(currentState, currentNow)) {
          return completeTimer(currentState);
        }
        return currentState;
      });
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [state.status]);

  useEffect(() => {
    const signature = getPhaseSignature(snapshot);
    if (signature === "idle") {
      previousPhaseRef.current = "idle";
      return;
    }
    if (previousPhaseRef.current === signature) {
      return;
    }
    const previous = previousPhaseRef.current;
    previousPhaseRef.current = signature;

    if (soundsMuted) {
      return;
    }

    if (signature === "completed") {
      playRoundEndSound();
      return;
    }
    if (snapshot.phase?.kind === "rest" && previous.startsWith("round")) {
      playRoundEndSound();
      return;
    }
    if (
      snapshot.phase?.kind === "round" &&
      (previous === "idle" || previous.startsWith("rest"))
    ) {
      playRoundStartSound();
    }
  }, [snapshot, soundsMuted]);

  const patchConfig = useCallback(
    (partial: Partial<SessionConfig>) => {
      if (!isEditable) {
        return;
      }
      setConfig((previous) => {
        const next = { ...previous, ...partial };
        setState((current) => {
          if (current.status === "idle") {
            return updateTimerConfig(current, next);
          }
          if (current.status === "completed") {
            return createTimerState(next);
          }
          return current;
        });
        setActivePresetId(null);
        void persistConfig(next);
        return next;
      });
    },
    [isEditable, persistConfig],
  );

  const applyPreset = useCallback(
    (preset: TrainingPreset) => {
      if (!isEditable) {
        return;
      }
      setConfig(preset.config);
      setActivePresetId(preset.id);
      setState(createTimerState(preset.config));
      void persistConfig(preset.config);
      void writePref(KEYS.preset, preset.id);
    },
    [isEditable, persistConfig],
  );

  const start = useCallback(() => {
    const now = Date.now();
    setNowMs(now);
    setState((current) => startTimer(current, now));
  }, []);

  const pause = useCallback(() => {
    const now = Date.now();
    setNowMs(now);
    setState((current) => pauseTimer(current, now));
  }, []);

  const resume = useCallback(() => {
    const now = Date.now();
    setNowMs(now);
    setState((current) => startTimer(current, now));
  }, []);

  const reset = useCallback(() => {
    const now = Date.now();
    setNowMs(now);
    setState(resetTimer(config));
    previousPhaseRef.current = "idle";
    void writePref(KEYS.session, null);
  }, [config]);

  const setLogo = useCallback(async (nextLogo: string | null) => {
    if (nextLogo !== null && !isValidLogoDataUrl(nextLogo)) {
      return { ok: false };
    }
    setLogoDataUrl(nextLogo);
    await writePref(KEYS.logo, nextLogo);
    return { ok: true };
  }, []);

  const setLogoZoom = useCallback((zoom: number) => {
    const next = clampLogoZoom(zoom);
    setLogoZoomState(next);
    void writePref(KEYS.logoZoom, String(next));
  }, []);

  const toggleSoundsMuted = useCallback(() => {
    setSoundsMuted((previous) => {
      const next = !previous;
      void writePref(KEYS.muted, String(next));
      return next;
    });
  }, []);

  const value = useMemo(
    (): MobileTimerContextValue => ({
      config,
      snapshot,
      isEditable,
      soundsMuted,
      activePresetId,
      presets: TRAINING_PRESETS,
      logoDataUrl,
      logoZoom,
      patchConfig,
      applyPreset,
      start,
      pause,
      resume,
      reset,
      toggleSoundsMuted,
      setLogo,
      setLogoZoom,
      hydrated,
    }),
    [
      config,
      snapshot,
      isEditable,
      soundsMuted,
      activePresetId,
      logoDataUrl,
      logoZoom,
      patchConfig,
      applyPreset,
      start,
      pause,
      resume,
      reset,
      toggleSoundsMuted,
      setLogo,
      setLogoZoom,
      hydrated,
    ],
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-zinc-500">
        Cargando…
      </div>
    );
  }

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useMobileTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) {
    throw new Error("useMobileTimer debe usarse dentro de LocalTimerProvider");
  }
  return ctx;
}
