import type { Session } from '../../shared/types';
import { getDiscipline } from '../disciplines';
import { ResultCard } from './ResultCard';

interface SessionDetailProps {
  session: Session;
  onClose: () => void;
  onCopyMarkdown: () => void;
}

export function SessionDetail({ session, onClose, onCopyMarkdown }: SessionDetailProps) {
  const disciplineInfo = getDiscipline(session.discipline);
  const date = new Date(session.createdAt);
  const dateStr = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-sm text-[var(--descent-text-dim)] hover:text-[var(--descent-accent)] transition-colors mb-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            목록으로
          </button>

          <h2 className="text-xl font-medium text-[var(--descent-text)]">
            {session.videoName}
          </h2>

          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="px-2 py-1 bg-[var(--descent-accent)]/20 text-[var(--descent-accent)] rounded">
              {disciplineInfo?.label || session.discipline}
            </span>
            <span className="text-[var(--descent-text-dim)]">
              {dateStr} {timeStr}
            </span>
          </div>
        </div>

        {/* 썸네일 */}
        {session.thumbnail && (
          <div className="flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden">
            <img
              src={`data:image/jpeg;base64,${session.thumbnail}`}
              alt="썸네일"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* 메타 정보 */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-[var(--descent-card)] border border-[var(--descent-border)] rounded-xl">
        <div>
          <span className="text-xs text-[var(--descent-text-dim)]">분석 모드</span>
          <p className="text-sm text-[var(--descent-text)] mt-1">
            {session.mode === 'overview' ? '전체 개요' : '구간 집중'}
          </p>
        </div>
        <div>
          <span className="text-xs text-[var(--descent-text-dim)]">영상 길이</span>
          <p className="text-sm text-[var(--descent-text)] mt-1">
            {formatTime(session.durationSec)}
          </p>
        </div>
        <div>
          <span className="text-xs text-[var(--descent-text-dim)]">분석 프레임</span>
          <p className="text-sm text-[var(--descent-text)] mt-1">
            {session.frameCount}장
          </p>
        </div>
        {session.mode === 'segment' && session.segment && (
          <div className="col-span-3">
            <span className="text-xs text-[var(--descent-text-dim)]">분석 구간</span>
            <p className="text-sm text-[var(--descent-text)] mt-1">
              {formatTime(session.segment.startSec)} - {formatTime(session.segment.endSec)}
            </p>
          </div>
        )}
      </div>

      {/* 결과 카드 */}
      <ResultCard
        result={session.result}
        onCopyMarkdown={onCopyMarkdown}
        onReset={onClose}
      />
    </div>
  );
}
