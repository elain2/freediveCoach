import { useState, useEffect, useRef, useCallback } from 'react';
import type { DiveSimMilestone } from '../../lib/types';
import { playPhaseBeep, playCompleteBeep, playCountdownBeep } from '../../lib/audio';

interface SimParams {
  targetDepth: number;
  descentSpeed: number;
  freefallDepth: number;
  freefallSpeed: number;
  ascentSpeed: number;
  mouthfillDepth: number;
}

const DEFAULT_PARAMS: SimParams = {
  targetDepth: 40,
  descentSpeed: 1.0,
  freefallDepth: 25,
  freefallSpeed: 1.3,
  ascentSpeed: 1.0,
  mouthfillDepth: 30,
};

function calculateMilestones(params: SimParams): DiveSimMilestone[] {
  const { targetDepth, descentSpeed, freefallDepth, freefallSpeed, ascentSpeed, mouthfillDepth } = params;

  const milestones: DiveSimMilestone[] = [];

  // 수면 출발
  milestones.push({ depth: 0, timeSec: 0, label: '수면 출발', event: 'surface' });

  // 마우스필 (하강 중)
  const mouthfillTime = mouthfillDepth / descentSpeed;
  milestones.push({ depth: mouthfillDepth, timeSec: mouthfillTime, label: '마우스필', event: 'mouthfill' });

  // 프리폴 시작
  const freefallTime = freefallDepth / descentSpeed;
  milestones.push({ depth: freefallDepth, timeSec: freefallTime, label: '프리폴', event: 'freefall' });

  // 턴 (바닥)
  const descentToFF = freefallDepth / descentSpeed;
  const ffToBottom = (targetDepth - freefallDepth) / freefallSpeed;
  const turnTime = descentToFF + ffToBottom;
  milestones.push({ depth: targetDepth, timeSec: turnTime, label: '턴', event: 'turn' });

  // 완료 (수면 복귀)
  const ascentTime = targetDepth / ascentSpeed;
  const totalTime = turnTime + ascentTime;
  milestones.push({ depth: 0, timeSec: totalTime, label: '수면 복귀', event: 'complete' });

  return milestones.sort((a, b) => a.timeSec - b.timeSec);
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getCurrentDepth(elapsedSec: number, params: SimParams): number {
  const { targetDepth, descentSpeed, freefallDepth, freefallSpeed, ascentSpeed } = params;

  const descentToFF = freefallDepth / descentSpeed;
  const ffToBottom = (targetDepth - freefallDepth) / freefallSpeed;
  const turnTime = descentToFF + ffToBottom;
  const ascentTime = targetDepth / ascentSpeed;
  const totalTime = turnTime + ascentTime;

  if (elapsedSec <= 0) return 0;
  if (elapsedSec >= totalTime) return 0;

  // 하강
  if (elapsedSec <= turnTime) {
    if (elapsedSec <= descentToFF) {
      return elapsedSec * descentSpeed;
    } else {
      return freefallDepth + (elapsedSec - descentToFF) * freefallSpeed;
    }
  }

  // 상승
  const ascentElapsed = elapsedSec - turnTime;
  return targetDepth - ascentElapsed * ascentSpeed;
}

export default function DiveSimulation() {
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);
  const [milestones, setMilestones] = useState<DiveSimMilestone[]>(() => calculateMilestones(DEFAULT_PARAMS));
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [passedMilestones, setPassedMilestones] = useState<Set<number>>(new Set());

  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const totalTime = milestones[milestones.length - 1]?.timeSec ?? 0;
  const currentDepth = getCurrentDepth(elapsedSec, params);

  const updateParams = (key: keyof SimParams, value: number) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    setMilestones(calculateMilestones(newParams));
  };

  const tick = useCallback(() => {
    const now = performance.now();
    const elapsed = (now - startTimeRef.current) / 1000;
    setElapsedSec(elapsed);

    // 마일스톤 체크
    milestones.forEach((m, idx) => {
      if (!passedMilestones.has(idx) && elapsed >= m.timeSec) {
        setPassedMilestones((prev) => new Set(prev).add(idx));
        if (m.event === 'complete') {
          playCompleteBeep();
          setIsRunning(false);
        } else {
          playPhaseBeep();
        }
      }
    });

    // 완료 체크
    if (elapsed >= totalTime) {
      setIsRunning(false);
    }
  }, [milestones, passedMilestones, totalTime]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(tick, 50);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, tick]);

  const start = () => {
    setElapsedSec(0);
    setPassedMilestones(new Set());
    startTimeRef.current = performance.now();
    setIsRunning(true);
    playCountdownBeep();
  };

  const reset = () => {
    setIsRunning(false);
    setElapsedSec(0);
    setPassedMilestones(new Set());
  };

  // 탱크 비주얼의 다이버 위치 (0~100%)
  const diverPosition = (currentDepth / params.targetDepth) * 100;

  return (
    <div className="space-y-4">
      {/* 파라미터 입력 */}
      <div className="rounded-2xl border border-[var(--line)] bg-card/40 p-5">
        <h3 className="mb-4 text-[15px] font-semibold">다이브 파라미터</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { key: 'targetDepth', label: '목표 수심 (m)' },
            { key: 'descentSpeed', label: '하강 속도 (m/s)', step: 0.1 },
            { key: 'freefallDepth', label: '프리폴 시작 (m)' },
            { key: 'freefallSpeed', label: '프리폴 속도 (m/s)', step: 0.1 },
            { key: 'ascentSpeed', label: '상승 속도 (m/s)', step: 0.1 },
            { key: 'mouthfillDepth', label: '마우스필 (m)' },
          ].map((f) => (
            <label key={f.key} className="mono text-[11px] text-muted">
              <span className="mb-1 block">{f.label}</span>
              <input
                type="number"
                step={f.step ?? 1}
                value={params[f.key as keyof SimParams]}
                onChange={(e) => updateParams(f.key as keyof SimParams, Number(e.target.value))}
                disabled={isRunning}
                className="w-full rounded bg-deep px-2.5 py-2 text-[14px] text-ink disabled:opacity-50"
              />
            </label>
          ))}
        </div>
      </div>

      {/* 시뮬레이션 비주얼 */}
      <div className="rounded-2xl border border-[var(--line)] bg-card/40 p-5">
        <div className="flex gap-6">
          {/* 탱크 (다이버 위치) */}
          <div className="relative h-64 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-b from-sky/20 via-aqua/10 to-deep">
            {/* 수심 눈금 */}
            {[0, 25, 50, 75, 100].map((pct) => (
              <div
                key={pct}
                className="absolute left-0 right-0 border-t border-[var(--line)]"
                style={{ top: `${pct}%` }}
              >
                <span className="mono absolute -right-1 -top-2 translate-x-full text-[9px] text-muted">
                  {Math.round((pct / 100) * params.targetDepth)}m
                </span>
              </div>
            ))}
            {/* 다이버 */}
            <div
              className="absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-coral shadow-lg shadow-coral/40 transition-all duration-100"
              style={{ top: `calc(${diverPosition}% - 8px)` }}
            />
          </div>

          {/* 타임라인 + 마일스톤 */}
          <div className="flex-1">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="mono text-[32px] font-bold">{formatTime(elapsedSec)}</span>
              <span className="mono text-[14px] text-muted">/ {formatTime(totalTime)}</span>
            </div>
            <div className="mb-1 text-[14px]">
              현재 수심: <span className="mono font-semibold text-aqua">{currentDepth.toFixed(1)}m</span>
            </div>

            {/* 진행바 */}
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-deep">
              <div
                className="h-full rounded-full bg-aqua transition-all duration-100"
                style={{ width: `${(elapsedSec / totalTime) * 100}%` }}
              />
            </div>

            {/* 마일스톤 */}
            <div className="space-y-2">
              {milestones.map((m, idx) => {
                const isPassed = passedMilestones.has(idx);
                const isNext = !isPassed && (idx === 0 || passedMilestones.has(idx - 1));
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                      isPassed ? 'bg-aqua/10 text-aqua' : isNext ? 'bg-deep text-ink' : 'text-muted'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                        isPassed ? 'bg-aqua text-[#04222a]' : 'bg-[var(--line)]'
                      }`}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </span>
                    <span className="flex-1">{m.label}</span>
                    <span className="mono">{formatTime(m.timeSec)}</span>
                    <span className="mono text-[11px] text-muted">{m.depth}m</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 컨트롤 */}
      <div className="flex gap-3">
        {isRunning ? (
          <button
            onClick={reset}
            className="flex-1 rounded-xl border border-coral bg-coral/10 py-3.5 text-[14px] font-bold text-coral transition-transform hover:-translate-y-px"
          >
            중지
          </button>
        ) : (
          <button
            onClick={start}
            className="flex-1 rounded-xl bg-aqua py-3.5 text-[14px] font-bold text-[#04222a] transition-transform hover:-translate-y-px"
          >
            시뮬레이션 시작
          </button>
        )}
      </div>
    </div>
  );
}
