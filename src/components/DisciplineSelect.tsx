import type { DisciplineId } from '../../shared/types';
import { DISCIPLINES, type DisciplineInfo } from '../disciplines';

interface DisciplineSelectProps {
  value: DisciplineId;
  onChange: (discipline: DisciplineId) => void;
  disabled?: boolean;
}

export function DisciplineSelect({ value, onChange, disabled }: DisciplineSelectProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm text-[var(--descent-text-dim)]">종목 선택</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {DISCIPLINES.map((discipline) => (
          <DisciplineCard
            key={discipline.id}
            discipline={discipline}
            selected={value === discipline.id}
            onClick={() => discipline.available && onChange(discipline.id)}
            disabled={disabled || !discipline.available}
          />
        ))}
      </div>
    </div>
  );
}

interface DisciplineCardProps {
  discipline: DisciplineInfo;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function DisciplineCard({ discipline, selected, onClick, disabled }: DisciplineCardProps) {
  const icon = getIcon(discipline.id);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative p-4 rounded-xl border text-left transition-all duration-200
        ${selected
          ? 'bg-[var(--descent-accent)]/20 border-[var(--descent-accent)]'
          : 'border-[var(--descent-border)] hover:border-[var(--descent-accent-dim)]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {!discipline.available && (
        <span className="absolute top-2 right-2 text-xs px-2 py-0.5 bg-[var(--descent-surface)] text-[var(--descent-text-dim)] rounded">
          준비중
        </span>
      )}

      <div className={`w-8 h-8 mb-2 ${selected ? 'text-[var(--descent-accent)]' : 'text-[var(--descent-text-dim)]'}`}>
        {icon}
      </div>

      <h3 className={`font-medium text-sm ${selected ? 'text-[var(--descent-accent)]' : 'text-[var(--descent-text)]'}`}>
        {discipline.id}
      </h3>
      <p className="text-xs text-[var(--descent-text-dim)] mt-1 line-clamp-2">
        {discipline.description}
      </p>
    </button>
  );
}

function getIcon(id: DisciplineId) {
  switch (id) {
    case 'CWT':
      // 핀 다이버
      return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v20M8 6l4-4 4 4M8 18l4 4 4-4M6 12h12" />
        </svg>
      );
    case 'CNF':
      // 맨몸 다이버
      return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
          <circle cx="12" cy="5" r="2" strokeWidth={1.5} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7v6m0 0l-3 8m3-8l3 8" />
        </svg>
      );
    case 'FIM':
      // 로프 당기기
      return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v20M8 8l4-2 4 2M8 14l4 2 4-2" />
        </svg>
      );
    case 'DYN':
      // 수평 이동
      return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4" />
        </svg>
      );
    case 'STA':
      // 숨 참기
      return (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
          <circle cx="12" cy="12" r="8" strokeWidth={1.5} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l2 2" />
        </svg>
      );
    default:
      return null;
  }
}
