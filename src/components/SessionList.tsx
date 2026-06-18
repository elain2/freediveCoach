import type { Session } from '../../shared/types';
import { getDiscipline } from '../disciplines';

interface SessionListProps {
  sessions: Session[];
  onSelect: (session: Session) => void;
  onDelete: (id: string) => void;
  selectedId?: string;
}

export function SessionList({ sessions, onSelect, onDelete, selectedId }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-[var(--descent-text-dim)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="text-lg font-medium mb-2">분석 기록이 없습니다</h3>
        <p className="text-[var(--descent-text-dim)] text-sm">
          다이빙 영상을 분석하면 여기에 기록됩니다
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          selected={session.id === selectedId}
          onSelect={() => onSelect(session)}
          onDelete={() => onDelete(session.id)}
        />
      ))}
    </div>
  );
}

interface SessionCardProps {
  session: Session;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function SessionCard({ session, selected, onSelect, onDelete }: SessionCardProps) {
  const disciplineInfo = getDiscipline(session.discipline);
  const date = new Date(session.createdAt);
  const dateStr = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // 평균 점수 계산
  const avgScore = session.result.categories.reduce((sum, cat) => sum + cat.score, 0) / session.result.categories.length;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('이 기록을 삭제하시겠습니까?')) {
      onDelete();
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`
        flex gap-4 p-4 rounded-xl border cursor-pointer transition-all
        ${selected
          ? 'bg-[var(--descent-accent)]/10 border-[var(--descent-accent)]'
          : 'bg-[var(--descent-card)] border-[var(--descent-border)] hover:border-[var(--descent-accent-dim)]'
        }
      `}
    >
      {/* 썸네일 */}
      <div className="flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden bg-[var(--descent-surface)]">
        {session.thumbnail ? (
          <img
            src={`data:image/jpeg;base64,${session.thumbnail}`}
            alt="썸네일"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--descent-text-dim)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs px-2 py-0.5 bg-[var(--descent-accent)]/20 text-[var(--descent-accent)] rounded">
            {disciplineInfo?.label || session.discipline}
          </span>
          <span className="text-xs text-[var(--descent-text-dim)]">
            {session.mode === 'overview' ? '전체' : '구간'}
          </span>
        </div>

        <p className="text-sm text-[var(--descent-text)] truncate mb-1">
          {session.videoName}
        </p>

        <div className="flex items-center gap-3 text-xs text-[var(--descent-text-dim)]">
          <span>{dateStr} {timeStr}</span>
          <span className={`font-medium ${getScoreColor(avgScore)}`}>
            평균 {avgScore.toFixed(1)}점
          </span>
        </div>
      </div>

      {/* 삭제 버튼 */}
      <button
        onClick={handleDelete}
        className="flex-shrink-0 p-2 text-[var(--descent-text-dim)] hover:text-red-400 transition-colors"
        title="삭제"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 4) return 'text-[var(--descent-success)]';
  if (score >= 3) return 'text-[var(--descent-accent)]';
  if (score >= 2) return 'text-[var(--descent-warning)]';
  return 'text-red-400';
}
