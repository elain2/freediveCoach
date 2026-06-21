import type { TableMode, TableRound, BreathTable } from './types';

const TOTAL_ROUNDS = 8;

/**
 * CO2 테이블: 숨참기 시간 고정, 호흡 시간 점점 감소
 * O2 테이블: 호흡 시간 고정, 숨참기 시간 점점 증가
 */
export function generateTable(mode: TableMode, pbSec: number): BreathTable {
  const rounds: TableRound[] = [];

  if (mode === 'co2') {
    // CO2: 숨참기 50% 고정, 호흡 시간 2:30 → 1:00 감소
    const holdSec = Math.round(pbSec * 0.5);
    const breatheStart = 150; // 2:30
    const breatheEnd = 60; // 1:00
    const step = (breatheStart - breatheEnd) / (TOTAL_ROUNDS - 1);

    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      rounds.push({
        round: i + 1,
        breatheSec: Math.round(breatheStart - step * i),
        holdSec,
      });
    }
  } else {
    // O2: 호흡 2분 고정, 숨참기 50% → 80% 증가
    const breatheSec = 120;
    const holdStart = pbSec * 0.5;
    const holdEnd = pbSec * 0.8;
    const step = (holdEnd - holdStart) / (TOTAL_ROUNDS - 1);

    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      rounds.push({
        round: i + 1,
        breatheSec,
        holdSec: Math.round(holdStart + step * i),
      });
    }
  }

  const totalTimeSec = rounds.reduce((sum, r) => sum + r.breatheSec + r.holdSec, 0);
  const totalHoldSec = rounds.reduce((sum, r) => sum + r.holdSec, 0);

  return {
    mode,
    pbSec,
    rounds,
    totalTimeSec,
    totalHoldSec,
  };
}

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatTimeCompact(sec: number): string {
  if (sec < 60) return `${sec}초`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m}분` : `${m}분 ${s}초`;
}
