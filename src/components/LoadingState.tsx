interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = '분석 중...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* 하강 애니메이션 */}
      <div className="relative w-24 h-32 mb-6">
        {/* 로프 라인 */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[var(--descent-border)]" />

        {/* 다이버 (하강 중) */}
        <div className="absolute left-1/2 -translate-x-1/2 animate-bounce">
          <svg
            className="w-8 h-8 text-[var(--descent-accent)]"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="4" r="2" />
            <path d="M12 7c-1.5 0-2.5 1-2.5 2v4l-2 3h2l.5 4h4l.5-4h2l-2-3V9c0-1-1-2-2.5-2z" />
          </svg>
        </div>

        {/* 깊이 마커 */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute left-1/2 -translate-x-1/2 w-3 h-0.5 bg-[var(--descent-border)]"
            style={{ top: `${25 + i * 20}%` }}
          />
        ))}
      </div>

      <p className="text-[var(--descent-text)] font-medium">{message}</p>
      <p className="text-sm text-[var(--descent-text-dim)] mt-2">
        AI가 폼을 분석하고 있습니다
      </p>

      {/* 진행 점들 */}
      <div className="flex gap-1 mt-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[var(--descent-accent)] animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
