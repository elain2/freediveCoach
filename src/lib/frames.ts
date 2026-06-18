// src/lib/frames.ts
// 영상에서 프레임 추출 유틸리티

/**
 * 영상 길이에 따른 프레임 수 결정 (상한 12장)
 */
export function frameCountFor(durationSec: number): number {
  if (durationSec <= 30) return 5;
  if (durationSec <= 60) return 8;
  if (durationSec <= 120) return 10;
  return 12; // 비용/지연/품질 상한
}

/**
 * 구간 집중 모드에서의 프레임 수 (최소 5장 보장)
 */
export function frameCountForSegment(segmentDurationSec: number): number {
  return Math.max(5, frameCountFor(segmentDurationSec));
}

/**
 * 영상이 상한(120초)을 초과하는지 확인
 */
export function isOverLimit(durationSec: number): boolean {
  return durationSec > 120;
}

export interface ExtractOptions {
  startSec?: number;
  endSec?: number;
  maxDimension?: number;  // 긴 변 최대 크기 (기본 720)
  quality?: number;       // JPEG 품질 (기본 0.78)
}

/**
 * video 엘리먼트에서 프레임 추출
 * @returns base64 JPEG 문자열 배열 (data: prefix 없음)
 */
export async function extractFrames(
  video: HTMLVideoElement,
  options: ExtractOptions = {}
): Promise<string[]> {
  const {
    startSec = 0,
    endSec = video.duration,
    maxDimension = 720,
    quality = 0.78,
  } = options;

  const duration = endSec - startSec;
  const count = options.startSec !== undefined && options.endSec !== undefined
    ? frameCountForSegment(duration)
    : frameCountFor(duration);

  // 캔버스 설정
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  // 다운스케일 계산
  const scale = Math.min(1, maxDimension / Math.max(video.videoWidth, video.videoHeight));
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);

  const frames: string[] = [];

  // 양 끝을 살짝 안쪽으로 (첫/마지막 프레임 흐림 방지)
  const padding = duration * 0.02; // 2% 패딩
  const effectiveStart = startSec + padding;
  const effectiveEnd = endSec - padding;
  const effectiveDuration = effectiveEnd - effectiveStart;
  const interval = effectiveDuration / (count - 1);

  for (let i = 0; i < count; i++) {
    const time = effectiveStart + interval * i;
    await seekTo(video, time);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    // data:image/jpeg;base64, 제거
    frames.push(dataUrl.split(',')[1]);
  }

  return frames;
}

/**
 * video를 특정 시간으로 seek
 */
function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };
    video.addEventListener('seeked', onSeeked);
    video.currentTime = time;
  });
}

/**
 * 썸네일 추출 (첫 프레임 기준, 목록용)
 */
export async function extractThumbnail(
  video: HTMLVideoElement,
  maxDimension = 320
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  const scale = Math.min(1, maxDimension / Math.max(video.videoWidth, video.videoHeight));
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);

  // 10% 지점에서 썸네일 추출 (시작 프레임 흐림 방지)
  await seekTo(video, video.duration * 0.1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
}
