import type { TimerPhase } from '../../lib/types';
import { formatTime } from '../../lib/breathTable';

interface TableTimerProps {
  phase: TimerPhase;
  currentRound: number;
  totalRounds: number;
  remainingSec: number;
  progress: number;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export default function TableTimer({
  phase,
  currentRound,
  totalRounds,
  remainingSec,
  progress,
  isRunning,
  onStart,
  onPause,
  onReset,
}: TableTimerProps) {
  const phaseLabel = phase === 'breathe' ? '호흡' : phase === 'hold' ? '숨참기' : phase === 'complete' ? '완료' : '대기';
  const phaseColor = phase === 'breathe' ? 'text-sky' : phase === 'hold' ? 'text-coral' : 'text-aqua';

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-card/40 p-5">
      <div className="mb-6 text-center">
        <div className={`mb-1 text-[13px] font-semibold ${phaseColor}`}>{phaseLabel}</div>
        <div className="mono text-[56px] font-bold leading-none tracking-tight">
          {phase === 'idle' || phase === 'complete' ? '--:--' : formatTime(remainingSec)}
        </div>
        {phase !== 'idle' && phase !== 'complete' && (
          <div className="mt-2 text-[13px] text-muted">
            라운드 {currentRound + 1} / {totalRounds}
          </div>
        )}
      </div>

      {/* 진행바 */}
      <div className="mb-6 h-3 overflow-hidden rounded-full bg-deep">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            phase === 'breathe' ? 'bg-sky' : phase === 'hold' ? 'bg-coral' : 'bg-aqua'
          }`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* 컨트롤 */}
      <div className="flex gap-3">
        {phase === 'complete' ? (
          <button
            onClick={onReset}
            className="flex-1 rounded-xl bg-aqua py-3.5 text-[14px] font-bold text-[#04222a] transition-transform hover:-translate-y-px"
          >
            다시 시작
          </button>
        ) : isRunning ? (
          <>
            <button
              onClick={onPause}
              className="flex-1 rounded-xl border border-amber bg-amber/10 py-3.5 text-[14px] font-bold text-amber transition-transform hover:-translate-y-px"
            >
              일시정지
            </button>
            <button
              onClick={onReset}
              className="rounded-xl border border-[var(--line)] px-5 py-3.5 text-[14px] font-semibold text-muted hover:border-coral hover:text-coral"
            >
              초기화
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onStart}
              className="flex-1 rounded-xl bg-aqua py-3.5 text-[14px] font-bold text-[#04222a] transition-transform hover:-translate-y-px"
            >
              {phase === 'idle' ? '시작' : '계속'}
            </button>
            {phase !== 'idle' && (
              <button
                onClick={onReset}
                className="rounded-xl border border-[var(--line)] px-5 py-3.5 text-[14px] font-semibold text-muted hover:border-coral hover:text-coral"
              >
                초기화
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
