import type { AudioSettings } from './types';
import { DEFAULT_AUDIO_SETTINGS } from './types';

let audioCtx: AudioContext | null = null;
let currentSettings: AudioSettings = DEFAULT_AUDIO_SETTINGS;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

// 설정 업데이트 (외부에서 호출)
export function updateAudioSettings(settings: AudioSettings): void {
  currentSettings = settings;
}

// 현재 설정 조회
export function getAudioSettings(): AudioSettings {
  return currentSettings;
}

export function playBeep(freq = 880, durationMs = 120): void {
  if (currentSettings.muted || currentSettings.volume === 0) return;

  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;
    // 볼륨 적용 (0~1 범위를 0~1.5 범위로 매핑하여 더 큰 볼륨 가능)
    gain.gain.value = currentSettings.volume * 1.5;

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
  if (!currentSettings.phaseEnabled) return;
  playBeep(660, 150);
}

export function playPhaseBeep(): void {
  if (!currentSettings.phaseEnabled) return;
  playBeep(880, 100);
}

export function playCompleteBeep(): void {
  if (!currentSettings.completeEnabled) return;
  playBeep(1047, 200);
  setTimeout(() => {
    if (!currentSettings.muted && currentSettings.completeEnabled) {
      playBeep(1319, 200);
    }
  }, 150);
}

export function playCountdownBeep(): void {
  if (!currentSettings.countdownEnabled) return;
  playBeep(440, 80);
}

// 테스트용 비프 (설정 무시하고 재생)
export function playTestBeep(): void {
  const tempMuted = currentSettings.muted;
  currentSettings.muted = false;
  playBeep(880, 150);
  currentSettings.muted = tempMuted;
}
