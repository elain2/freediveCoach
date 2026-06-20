import { useMemo } from 'react';
import type { DiveProfile } from '../lib/types';
import { fmtTime } from '../lib/diveProfile';

const TONE: Record<string, string> = {
  aqua: '#4fe0cc',
  sky: '#7fd4ff',
  amber: '#ffce6b',
  coral: '#ff8d6b',
};

export default function DiveProfileChart({ profile }: { profile: DiveProfile }) {
  const W = 720;
  const H = 470;
  const padL = 70;
  const padR = 560;
  const padT = 70;
  const padB = 354;

  const maxDepth = useMemo(
    () => Math.max(10, ...profile.points.map((p) => p.depth)) * 1.12,
    [profile]
  );
  const maxTime = useMemo(
    () => Math.max(10, profile.totalTimeSec) * 1.02,
    [profile]
  );

  const xT = (t: number) => padL + (t / maxTime) * (padR - padL);
  const yD = (d: number) => padT + (d / maxDepth) * (padB - padT);

  const pts = profile.points;
  const ffIdx = 1; // freefall starts at points[1]
  const bottomReached = 2;
  const turnEnd = 3;

  const depthTicks = niceTicks(maxDepth);
  const timeTicks = niceTimeTicks(maxTime);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ fontFamily: 'inherit' }}>
      <defs>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#10465c" stopOpacity="0.32" />
          <stop offset="1" stopColor="#03141d" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      <text x={padL - 34} y={40} fill="#4fe0cc" fontSize={11} letterSpacing={3} className="mono">
        DIVE PROFILE
      </text>

      {/* readout chips */}
      {[
        { x: 420, label: 'TOTAL', val: fmtTime(profile.totalTimeSec) },
        { x: 512, label: 'DESCENT', val: fmtTime(profile.descentTimeSec) },
        { x: 604, label: 'ASCENT', val: fmtTime(profile.ascentTimeSec) },
      ].map((c) => (
        <g key={c.label} transform={`translate(${c.x},24)`} className="mono">
          <rect width={86} height={34} rx={8} fill="#103a4d" stroke="rgba(125,185,200,.18)" />
          <text x={10} y={14} fill="#82a6b0" fontSize={8} letterSpacing={2}>
            {c.label}
          </text>
          <text x={10} y={28} fill="#e8f5f6" fontSize={14} fontWeight={700}>
            {c.val}
          </text>
        </g>
      ))}

      <rect x={padL} y={padT} width={padR - padL} height={padB - padT} fill="url(#water)" />

      {/* depth grid */}
      {depthTicks.map((d) => (
        <g key={`d${d}`} className="mono">
          <line x1={padL} y1={yD(d)} x2={padR} y2={yD(d)} stroke="rgba(125,185,200,.10)" />
          <text x={padL - 12} y={yD(d) + 4} fill="#82a6b0" fontSize={10} textAnchor="end">
            {d === 0 ? '0m' : `-${d}`}
          </text>
        </g>
      ))}
      {/* time ticks */}
      {timeTicks.map((t) => (
        <text key={`t${t}`} x={xT(t)} y={padB + 18} fill="#5d818b" fontSize={9} textAnchor="middle" className="mono">
          {t === 0 ? '0s' : t}
        </text>
      ))}

      {/* segments */}
      <path d={`M${xT(pts[0].t)},${yD(pts[0].depth)} L${xT(pts[ffIdx].t)},${yD(pts[ffIdx].depth)}`}
        fill="none" stroke="#4fe0cc" strokeWidth={3} strokeLinecap="round" />
      <path d={`M${xT(pts[ffIdx].t)},${yD(pts[ffIdx].depth)} L${xT(pts[bottomReached].t)},${yD(pts[bottomReached].depth)}`}
        fill="none" stroke="#7fd4ff" strokeWidth={3} strokeLinecap="round" strokeDasharray="2 6" />
      <path d={`M${xT(pts[bottomReached].t)},${yD(pts[bottomReached].depth)} L${xT(pts[turnEnd].t)},${yD(pts[turnEnd].depth)}`}
        fill="none" stroke="#ffce6b" strokeWidth={3} strokeLinecap="round" />
      <path d={`M${xT(pts[turnEnd].t)},${yD(pts[turnEnd].depth)} L${xT(pts[4].t)},${yD(pts[4].depth)}`}
        fill="none" stroke="#2a9d8f" strokeWidth={3} strokeLinecap="round" />

      {/* markers */}
      {profile.markers.map((m, i) => {
        const x = xT(m.t);
        const y = yD(m.depth);
        const left = x > (padR + padL) / 2;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={5} fill="#03141d" stroke={TONE[m.tone]} strokeWidth={2} />
            <text
              x={left ? x - 10 : x + 10}
              y={y - 6}
              fill={m.tone === 'amber' ? '#ffce6b' : m.tone === 'coral' ? '#ffd7c9' : '#cfeaf2'}
              fontSize={11}
              fontWeight={m.tone === 'amber' ? 700 : 400}
              textAnchor={left ? 'end' : 'start'}
            >
              {m.label}
            </text>
          </g>
        );
      })}

      {/* legend */}
      <g transform={`translate(${padL},404)`} fontSize={10} fill="#a9c6cd">
        <line x1={0} y1={0} x2={22} y2={0} stroke="#4fe0cc" strokeWidth={3} strokeLinecap="round" />
        <text x={30} y={4}>능동 하강</text>
        <line x1={110} y1={0} x2={132} y2={0} stroke="#7fd4ff" strokeWidth={3} strokeLinecap="round" strokeDasharray="2 5" />
        <text x={140} y={4}>프리폴</text>
        <line x1={210} y1={0} x2={232} y2={0} stroke="#2a9d8f" strokeWidth={3} strokeLinecap="round" />
        <text x={240} y={4}>상승</text>
      </g>
      <text x={padL} y={440} fill="#5d818b" fontSize={9.5}>
        수심-시간 프로파일은 파라미터에서 계산 · 계획 보조이며 안전 보장이 아님
      </text>
    </svg>
  );
}

function niceTicks(max: number): number[] {
  const step = max > 80 ? 20 : max > 40 ? 10 : 5;
  const out: number[] = [];
  for (let d = 0; d <= max; d += step) out.push(d);
  return out;
}

function niceTimeTicks(max: number): number[] {
  const step = max > 120 ? 30 : max > 60 ? 20 : 10;
  const out: number[] = [];
  for (let t = 0; t <= max; t += step) out.push(Math.round(t));
  return out;
}
