import { useCallback, useState, useRef, useEffect } from 'react';

interface VideoDropzoneProps {
  onVideoLoad: (video: HTMLVideoElement, file: File) => void;
  onVideoRef?: (video: HTMLVideoElement | null) => void;
  disabled?: boolean;
}

export function VideoDropzone({ onVideoLoad, onVideoRef, disabled }: VideoDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 비디오 ref 변경 시 부모에게 알림
  useEffect(() => {
    onVideoRef?.(videoRef.current);
  }, [videoUrl, onVideoRef]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('비디오 파일만 업로드할 수 있습니다.');
      return;
    }

    // 이전 URL 해제
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }

    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setFileName(file.name);
  }, [videoUrl]);

  const handleVideoLoaded = useCallback(() => {
    if (videoRef.current && fileName) {
      setDuration(videoRef.current.duration);
      onVideoRef?.(videoRef.current);

      // 파일 객체를 다시 가져오기 위해 input에서 참조
      const file = inputRef.current?.files?.[0];
      if (file) {
        onVideoLoad(videoRef.current, file);
      }
    }
  }, [onVideoLoad, onVideoRef, fileName]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
      // input에도 파일 설정 (DataTransfer 사용)
      if (inputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        inputRef.current.files = dt.files;
      }
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleReset = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setFileName(null);
    setDuration(0);
    onVideoRef?.(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {!videoUrl ? (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
            transition-all duration-200
            ${isDragging
              ? 'border-[var(--descent-accent)] bg-[var(--descent-accent)]/10'
              : 'border-[var(--descent-border)] hover:border-[var(--descent-accent-dim)]'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <svg
            className="w-16 h-16 mx-auto mb-4 text-[var(--descent-accent)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <h3 className="text-lg font-medium mb-2">다이빙 영상 업로드</h3>
          <p className="text-[var(--descent-text-dim)] text-sm">
            측면에서 촬영한 다이빙 클립을 드래그하거나 클릭하여 선택하세요
          </p>
          <p className="text-[var(--descent-text-dim)] text-xs mt-2">
            권장: 측면 촬영, 고대비, 1분 30초 이내
          </p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden bg-[var(--descent-card)] border border-[var(--descent-border)]">
          <video
            ref={videoRef}
            src={videoUrl}
            onLoadedMetadata={handleVideoLoaded}
            controls
            className="w-full max-h-[400px] object-contain bg-black"
          />
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[var(--descent-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-sm truncate max-w-[200px]">{fileName}</span>
              {duration > 0 && (
                <span className="text-xs text-[var(--descent-text-dim)]">
                  {formatDuration(duration)}
                </span>
              )}
            </div>
            <button
              onClick={handleReset}
              disabled={disabled}
              className="text-sm text-[var(--descent-text-dim)] hover:text-[var(--descent-warning)] transition-colors disabled:opacity-50"
            >
              다른 영상 선택
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
