/**
 * Soft little sounds, made with the Web Audio API (no audio files to download).
 * Nothing can play until the player has tapped the screen once: browsers
 * require that, and it is also what we want.
 */
type AudioContextClass = typeof AudioContext;

let context: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

export function isSoundEnabled(): boolean {
  return enabled;
}

/** Call from a tap. Later calls wake the sound up again if the browser paused it. */
export function unlockAudio(): void {
  try {
    if (!context) {
      const Context: AudioContextClass | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextClass }).webkitAudioContext;
      if (!Context) return;
      context = new Context();
    }
    if (context.state === 'suspended') void context.resume();
  } catch {
    context = null;
  }
}

interface Note {
  /** Pitch in hertz. */
  freq: number;
  /** Seconds after the sound starts. */
  at?: number;
  /** Length in seconds. */
  length?: number;
  /** Pitch to glide to, for a "bloop". */
  glideTo?: number;
  volume?: number;
  wave?: OscillatorType;
}

function play(notes: Note[]): void {
  if (!enabled || !context || context.state !== 'running') return;
  try {
    const now = context.currentTime;
    for (const note of notes) {
      const start = now + (note.at ?? 0);
      const length = note.length ?? 0.16;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = note.wave ?? 'sine';
      oscillator.frequency.setValueAtTime(note.freq, start);
      if (note.glideTo) oscillator.frequency.exponentialRampToValueAtTime(note.glideTo, start + length);
      // A quick, gentle rise and a soft fade, so nothing clicks or startles.
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(note.volume ?? 0.07, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + length + 0.02);
    }
  } catch {
    // Sound is a nice extra; never let it break the game.
  }
}

/** A soft burst of filtered noise: a sizzle or a pour. */
function hiss(length: number, frequency: number, volume: number): void {
  if (!enabled || !context || context.state !== 'running') return;
  try {
    if (!noise) {
      noise = context.createBuffer(1, Math.floor(context.sampleRate * 0.6), context.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    }
    const now = context.currentTime;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = noise;
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = 0.8;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start(now);
    source.stop(now + length + 0.05);
  } catch {
    // Sound is a nice extra; never let it break the game.
  }
}

/** Every sound in the game. To change one, edit its notes here. */
export const sfx = {
  tap: () => play([{ freq: 520, length: 0.06, volume: 0.035, wave: 'triangle' }]),
  sizzle: () => hiss(0.45, 3200, 0.05),
  pour: () => hiss(0.35, 900, 0.06),
  drop: () => play([{ freq: 330, glideTo: 440, length: 0.12, wave: 'triangle' }]),
  ready: () =>
    play([
      { freq: 1319, length: 0.18, volume: 0.04 },
      { freq: 1760, at: 0.06, length: 0.25, volume: 0.03 },
    ]),
  plate: () => play([{ freq: 660, glideTo: 520, length: 0.1, volume: 0.05, wave: 'triangle' }]),
  deliver: () => play([{ freq: 523, glideTo: 784, length: 0.14 }]),
  arrive: () =>
    play([
      { freq: 988, length: 0.12, volume: 0.035 },
      { freq: 1319, at: 0.1, length: 0.2, volume: 0.03 },
    ]),
  served: () =>
    play([
      { freq: 659, length: 0.12 },
      { freq: 784, at: 0.1, length: 0.12 },
      { freq: 1047, at: 0.2, length: 0.3 },
    ]),
  coin: () =>
    play([
      { freq: 988, length: 0.09, volume: 0.05 },
      { freq: 1319, at: 0.07, length: 0.22, volume: 0.05 },
    ]),
  streak: (n: number) => {
    const base = 523 * 2 ** (Math.min(n, 6) / 12);
    play([
      { freq: base, length: 0.1, volume: 0.05 },
      { freq: base * 1.26, at: 0.08, length: 0.1, volume: 0.05 },
      { freq: base * 1.5, at: 0.16, length: 0.22, volume: 0.05 },
    ]);
  },
  star: (n: number) => play([{ freq: [784, 988, 1175][n] ?? 784, length: 0.3, volume: 0.06 }]),
  done: () =>
    play([
      { freq: 523, length: 0.14 },
      { freq: 659, at: 0.12, length: 0.14 },
      { freq: 784, at: 0.24, length: 0.14 },
      { freq: 1047, at: 0.36, length: 0.45 },
      { freq: 1319, at: 0.36, length: 0.45, volume: 0.04 },
    ]),
  pause: () => play([{ freq: 440, glideTo: 330, length: 0.14, volume: 0.04, wave: 'triangle' }]),
  start: () => play([{ freq: 294, glideTo: 392, length: 0.18, wave: 'triangle' }]),
  nope: () => play([{ freq: 247, glideTo: 208, length: 0.16, volume: 0.05, wave: 'triangle' }]),
};
