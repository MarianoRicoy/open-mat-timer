type BeepPattern = {
  frequency: number;
  durationMs: number;
  gapMs?: number;
};

async function playPattern(pattern: BeepPattern[], volume = 0.35): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const AudioContextClass =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  const context = new AudioContextClass();
  if (context.state === "suspended") {
    await context.resume();
  }

  let offsetMs = 0;

  for (const step of pattern) {
    const startAt = context.currentTime + offsetMs / 1000;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = step.frequency;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + step.durationMs / 1000);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + step.durationMs / 1000 + 0.05);

    offsetMs += step.durationMs + (step.gapMs ?? 0);
  }

  window.setTimeout(() => {
    void context.close();
  }, offsetMs + 200);
}

export function playRoundStartSound(): void {
  void playPattern([
    { frequency: 880, durationMs: 120, gapMs: 80 },
    { frequency: 1174, durationMs: 180 },
  ]);
}

export function playRoundEndSound(): void {
  void playPattern([{ frequency: 440, durationMs: 420 }]);
}
