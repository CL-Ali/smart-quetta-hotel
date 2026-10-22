/**
 * Ultra-low-latency Web Audio sound effects for Smart Hotel touch POS & customer menu
 * Generates instant acoustic feedback with zero network latency.
 */

let audioCtx: AudioContext | null = null;
let isSoundEnabled = true;

export function setGlobalSoundEnabled(enabled: boolean) {
  isSoundEnabled = enabled;
}

export function isGlobalSoundEnabled(): boolean {
  return isSoundEnabled;
}

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/** Pre-unlock audio context on user interaction to avoid browser autoplay restrictions */
export function unlockAudio() {
  if (!isSoundEnabled) return;
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

/** Crisp tactile tap sound for quick food selection & buttons */
export function playTapSound() {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.035);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  } catch {
    // Graceful fallback
  }
}

/** Upbeat melodic cart addition pop sound */
export function playCartAddSound() {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const now = ctx.currentTime;

    // Tone 1: C5
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.08);

    // Tone 2: G5
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(783.99, now + 0.06);
    gain2.gain.setValueAtTime(0.22, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.18);
  } catch {
    // Graceful fallback
  }
}

/**
 * Rich, resonant celebratory fanfare tune for successful order placement
 * Plays a triumphant 4-note ascending chord arpeggio with warm harmonics and shimmering decay
 */
export function playOrderSuccessSound() {
  if (!isSoundEnabled) return;
  try {
    // Trigger tactile haptic vibration on mobile devices
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([60, 40, 100, 50, 180]);
    }

    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Fanfare Notes: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz), + High Shimmer (2093Hz)
    const notes = [
      { freq: 523.25, time: 0.00, dur: 0.22, gain: 0.28, type: "triangle" as OscillatorType },
      { freq: 659.25, time: 0.09, dur: 0.24, gain: 0.32, type: "triangle" as OscillatorType },
      { freq: 783.99, time: 0.18, dur: 0.28, gain: 0.35, type: "sine" as OscillatorType },
      { freq: 1046.50, time: 0.27, dur: 0.65, gain: 0.40, type: "sine" as OscillatorType },
      // Harmonic octave sparkle shimmer
      { freq: 2093.00, time: 0.32, dur: 0.55, gain: 0.18, type: "sine" as OscillatorType },
      // Warm bass foundation pad
      { freq: 261.63, time: 0.00, dur: 0.85, gain: 0.20, type: "sine" as OscillatorType },
    ];

    notes.forEach(({ freq, time, dur, gain: peakGain, type }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + time);

      // Envelope: gentle attack, sustain, exponential decay
      gain.gain.setValueAtTime(0.001, now + time);
      gain.gain.linearRampToValueAtTime(peakGain, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur);
    });
  } catch {
    // Graceful fallback if audio is blocked
  }
}

