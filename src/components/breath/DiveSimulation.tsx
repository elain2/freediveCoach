import { useState, useEffect, useRef, useCallback } from 'react';
import type { DiveSimMilestone } from '../../lib/types';
import {
  playPhaseBeep,
  playCompleteBeep,
  playCountdownBeep,
  playAlarmSound,
  previewAlarmSound,
  ALARM_SOUNDS,
  type AlarmSoundType,
} from '../../lib/audio';

interface SimParams {
  targetDepth: number;
  freefallDepth: number;
  mouthfillDepth: number;
  descentTimeSec: number;   // 수면 → 턴까지 전체 하강 시간
  bottomHoldSec: number;    // 바텀 홀딩 시간
  ascentTimeSec: number;    // 상승 시작 → 수면까지 시간
}

// 사용자 정의 수심 알림
interface DepthAlarm {
  id: string;
  depth: number;
  label: string;
  phase: 'descent' | 'ascent' | 'both';
  sound: AlarmSoundType;
}

// 마일스톤에 사운드 정보 추가
interface SimMilestone extends DiveSimMilestone {
  alarmSound?: AlarmSoundType;
}

const ALARM_STORAGE_KEY = 'descent-depth-alarms';
const COUNTDOWN_STORAGE_KEY = 'descent-countdown-sec';

const COUNTDOWN_OPTIONS = [0, 3, 5, 10];

