let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function playBeep(freq = 880, durationMs = 120): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.3;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // 오디오 미지원 환경 무시
  }
}

export function playStartBeep(): void {
  playBeep(660, 150);
}

export function playPhaseBeep(): void {
  playBeep(880, 100);
}

export function playCompleteBeep(): void {
  playBeep(1047, 200);
  setTimeout(() => playBeep(1319, 200), 150);
}

export function playCountdownBeep(): void {
  playBeep(440, 80);
}
