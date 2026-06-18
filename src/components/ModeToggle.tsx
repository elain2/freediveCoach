import type { AnalysisMode } from '../../shared/types';

interface ModeToggleProps {
  mode: AnalysisMode;
  onChange: (mode: AnalysisMode) => void;
  disabled?: boolean;
}

export function ModeToggle({ mode, onChange, disabled }: ModeToggleProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange('overview')}
        disabled={disabled}
        className={`
          flex-1 py-3 px-4 rounded-lg border transition-all duration-200
          ${mode === 'overview'
            ? 'bg-[var(--descent-accent)]/20 border-[var(--descent-accent)] text-[var(--descent-accent)]'
            : 'border-[var(--descent-border)] text-[var(--descent-text-dim)] hover:border-[var(--descent-accent-dim)]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="font-medium">전체 개요</span>
        </div>
        <p className="text-xs mt-1 opacity-70">
          다이브 전체 흐름 분석
        </p>
      </button>

      <button
        onClick={() => onChange('segment')}
        disabled={disabled}
        className={`
          flex-1 py-3 px-4 rounded-lg border transition-all duration-200
          ${mode === 'segment'
            ? 'bg-[var(--descent-accent)]/20 border-[var(--descent-accent)] text-[var(--descent-accent)]'
            : 'border-[var(--descent-border)] text-[var(--descent-text-dim)] hover:border-[var(--descent-accent-dim)]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
          <span className="font-medium">구간 집중</span>
        </div>
        <p className="text-xs mt-1 opacity-70">
          특정 구간 상세 분석
        </p>
      </button>
    </div>
  );
}
