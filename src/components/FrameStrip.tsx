interface FrameStripProps {
  frames: string[];  // base64 (data: prefix 없음)
  isExtracting?: boolean;
}

export function FrameStrip({ frames, isExtracting }: FrameStripProps) {
  if (frames.length === 0 && !isExtracting) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-[var(--descent-text-dim)]">
          {isExtracting ? '프레임 추출 중...' : `추출된 프레임 (${frames.length}장)`}
        </span>
        {isExtracting && (
          <div className="w-4 h-4 border-2 border-[var(--descent-accent)] border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {frames.map((frame, index) => (
          <div
            key={index}
            className="flex-shrink-0 relative rounded-lg overflow-hidden border border-[var(--descent-border)]"
          >
            <img
              src={`data:image/jpeg;base64,${frame}`}
              alt={`Frame ${index + 1}`}
              className="h-20 w-auto object-cover"
            />
            <span className="absolute bottom-1 right-1 text-xs bg-black/60 px-1.5 py-0.5 rounded">
              {index + 1}
            </span>
          </div>
        ))}

        {isExtracting && (
          <div className="flex-shrink-0 h-20 w-32 rounded-lg border border-[var(--descent-border)] bg-[var(--descent-card)] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[var(--descent-accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