function loadAlarms(): DepthAlarm[] {
  try {
    const stored = localStorage.getItem(ALARM_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function saveAlarms(alarms: DepthAlarm[]): void {
  try {
    localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(alarms));
  } catch { /* ignore */ }
}

function loadCountdown(): number {
  try {
    const stored = localStorage.getItem(COUNTDOWN_STORAGE_KEY);
    if (stored) return Number(stored);
  } catch { /* ignore */ }
  return 3; // 기본값 3초
}

function saveCountdown(sec: number): void {
  try {
    localStorage.setItem(COUNTDOWN_STORAGE_KEY, String(sec));
  } catch { /* ignore */ }
}

const DEFAULT_PARAMS: SimParams = {
  targetDepth: 40,
  freefallDepth: 25,
  mouthfillDepth: 30,
  descentTimeSec: 37,
  bottomHoldSec: 0,
  ascentTimeSec: 40,
};

function calculateMilestones(params: SimParams, alarms: DepthAlarm[]): SimMilestone[] {
  const { targetDepth, freefallDepth, mouthfillDepth, descentTimeSec, bottomHoldSec, ascentTimeSec } = params;

  const milestones: SimMilestone[] = [];

  // 수면 출발
  milestones.push({ depth: 0, timeSec: 0, label: '수면 출발', event: 'surface' });

  // 마우스필 (하강 중) - 비율로 시간 계산
  const mouthfillTime = (mouthfillDepth / targetDepth) * descentTimeSec;
  milestones.push({ depth: mouthfillDepth, timeSec: mouthfillTime, label: '마우스필', event: 'mouthfill' });

  // 프리폴 시작 - 비율로 시간 계산
  const freefallTime = (freefallDepth / targetDepth) * descentTimeSec;
  milestones.push({ depth: freefallDepth, timeSec: freefallTime, label: '프리폴', event: 'freefall' });

  // 턴 (바닥 도착)
  milestones.push({ depth: targetDepth, timeSec: descentTimeSec, label: '턴', event: 'turn' });

  // 상승 시작 (바텀 홀딩 후)
  const ascentStartTime = descentTimeSec + bottomHoldSec;
  if (bottomHoldSec > 0) {
    milestones.push({ depth: targetDepth, timeSec: ascentStartTime, label: '상승 시작', event: 'ascent' });
  }

  // 완료 (수면 복귀)
  const totalTime = ascentStartTime + ascentTimeSec;
  milestones.push({ depth: 0, timeSec: totalTime, label: '수면 복귀', event: 'complete' });

  // 사용자 정의 수심 알림 추가
  alarms.forEach((alarm) => {
    if (alarm.depth <= 0 || alarm.depth >= targetDepth) return;

    // 하강 시 알림
    if (alarm.phase === 'descent' || alarm.phase === 'both') {
      const descentTime = (alarm.depth / targetDepth) * descentTimeSec;
      milestones.push({
        depth: alarm.depth,
        timeSec: descentTime,
        label: `${alarm.label} (하강)`,
        event: 'freefall',
        alarmSound: alarm.sound,
      });
    }

    // 상승 시 알림
    if (alarm.phase === 'ascent' || alarm.phase === 'both') {
      const ascentTime = ascentStartTime + ((targetDepth - alarm.depth) / targetDepth) * ascentTimeSec;
      milestones.push({
        depth: alarm.depth,
        timeSec: ascentTime,
        label: `${alarm.label} (상승)`,
        event: 'ascent',
        alarmSound: alarm.sound,
      });
    }
  });

  return milestones.sort((a, b) => a.timeSec - b.timeSec);
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getCurrentDepth(elapsedSec: number, params: SimParams): number {
  const { targetDepth, descentTimeSec, bottomHoldSec, ascentTimeSec } = params;

  const ascentStartTime = descentTimeSec + bottomHoldSec;
  const totalTime = ascentStartTime + ascentTimeSec;

  // 속도 계산 (내부 사용)
  const descentSpeed = targetDepth / descentTimeSec;
  const ascentSpeed = targetDepth / ascentTimeSec;

  if (elapsedSec <= 0) return 0;
  if (elapsedSec >= totalTime) return 0;

  // 하강
  if (elapsedSec <= descentTimeSec) {
    return elapsedSec * descentSpeed;
  }

  // 바텀 홀딩
  if (elapsedSec <= ascentStartTime) {
    return targetDepth;
  }

  // 상승
  const ascentElapsed = elapsedSec - ascentStartTime;
  return targetDepth - ascentElapsed * ascentSpeed;
}

export default function DiveSimulation() {
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);
  const [alarms, setAlarms] = useState<DepthAlarm[]>(loadAlarms);
  const [milestones, setMilestones] = useState<SimMilestone[]>(() => calculateMilestones(DEFAULT_PARAMS, loadAlarms()));
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [passedMilestones, setPassedMilestones] = useState<Set<number>>(new Set());
  const [speed, setSpeed] = useState(1);
  const [showAlarmForm, setShowAlarmForm] = useState(false);
  const [newAlarmDepth, setNewAlarmDepth] = useState('');
  const [newAlarmLabel, setNewAlarmLabel] = useState('');
  const [newAlarmPhase, setNewAlarmPhase] = useState<'descent' | 'ascent' | 'both'>('both');
  const [newAlarmSound, setNewAlarmSound] = useState<AlarmSoundType>('single');

  // 카운트다운 관련 상태
  const [countdownSec, setCountdownSec] = useState(loadCountdown);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownRemaining, setCountdownRemaining] = useState(0);

  const intervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedAtSpeedChangeRef = useRef<number>(0);

  const totalTime = milestones[milestones.length - 1]?.timeSec ?? 0;
  const currentDepth = getCurrentDepth(elapsedSec, params);

  // 알림 변경 시 저장 및 마일스톤 재계산
  useEffect(() => {
    saveAlarms(alarms);
    setMilestones(calculateMilestones(params, alarms));
  }, [alarms, params]);

  // 카운트다운 설정 저장
  useEffect(() => {
    saveCountdown(countdownSec);
  }, [countdownSec]);

  const updateParams = (key: keyof SimParams, value: number) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    setMilestones(calculateMilestones(newParams, alarms));
  };

  const addAlarm = () => {
    const depth = Number(newAlarmDepth);
    if (!depth || depth <= 0 || depth >= params.targetDepth) return;
    const label = newAlarmLabel.trim() || `${depth}m`;
    const newAlarm: DepthAlarm = {
      id: Date.now().toString(),
      depth,
      label,
      phase: newAlarmPhase,
      sound: newAlarmSound,
    };
    setAlarms((prev) => [...prev, newAlarm].sort((a, b) => a.depth - b.depth));
    setNewAlarmDepth('');
    setNewAlarmLabel('');
    setNewAlarmSound('single');
    setShowAlarmForm(false);
  };

  const removeAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  const tick = useCallback(() => {
    const now = performance.now();
    const realElapsed = (now - startTimeRef.current) / 1000;
    const elapsed = elapsedAtSpeedChangeRef.current + realElapsed * speed;
    setElapsedSec(elapsed);

    // 마일스톤 체크
    milestones.forEach((m, idx) => {
      if (!passedMilestones.has(idx) && elapsed >= m.timeSec) {
        setPassedMilestones((prev) => new Set(prev).add(idx));
        if (m.event === 'complete') {
          playCompleteBeep();
          setIsRunning(false);
        } else if (m.alarmSound) {
          // 사용자 정의 알림은 선택한 소리 재생
          playAlarmSound(m.alarmSound);
        } else {
          playPhaseBeep();
        }
      }
    });

    // 완료 체크
    if (elapsed >= totalTime) {
      setIsRunning(false);
    }
  }, [milestones, passedMilestones, totalTime, speed]);

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

  const startSimulation = useCallback(() => {
    setElapsedSec(0);
    setPassedMilestones(new Set());
    elapsedAtSpeedChangeRef.current = 0;
    startTimeRef.current = performance.now();
    setIsRunning(true);
    playPhaseBeep(); // 시작 신호
  }, []);

  const start = () => {
    if (countdownSec > 0) {
      // 카운트다운 시작
      setCountdownRemaining(countdownSec);
      setIsCountingDown(true);
      playCountdownBeep();

      countdownIntervalRef.current = window.setInterval(() => {
        setCountdownRemaining((prev) => {
          const next = prev - 1;
          if (next > 0) {
            playCountdownBeep();
            return next;
          } else {
            // 카운트다운 완료, 시뮬레이션 시작
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            setIsCountingDown(false);
            startSimulation();
            return 0;
          }
        });
      }, 1000);
    } else {
      // 카운트다운 없이 바로 시작
      startSimulation();
    }
  };

  const reset = () => {
    // 카운트다운 중지
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsCountingDown(false);
    setCountdownRemaining(0);

    setIsRunning(false);
    setElapsedSec(0);
    setPassedMilestones(new Set());
    setSpeed(1);
    elapsedAtSpeedChangeRef.current = 0;
  };

  const cycleSpeed = () => {
    const speeds = [1, 2, 4, 8];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    elapsedAtSpeedChangeRef.current = elapsedSec;
    startTimeRef.current = performance.now();
    setSpeed(speeds[nextIdx]);
  };

  // 탱크 비주얼의 다이버 위치 (0~100%)
  const diverPosition = (currentDepth / params.targetDepth) * 100;

  return (
    <div>
      <p className="mb-6 max-w-[48ch] text-[15px] text-muted">
        목표 수심과 구간별 시간을 설정하고 다이브 타이밍을 시뮬레이션합니다. 마일스톤마다 사운드로 알려줍니다.
      </p>

      <div className="space-y-4">
        {/* 파라미터 입력 */}
        <div className="rounded-2xl border border-[var(--line)] bg-card/40 p-5">
          <h3 className="mb-4 text-[15px] font-semibold">다이브 파라미터</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { key: 'targetDepth', label: '목표 수심 (m)' },
            { key: 'freefallDepth', label: '프리폴 시작 (m)' },
            { key: 'mouthfillDepth', label: '마우스필 (m)' },
            { key: 'descentTimeSec', label: '하강 시간 (초)' },
            { key: 'bottomHoldSec', label: '바텀 홀딩 (초)' },
            { key: 'ascentTimeSec', label: '상승 시간 (초)' },
          ].map((f) => (
            <label key={f.key} className="mono text-[11px] text-muted">
              <span className="mb-1 block">{f.label}</span>
              <input
                type="number"
                step={1}
                value={params[f.key as keyof SimParams]}
                onChange={(e) => updateParams(f.key as keyof SimParams, Number(e.target.value))}
                disabled={isRunning}
                className="w-full rounded bg-deep px-2.5 py-2 text-[14px] text-ink disabled:opacity-50"
              />
            </label>
          ))}
        </div>
      </div>

      {/* 수심 알림 설정 */}
      <div className="rounded-2xl border border-[var(--line)] bg-card/40 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold">수심 알림</h3>
          {!isRunning && (
            <button
              onClick={() => setShowAlarmForm(!showAlarmForm)}
              className="flex h-7 items-center gap-1 rounded-lg bg-aqua/10 px-3 text-[12px] font-semibold text-aqua hover:bg-aqua/20"
            >
              <span className="text-[16px]">+</span> 추가
            </button>
          )}
        </div>

        {/* 알림 추가 폼 */}
        {showAlarmForm && !isRunning && (
          <div className="mb-4 rounded-xl bg-deep p-4">
            <div className="mb-3 grid grid-cols-2 gap-3">
              <label className="mono text-[11px] text-muted">
                <span className="mb-1 block">수심 (m)</span>
                <input
                  type="number"
                  step={1}
                  min={1}
                  max={params.targetDepth - 1}
                  value={newAlarmDepth}
                  onChange={(e) => setNewAlarmDepth(e.target.value)}
                  placeholder="예: 15"
                  className="w-full rounded bg-card px-2.5 py-2 text-[14px] text-ink"
                />
              </label>
              <label className="mono text-[11px] text-muted">
                <span className="mb-1 block">라벨 (선택)</span>
                <input
                  type="text"
                  value={newAlarmLabel}
                  onChange={(e) => setNewAlarmLabel(e.target.value)}
                  placeholder="예: 이퀄"
                  className="w-full rounded bg-card px-2.5 py-2 text-[14px] text-ink"
                />
              </label>
            </div>
            <div className="mb-3">
              <span className="mono mb-2 block text-[11px] text-muted">알림 시점</span>
              <div className="flex gap-2">
                {[
                  { value: 'descent', label: '하강' },
                  { value: 'ascent', label: '상승' },
                  { value: 'both', label: '하강+상승' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setNewAlarmPhase(opt.value as typeof newAlarmPhase)}
                    className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                      newAlarmPhase === opt.value
                        ? 'bg-aqua text-[#04222a]'
                        : 'bg-card text-muted hover:text-ink'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <span className="mono mb-2 block text-[11px] text-muted">알림 소리</span>
              <div className="flex flex-wrap gap-2">
                {ALARM_SOUNDS.map((s) => (
                  <button
                    key={s.type}
                    onClick={() => {
                      setNewAlarmSound(s.type);
                      previewAlarmSound(s.type);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                      newAlarmSound === s.type
                        ? 'bg-coral text-white'
                        : 'bg-card text-muted hover:text-ink'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addAlarm}
                disabled={!newAlarmDepth || Number(newAlarmDepth) <= 0}
                className="flex-1 rounded-lg bg-aqua py-2 text-[13px] font-bold text-[#04222a] disabled:opacity-50"
              >
                추가
              </button>
              <button
                onClick={() => setShowAlarmForm(false)}
                className="rounded-lg bg-card px-4 py-2 text-[13px] text-muted hover:text-ink"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 알림 목록 */}
        {alarms.length > 0 ? (
          <div className="space-y-2">
            {alarms.map((alarm) => {
              const soundLabel = ALARM_SOUNDS.find((s) => s.type === alarm.sound)?.label ?? '단일';
              return (
                <div
                  key={alarm.id}
                  className="flex items-center gap-3 rounded-lg bg-deep px-3 py-2 text-[13px]"
                >
                  <span className="mono font-semibold text-aqua">{alarm.depth}m</span>
                  <span className="flex-1 text-ink">{alarm.label}</span>
                  <button
                    onClick={() => previewAlarmSound(alarm.sound)}
                    className="rounded bg-card px-2 py-0.5 text-[11px] text-coral hover:bg-coral/10"
                  >
                    {soundLabel}
                  </button>
                  <span className="mono text-[11px] text-muted">
                    {alarm.phase === 'descent' ? '하강' : alarm.phase === 'ascent' ? '상승' : '하강+상승'}
                  </span>
                  {!isRunning && (
                    <button
                      onClick={() => removeAlarm(alarm.id)}
                      className="text-muted hover:text-coral"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 5l10 10M15 5L5 15" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[13px] text-muted">
            설정된 알림이 없습니다. 다이빙 컴퓨터처럼 원하는 수심에서 알림을 받으세요.
          </p>
        )}
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
              <div className="flex items-center gap-2">
                {isRunning && (
                  <button
                    onClick={cycleSpeed}
                    className="mono rounded-lg bg-deep px-2.5 py-1 text-[12px] font-semibold text-aqua hover:bg-aqua/20"
                  >
                    {speed}x
                  </button>
                )}
                <span className="mono text-[14px] text-muted">/ {formatTime(totalTime)}</span>
              </div>
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

        {/* 카운트다운 설정 */}
        {!isRunning && !isCountingDown && (
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-muted">시작 카운트다운:</span>
            <div className="flex gap-1">
              {COUNTDOWN_OPTIONS.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setCountdownSec(sec)}
                  className={`mono rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    countdownSec === sec
                      ? 'bg-aqua text-[#04222a]'
                      : 'bg-deep text-muted hover:text-ink'
                  }`}
                >
                  {sec === 0 ? '없음' : `${sec}초`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 카운트다운 표시 */}
        {isCountingDown && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-aqua/30 bg-aqua/5 py-8">
            <span className="mono text-[64px] font-bold text-aqua">{countdownRemaining}</span>
            <span className="text-[14px] text-muted">준비하세요...</span>
          </div>
        )}

        {/* 컨트롤 */}
        <div className="flex gap-3">
          {isRunning || isCountingDown ? (
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
    </div>
  );
}
