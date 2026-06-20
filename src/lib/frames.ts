export function frameCountFor(durationSec: number): number {
  if (durationSec <= 30) return 5;
  if (durationSec <= 60) return 8;
  if (durationSec <= 120) return 10;
  return 12; // cap for cost / latency / quality
}

export interface ExtractResult {
  frames: string[]; // base64 jpeg, no data: prefix
  thumbnail: string; // base64 jpeg
  durationSec: number;
  frameCount: number;
}

const MAX_EDGE = 720;
const JPEG_QUALITY = 0.78;

/**
 * Extracts evenly spaced frames from a video file.
 * If `segment` is given, samples within [start, end] (segment-focus mode).
 */
export async function extractFrames(
  file: File,
  segment?: { startSec: number; endSec: number },
  onProgress?: (done: number, total: number) => void
): Promise<ExtractResult> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  (video as HTMLVideoElement & { playsInline: boolean }).playsInline = true;
  video.src = url;

  try {
    await once(video, 'loadedmetadata');
    const fullDuration = video.duration;
    const start = segment ? clamp(segment.startSec, 0, fullDuration) : 0;
    const end = segment ? clamp(segment.endSec, start + 0.1, fullDuration) : fullDuration;
    const span = end - start;
    const count = segment ? Math.max(5, frameCountFor(span)) : frameCountFor(span);

    const scale = video.videoWidth > MAX_EDGE ? MAX_EDGE / video.videoWidth : 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale) || MAX_EDGE;
    canvas.height = Math.round(video.videoHeight * scale) || Math.round(MAX_EDGE * 0.56);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas context unavailable');

    // sample evenly, nudged slightly inside the edges
    const times: number[] = [];
    for (let i = 0; i < count; i++) {
      times.push(start + (span * (i + 1)) / (count + 1));
    }

    const frames: string[] = [];
    for (let i = 0; i < times.length; i++) {
      await seek(video, times[i]);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1]);
      onProgress?.(i + 1, times.length);
    }

    return {
      frames,
      thumbnail: frames[Math.floor(frames.length / 2)] ?? frames[0],
      durationSec: fullDuration,
      frameCount: frames.length,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function once(el: HTMLMediaElement, ev: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ok = () => {
      cleanup();
      resolve();
    };
    const err = () => {
      cleanup();
      reject(new Error(`video ${ev} failed`));
    };
    const cleanup = () => {
      el.removeEventListener(ev, ok);
      el.removeEventListener('error', err);
    };
    el.addEventListener(ev, ok);
    el.addEventListener('error', err);
  });
}

function seek(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    const handler = () => {
      video.removeEventListener('seeked', handler);
      resolve();
    };
    video.addEventListener('seeked', handler);
    video.currentTime = t;
  });
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
