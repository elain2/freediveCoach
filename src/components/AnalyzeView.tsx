import { useRef, useState } from 'react';
import { DISCIPLINES, type AnalysisMode, type AnalysisResult, type DisciplineId, type Session } from '../lib/types';
import { extractFrames } from '../lib/frames';
import { analyzeFrames } from '../lib/api';
import { saveSession } from '../lib/storage';
import ResultCard from './ResultCard';

export default function AnalyzeView() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [duration, setDuration] = useState(0);
  const [discipline, setDiscipline] = useState<DisciplineId>('CWT');
  const [mode, setMode] = useState<AnalysisMode>('overview');
  const [seg, setSeg] = useState({ start: 0, end: 0 });
  const [frames, setFrames] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('video/')) {
      setError('영상 파일을 올려주세요 (mp4, mov 등).');
      return;
    }
    setError('');
    setResult(null);
    setFrames([]);
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
  };

  const onMeta = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const d = e.currentTarget.duration;
    setDuration(d);
    setSeg({ start: 0, end: Math.min(d, 30) });
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    setResult(null);
    setFrames([]);
    try {
      setBusyMsg('하강 중 — 프레임 추출하고 있어요…');
      const segment = mode === 'segment' ? { startSec: seg.start, endSec: seg.end } : undefined;
      const ex = await extractFrames(file, segment);
      setFrames(ex.frames.map((f) => `data:image/jpeg;base64,${f}`));

      setBusyMsg('🐱 폼 읽는 중 — 코치가 영상을 보고 있어요…');
      const res = await analyzeFrames({ discipline, mode, segment, frames: ex.frames });
      setResult(res);

      const session: Session = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        discipline,
        mode,
        segment,
        videoName: file.name,
        durationSec: ex.durationSec,
        frameCount: ex.frameCount,
        thumbnail: ex.thumbnail,
        result: res,
      };
      await saveSession(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : '분석 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="mb-6 max-w-[46ch] break-keep text-[15px] text-muted">
        측면에서 찍은 다이빙 클립을 올리면 프레임을 추출해 유선형·핀킥·입수·이완을 읽고,
        블로그·쇼츠에 바로 옮길 코칭 카드로 돌려줍니다.
      </p>

      {/* discipline */}
      <div className="mb-3 flex flex-wrap gap-2">
        {DISCIPLINES.map((d) => (
          <button
            key={d.id}
            disabled={!d.ready}
            onClick={() => setDiscipline(d.id)}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
              discipline === d.id ? 'border-aqua text-aqua' : 'border-[var(--line)] text-muted'
            } ${d.ready ? 'hover:border-aqua' : 'cursor-not-allowed opacity-40'}`}
          >
            {d.label}
            {!d.ready && ' · 준비중'}
          </button>
        ))}
      </div>

      {/* dropzone */}
      <label
        className="block cursor-pointer rounded-2xl border border-dashed border-[var(--line)] bg-card/30 px-7 py-11 text-center transition-colors hover:border-aqua"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onPick(e.dataTransfer.files[0]);
        }}
      >
        <div className="mb-3.5 text-3xl">🌊</div>
        <div className="mb-1.5 text-base font-semibold">{file ? file.name : '다이빙 영상 올리기'}</div>
        <div className="text-[13px] text-muted">측면 뷰 · 다이브 타임 길이 제한 없음 · 클릭 또는 드래그</div>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
      </label>

      {videoUrl && (
        <div className="mt-6">
          <video src={videoUrl} controls playsInline muted onLoadedMetadata={onMeta} className="w-full rounded-xl border border-[var(--line)]" />

          {/* mode toggle */}
          <div className="mt-4 flex gap-2">
            {(['overview', 'segment'] as AnalysisMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                  mode === m ? 'border-aqua text-aqua' : 'border-[var(--line)] text-muted hover:border-aqua'
                }`}
              >
                {m === 'overview' ? '전체 다이브 개요' : '구간 집중'}
              </button>
            ))}
          </div>

          {mode === 'segment' && duration > 0 && (
            <div className="mono mt-3 rounded-xl border border-[var(--line)] bg-card/40 p-4 text-[12px] text-muted">
              <div className="mb-2">구간 지정 (초)</div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  IN
                  <input
                    type="number" min={0} max={duration} step={0.5} value={seg.start}
                    onChange={(e) => setSeg((s) => ({ ...s, start: Math.min(Number(e.target.value), s.end - 0.5) }))}
                    className="w-20 rounded bg-deep px-2 py-1 text-ink"
                  />
                </label>
                <label className="flex items-center gap-2">
                  OUT
                  <input
                    type="number" min={0} max={duration} step={0.5} value={seg.end}
                    onChange={(e) => setSeg((s) => ({ ...s, end: Math.max(Number(e.target.value), s.start + 0.5) }))}
                    className="w-20 rounded bg-deep px-2 py-1 text-ink"
                  />
                </label>
                <span className="opacity-70">전체 {duration.toFixed(1)}s</span>
              </div>
            </div>
          )}

          <button
            onClick={run}
            disabled={busy}
            className="mt-5 w-full rounded-xl bg-aqua py-4 text-[15px] font-bold text-[#04222a] shadow-[0_8px_30px_-10px_rgba(79,224,204,.6)] transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
          >
            폼 분석 시작
          </button>
        </div>
      )}

      {frames.length > 0 && (
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {frames.map((f, i) => (
            <img key={i} src={f} className="h-[76px] flex-none rounded-lg border border-[var(--line)]" />
          ))}
        </div>
      )}

      {busy && (
        <div className="mono mt-7 flex items-center gap-3.5 text-[13px] text-muted">
          <span className="sonar" />
          {busyMsg}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl border border-coral/35 bg-coral/10 p-4 text-[14px] text-[#ffd7c9]">{error}</div>
      )}

      {result && <ResultCard result={result} />}

      <p className="mt-9 border-t border-[var(--line)] pt-4.5 text-[12px] leading-relaxed text-muted">
        점수는 업로드한 프레임에서 보이는 단서로만 추정한 거예요. 이퀄라이징·컨트랙션처럼 영상으로 판단
        불가한 부분은 빠집니다. 측면·일관된 각도로 찍을수록 정확해지고, 실제 수중 코칭과 안전 판단을
        대체하지 않습니다.
      </p>
    </div>
  );
}
