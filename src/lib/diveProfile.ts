import type { DivePlan, DiveProfile, ProfileMarker } from './types';

/**
 * Builds a depth-vs-time profile from a dive plan.
 * Pure & deterministic — the diagram is computed here, never by an LLM.
 */
export function buildProfile(p: DivePlan): DiveProfile {
  const target = Math.max(0, p.targetDepth);
  const ff = clamp(p.freefallStartDepth ?? target, 0, target);
  const descentSpeed = Math.max(0.1, p.descentSpeed);
  const ffSpeed = Math.max(0.1, p.freefallSpeed ?? descentSpeed);
  const ascentSpeed = Math.max(0.1, p.ascentSpeed);
  const bottom = p.bottomTimeSec ?? 3;

  const tActive = ff / descentSpeed;
  const tFree = (target - ff) / ffSpeed;
  const tAscent = target / ascentSpeed;

  let t = 0;
  const points: { t: number; depth: number }[] = [{ t: 0, depth: 0 }];
  t += tActive;
  points.push({ t, depth: ff });
  t += tFree;
  points.push({ t, depth: target });
  t += bottom;
  points.push({ t, depth: target });
  t += tAscent;
  points.push({ t, depth: 0 });

  const total = t;
  const ascentStartT = total - tAscent;

  // time at a given depth on the way down
  const descentTimeAt = (depth: number): number =>
    depth <= ff ? depth / descentSpeed : tActive + (depth - ff) / ffSpeed;
  // time at a given depth on the way up
  const ascentTimeAt = (depth: number): number => ascentStartT + (target - depth) / ascentSpeed;

  const markers: ProfileMarker[] = [];
  if (p.freefallStartDepth != null && ff < target) {
    markers.push({ depth: ff, t: tActive, label: `프리폴 시작 · -${fmt(ff)}m`, phase: 'descent', tone: 'sky' });
  }
  if (p.mouthfillDepth != null) {
    const d = clamp(p.mouthfillDepth, 0, target);
    markers.push({ depth: d, t: descentTimeAt(d), label: `마우스필 · -${fmt(d)}m`, phase: 'descent', tone: 'aqua' });
  }
  markers.push({ depth: target, t: tActive + tFree, label: `목표 -${fmt(target)}m`, phase: 'descent', tone: 'amber' });
  if (p.safetyMeetDepth != null) {
    const d = clamp(p.safetyMeetDepth, 0, target);
    markers.push({ depth: d, t: ascentTimeAt(d), label: `세이프티 미팅 · -${fmt(d)}m`, phase: 'ascent', tone: 'coral' });
  }

  return {
    points,
    ffStartDepth: ff,
    totalTimeSec: total,
    descentTimeSec: tActive + tFree,
    ascentTimeSec: tAscent,
    markers,
  };
}

export function fmtTime(sec: number): string {
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
