"use client";

// Lightweight synthesized sound-effect engine built on the Web Audio API.
// The product spec calls for a shared sound library (pickup, correct,
// incorrect, snap, completion jingle) — rather than shipping binary audio
// assets, we generate short tones/chords on the fly. This keeps the whole
// lab engine dependency-free and instant to load, and is trivially
// swappable later for real recorded SFX (see README).

type SoundKind = "pickup" | "drop" | "correct" | "incorrect" | "complete" | "click";

let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!ctx) ctx = new AudioCtor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  audioCtx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = "sine",
  gainPeak = 0.16
) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const start = audioCtx.currentTime + startOffset;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(gainPeak, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function setMuted(value: boolean) {
  muted = value;
}

export function isMuted() {
  return muted;
}

export function playSound(kind: SoundKind) {
  if (muted) return;
  const audioCtx = getCtx();
  if (!audioCtx) return;

  switch (kind) {
    case "pickup":
      tone(audioCtx, 520, 0, 0.09, "triangle", 0.1);
      break;
    case "drop":
      tone(audioCtx, 320, 0, 0.08, "sine", 0.1);
      break;
    case "click":
      tone(audioCtx, 700, 0, 0.05, "square", 0.05);
      break;
    case "correct":
      tone(audioCtx, 523.25, 0, 0.14, "sine", 0.14); // C5
      tone(audioCtx, 659.25, 0.08, 0.16, "sine", 0.14); // E5
      tone(audioCtx, 783.99, 0.16, 0.22, "sine", 0.14); // G5
      break;
    case "incorrect":
      // Deliberately gentle — spec: "never a harsh buzzer"
      tone(audioCtx, 330, 0, 0.1, "sine", 0.09);
      tone(audioCtx, 294, 0.08, 0.16, "sine", 0.08);
      break;
    case "complete":
      tone(audioCtx, 523.25, 0, 0.14, "sine", 0.15);
      tone(audioCtx, 659.25, 0.1, 0.14, "sine", 0.15);
      tone(audioCtx, 783.99, 0.2, 0.14, "sine", 0.15);
      tone(audioCtx, 1046.5, 0.32, 0.35, "sine", 0.16);
      break;
  }
}
