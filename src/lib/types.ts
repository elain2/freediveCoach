export type DisciplineId = 'CWT' | 'CNF' | 'FIM' | 'DYN' | 'STA';

export type AnalysisMode = 'overview' | 'segment';

export interface CategoryResult {
  name: string;
  score: number; // 1~5, 0.5 step
  note: string;
  tip: string;
}

export interface AnalysisResult {
  overall: string;
  categories: CategoryResult[];
  hook: string;
}

export interface Session {
  id: string;
  createdAt: number;
  discipline: DisciplineId;
  mode: AnalysisMode;
  segment?: { startSec: number; endSec: number };
  videoName: string;
  durationSec: number;
  frameCount: number;
  thumbnail?: string;
  result: AnalysisResult;
}

export interface DivePlan {
  discipline: DisciplineId;
  targetDepth: number;
  descentSpeed: number;
  freefallStartDepth?: number;
  freefallSpeed?: number;
  ascentSpeed: number;
  bottomTimeSec?: number;
  mouthfillDepth?: number;
  safetyMeetDepth?: number;
}

export interface ProfileMarker {
  depth: number;
  t: number;
  label: string;
  phase: 'descent' | 'ascent';
  tone: 'aqua' | 'sky' | 'amber' | 'coral';
}

export interface DiveProfile {
  points: { t: number; depth: number }[];
  ffStartDepth: number;
  totalTimeSec: number;
  descentTimeSec: number;
  ascentTimeSec: number;
  markers: ProfileMarker[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 호흡 훈련 (CO2/O2 테이블)
// ─────────────────────────────────────────────────────────────────────────────

export type TableMode = 'co2' | 'o2';

export interface TableRound {
  round: number;
  breatheSec: number;
  holdSec: number;
}

export interface BreathTable {
  mode: TableMode;
  pbSec: number;
  rounds: TableRound[];
  totalTimeSec: number;
  totalHoldSec: number;
}

export type TimerPhase = 'idle' | 'breathe' | 'hold' | 'complete';

// ─────────────────────────────────────────────────────────────────────────────
// 다이브 시뮬레이션
// ─────────────────────────────────────────────────────────────────────────────

export interface DiveSimParams {
  targetDepth: number;
  neutralBuoyancy: number;
}

export interface DiveSimMilestone {
  depth: number;
  timeSec: number;
  label: string;
  event: 'surface' | 'mouthfill' | 'freefall' | 'turn' | 'ascent' | 'complete';
}

// ─────────────────────────────────────────────────────────────────────────────
// 오디오 설정
// ─────────────────────────────────────────────────────────────────────────────

export interface AudioSettings {
  muted: boolean;           // 전체 음소거
  volume: number;           // 볼륨 (0~1)
  countdownEnabled: boolean; // 카운트다운 비프 (3, 2, 1...)
  phaseEnabled: boolean;    // 페이즈 전환 비프
  completeEnabled: boolean; // 완료 비프
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  muted: false,
  volume: 0.8,
  countdownEnabled: true,
  phaseEnabled: true,
  completeEnabled: true,
};

export const DISCIPLINES: { id: DisciplineId; label: string; ready: boolean }[] = [
  { id: 'CWT', label: '콘스턴트 웨이트 (CWT)', ready: true },
  { id: 'CNF', label: '콘스턴트 노핀 (CNF)', ready: true },
  { id: 'FIM', label: '프리 이머전 (FIM)', ready: true },
  { id: 'DYN', label: '다이나믹 (DYN)', ready: false },
  { id: 'STA', label: '스태틱 (STA)', ready: false },
];
