import { useState, useRef, useCallback, useEffect } from 'react';
import type { Segment } from '../../shared/types';

interface SegmentTrimmerProps {
  duration: number;  // 영상 전체 길이 (초)
  segment: Segment;
  onChange: (segment: Segment) => void;
  videoRef: HTMLVideoElement | null;
  disabled?: boolean;
}

export function SegmentTrimmer({ duration, segment, onChange, videoRef, disabled }: SegmentTrimmerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // 비디오 현재 시간 추적
  useEffect(() => {
    if (!videoRef) return;

    const handleTimeUpdate = () => {
      setCurrentTime(videoRef.currentTime);
    };

    videoRef.addEventListener('timeupdate', handleTimeUpdate);
    return () => videoRef.removeEventListener('timeupdate', handleTimeUpdate);
  }, [videoRef]);

  const getPositionFromTime = (time: number) => {
    return (time / duration) * 100;
  };

  const getTimeFromPosition = (clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const position = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(duration, position * duration));
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, handle: 'start' | 'end') => {
    e.preventDefault();
    if (disabled) return;
    setDragging(handle);
  }, [disabled]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || disabled) return;

    const time = getTimeFromPosition(e.clientX);

    if (dragging === 'start') {
      // 시작점은 끝점보다 최소 2초 전이어야 함
      const newStart = Math.min(time, segment.endSec - 2);
      onChange({ ...segment, startSec: Math.max(0, newStart) });
    } else {
      // 끝점은 시작점보다 최소 2초 후여야 함
      const newEnd = Math.max(time, segment.startSec + 2);
      onChange({ ...segment, endSec: Math.min(duration, newEnd) });
    }
  }, [dragging, disabled, segment, onChange, duration]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (disabled || !videoRef) return;

    const time = getTimeFromPosition(e.clientX);
    videoRef.currentTime = time;
  }, [disabled, videoRef]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const segmentDuration = segment.endSec - segment.startSec;

  return (
    <div className={`space-y-3 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--descent-text-dim)]">분석 구간 선택</span>
        <span className="text-[var(--descent-accent)]">
          {formatTime(segmentDuration)} 선택됨
        </span>
      </div>

      {/* 타임라인 트랙 */}
      <div
        ref={trackRef}
        className="relative h-12 bg-[var(--descent-surface)] rounded-lg cursor-pointer"
        onClick={handleTrackClick}
      >
        {/* 선택 영역 */}
        <div
          className="absolute top-0 bottom-0 bg-[var(--descent-accent)]/30 rounded"
          style={{
            left: `${getPositionFromTime(segment.startSec)}%`,
            width: `${getPositionFromTime(segment.endSec) - getPositionFromTime(segment.startSec)}%`,
          }}
        />

        {/* 현재 재생 위치 */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/80 z-10"
          style={{ left: `${getPositionFromTime(currentTime)}%` }}
        />

        {/* 시작 핸들 */}
        <div
          className={`absolute top-0 bottom-0 w-4 cursor-ew-resize z-20 group ${disabled ? 'pointer-events-none' : ''}`}
          style={{ left: `calc(${getPositionFromTime(segment.startSec)}% - 8px)` }}
          onMouseDown={(e) => handleMouseDown(e, 'start')}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-8 bg-[var(--descent-accent)] rounded-full group-hover:scale-110 transition-transform" />
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-[var(--descent-deep)] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {formatTime(segment.startSec)}
          </div>
        </div>

        {/* 끝 핸들 */}
        <div
          className={`absolute top-0 bottom-0 w-4 cursor-ew-resize z-20 group ${disabled ? 'pointer-events-none' : ''}`}
          style={{ left: `calc(${getPositionFromTime(segment.endSec)}% - 8px)` }}
          onMouseDown={(e) => handleMouseDown(e, 'end')}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-8 bg-[var(--descent-accent)] rounded-full group-hover:scale-110 transition-transform" />
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-[var(--descent-deep)] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {formatTime(segment.endSec)}
          </div>
        </div>

        {/* 타임 마커 */}
        <div className="absolute bottom-1 left-2 text-xs text-[var(--descent-text-dim)]">
          0:00
        </div>
        <div className="absolute bottom-1 right-2 text-xs text-[var(--descent-text-dim)]">
          {formatTime(duration)}
        </div>
      </div>

      {/* 구간 정보 */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[var(--descent-text-dim)]">시작: </span>
            <span className="text-[var(--descent-text)] font-mono">{formatTime(segment.startSec)}</span>
          </div>
          <div>
            <span className="text-[var(--descent-text-dim)]">끝: </span>
            <span className="text-[var(--descent-text)] font-mono">{formatTime(segment.endSec)}</span>
          </div>
        </div>
        <button
          onClick={() => onChange({ startSec: 0, endSec: duration })}
          disabled={disabled}
          className="text-xs text-[var(--descent-text-dim)] hover:text-[var(--descent-accent)] transition-colors disabled:opacity-50"
        >
          전체 선택
        </button>
      </div>

      {/* 힌트 */}
      <p className="text-xs text-[var(--descent-text-dim)]">
        핸들을 드래그하여 분석할 구간을 지정하세요. 타임라인 클릭으로 영상 위치 이동.
      </p>
    </div>
  );
}
