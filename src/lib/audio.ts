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
    gain.gain.value = 1.2;

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

// ─────────────────────────────────────────────────────────────────────────────
// 수심 알림용 사운드 타입
// ─────────────────────────────────────────────────────────────────────────────

export type AlarmSoundType =
  | 'single'      // 단일 비프
  | 'double'      // 더블 비프
  | 'triple'      // 트리플 비프
  | 'high'        // 높은 음
  | 'low'         // 낮은 음
  | 'ascending'   // 상승 음계
  | 'descending'; // 하강 음계

export const ALARM_SOUNDS: { type: AlarmSoundType; label: string }[] = [
  { type: 'single', label: '단일' },
  { type: 'double', label: '더블' },
  { type: 'triple', label: '트리플' },
  { type: 'high', label: '높은 음' },
  { type: 'low', label: '낮은 음' },
  { type: 'ascending', label: '상승음' },
  { type: 'descending', label: '하강음' },
];

export function playAlarmSound(type: AlarmSoundType): void {
  switch (type) {
    case 'single':
      playBeep(880, 120);
      break;
    case 'double':
      playBeep(880, 80);
      setTimeout(() => playBeep(880, 80), 120);
      break;
    case 'triple':
      playBeep(880, 60);
      setTimeout(() => playBeep(880, 60), 100);
      setTimeout(() => playBeep(880, 60), 200);
      break;
    case 'high':
      playBeep(1200, 150);
      break;
    case 'low':
      playBeep(440, 200);
      break;
    case 'ascending':
      playBeep(660, 80);
      setTimeout(() => playBeep(880, 80), 100);
      setTimeout(() => playBeep(1100, 80), 200);
      break;
    case 'descending':
      playBeep(1100, 80);
      setTimeout(() => playBeep(880, 80), 100);
      setTimeout(() => playBeep(660, 80), 200);
      break;
    default:
      playBeep(880, 120);
  }
}

// 미리듣기용 (테스트)
export function previewAlarmSound(type: AlarmSoundType): void {
  playAlarmSound(type);
}
