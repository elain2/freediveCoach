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

export const DISCIPLINES: { id: DisciplineId; label: string; ready: boolean }[] = [
  { id: 'CWT', label: '콘스턴트 웨이트 (CWT)', ready: true },
  { id: 'CNF', label: '콘스턴트 노핀 (CNF)', ready: false },
  { id: 'FIM', label: '프리 이머전 (FIM)', ready: true },
  { id: 'DYN', label: '다이나믹 (DYN)', ready: false },
  { id: 'STA', label: '스태틱 (STA)', ready: false },
];
