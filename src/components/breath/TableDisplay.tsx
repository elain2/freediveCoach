import type { BreathTable } from '../../lib/types';
import { formatTime, formatTimeCompact } from '../../lib/breathTable';

interface TableDisplayProps {
  table: BreathTable;
  currentRound: number;
  phase: 'idle' | 'breathe' | 'hold' | 'complete';
}

export default function TableDisplay({ table, currentRound, phase }: TableDisplayProps) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-card/40 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold">
          {table.mode === 'co2' ? 'CO₂' : 'O₂'} 테이블
        </h3>
        <div className="mono text-[12px] text-muted">
          총 {formatTimeCompact(table.totalTimeSec)} · 숨참기 {formatTimeCompact(table.totalHoldSec)}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--line)]">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[var(--line)] bg-deep/50 text-muted">
              <th className="py-2.5 pl-4 text-left font-medium">라운드</th>
              <th className="py-2.5 text-center font-medium">호흡</th>
              <th className="py-2.5 pr-4 text-center font-medium">숨참기</th>
            </tr>
          </thead>
          <tbody>
            {table.rounds.map((r, idx) => {
              const isActive = idx === currentRound && phase !== 'idle' && phase !== 'complete';
              const isComplete = idx < currentRound || phase === 'complete';
              const isBreathe = isActive && phase === 'breathe';
              const isHold = isActive && phase === 'hold';

              return (
                <tr
                  key={r.round}
                  className={`border-b border-[var(--line)] last:border-b-0 transition-colors ${
                    isActive ? 'bg-aqua/10' : isComplete ? 'bg-deep/30 text-muted' : ''
                  }`}
                >
                  <td className="py-3 pl-4">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold ${
                        isActive
                          ? 'bg-aqua text-[#04222a]'
                          : isComplete
                          ? 'bg-aqua/30 text-aqua'
                          : 'bg-[var(--line)] text-muted'
                      }`}
                    >
                      {r.round}
                    </span>
                  </td>
                  <td
                    className={`mono py-3 text-center ${
                      isBreathe ? 'text-sky font-bold' : isComplete ? 'line-through' : ''
                    }`}
                  >
                    {formatTime(r.breatheSec)}
                  </td>
                  <td
                    className={`mono py-3 pr-4 text-center ${
                      isHold ? 'text-coral font-bold' : isComplete ? 'line-through' : ''
                    }`}
                  >
                    {formatTime(r.holdSec)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
