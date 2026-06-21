import type { TableMode } from '../../lib/types';

interface TableConfigProps {
  mode: TableMode;
  onModeChange: (mode: TableMode) => void;
  pbSec: number;
  onPbChange: (sec: number) => void;
  onGenerate: () => void;
}

export default function TableConfig({ mode, onModeChange, pbSec, onPbChange, onGenerate }: TableConfigProps) {
  const pbMin = Math.floor(pbSec / 60);
  const pbSecRemainder = pbSec % 60;

  const handleMinChange = (min: number) => {
    onPbChange(min * 60 + pbSecRemainder);
  };

  const handleSecChange = (sec: number) => {
    onPbChange(pbMin * 60 + sec);
  };

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-card/40 p-5">
      <div className="mb-5">
        <label className="mb-2 block text-[13px] font-medium text-muted">훈련 모드</label>
        <div className="flex gap-2">
          {(['co2', 'o2'] as const).map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                mode === m ? 'border-aqua text-aqua' : 'border-[var(--line)] text-muted hover:border-aqua'
              }`}
            >
              {m === 'co2' ? 'CO₂ 테이블' : 'O₂ 테이블'}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-muted">
          {mode === 'co2'
            ? 'CO₂ 내성 훈련: 숨참기 고정, 호흡 시간 점점 감소'
            : 'O₂ 내성 훈련: 호흡 고정, 숨참기 시간 점점 증가'}
        </p>
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-[13px] font-medium text-muted">PB (최대 숨참기 기록)</label>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={10}
              value={pbMin}
              onChange={(e) => handleMinChange(Math.max(0, parseInt(e.target.value) || 0))}
              className="mono w-16 rounded-lg bg-deep px-3 py-2.5 text-center text-[16px] text-ink"
            />
            <span className="text-[13px] text-muted">분</span>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={59}
              value={pbSecRemainder}
              onChange={(e) => handleSecChange(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
              className="mono w-16 rounded-lg bg-deep px-3 py-2.5 text-center text-[16px] text-ink"
            />
            <span className="text-[13px] text-muted">초</span>
          </div>
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={pbSec < 30}
        className="w-full rounded-xl bg-aqua py-3.5 text-[14px] font-bold text-[#04222a] transition-transform hover:-translate-y-px disabled:opacity-45"
      >
        테이블 생성
      </button>
      {pbSec < 30 && <p className="mt-2 text-center text-[12px] text-coral">PB는 최소 30초 이상이어야 합니다</p>}
    </div>
  );
}
