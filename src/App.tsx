import { useState, useCallback, useEffect, useMemo } from 'react';
import { VideoDropzone } from './components/VideoDropzone';
import { FrameStrip } from './components/FrameStrip';
import { LoadingState } from './components/LoadingState';
import { ResultCard } from './components/ResultCard';
import { ModeToggle } from './components/ModeToggle';
import { SegmentTrimmer } from './components/SegmentTrimmer';
import { DisciplineSelect } from './components/DisciplineSelect';
import { SessionList } from './components/SessionList';
import { SessionDetail } from './components/SessionDetail';
import { ComparisonChart } from './components/ComparisonChart';
import { extractFrames, extractThumbnail, isOverLimit } from './lib/frames';
import { analyzeFrames, ApiError } from './lib/api';
import { saveSession, getAllSessions, deleteSession, generateId } from './lib/storage';
import { getDiscipline } from './disciplines';
import type { AnalysisResult, AnalysisMode, Segment, DisciplineId, Session } from '../shared/types';
import './index.css';

type View = 'analyze' | 'history';
type AnalyzeStep = 'upload' | 'ready' | 'extracting' | 'analyzing' | 'result' | 'error';

function App() {
  const [currentView, setCurrentView] = useState<View>('analyze');

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="border-b border-[var(--descent-border)] py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--descent-accent)]">
            Diving Cat
          </h1>
          <nav className="flex gap-4">
            <button
              onClick={() => setCurrentView('analyze')}
              className={`px-4 py-2 rounded transition-colors ${
                currentView === 'analyze'
                  ? 'bg-[var(--descent-accent)] text-[var(--descent-deep)]'
                  : 'text-[var(--descent-text-dim)] hover:text-[var(--descent-text)]'
              }`}
            >
              분석
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className={`px-4 py-2 rounded transition-colors ${
                currentView === 'history'
                  ? 'bg-[var(--descent-accent)] text-[var(--descent-deep)]'
                  : 'text-[var(--descent-text-dim)] hover:text-[var(--descent-text)]'
              }`}
            >
              기록
            </button>
          </nav>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="py-8">
        {currentView === 'analyze' ? (
          <AnalyzeView />
        ) : (
          <HistoryView />
        )}
      </main>
    </div>
  );
}

function AnalyzeView() {
  const [step, setStep] = useState<AnalyzeStep>('upload');
  const [discipline, setDiscipline] = useState<DisciplineId>('CWT');
  const [mode, setMode] = useState<AnalysisMode>('overview');
  const [frames, setFrames] = useState<string[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<{ name: string; duration: number } | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [segment, setSegment] = useState<Segment>({ startSec: 0, endSec: 0 });
  const [showLengthWarning, setShowLengthWarning] = useState(false);
  const [savedSession, setSavedSession] = useState<Session | null>(null);

  const handleVideoLoad = useCallback((video: HTMLVideoElement, file: File) => {
    const duration = video.duration;
    setVideoInfo({ name: file.name, duration });
    setSegment({ startSec: 0, endSec: duration });
    setShowLengthWarning(isOverLimit(duration));
    setStep('ready');
  }, []);

  const handleVideoRef = useCallback((video: HTMLVideoElement | null) => {
    setVideoElement(video);
  }, []);

  const handleModeChange = useCallback((newMode: AnalysisMode) => {
    setMode(newMode);
    if (newMode === 'overview' && videoInfo) {
      setSegment({ startSec: 0, endSec: videoInfo.duration });
    }
  }, [videoInfo]);

  const handleStartAnalysis = useCallback(async () => {
    if (!videoElement || !videoInfo) return;

    setStep('extracting');
    setFrames([]);
    setSavedSession(null);

    try {
      // 썸네일 추출
      const thumbnail = await extractThumbnail(videoElement);

      // 모드에 따라 추출 옵션 설정
      const extractOptions = mode === 'segment'
        ? { startSec: segment.startSec, endSec: segment.endSec }
        : undefined;

      const extractedFrames = await extractFrames(videoElement, extractOptions);
      setFrames(extractedFrames);

      // 분석 시작
      setStep('analyzing');

      const analysisResult = await analyzeFrames({
        discipline,
        mode,
        segment: mode === 'segment' ? segment : undefined,
        frames: extractedFrames,
      });

      setResult(analysisResult);

      // 세션 저장
      const session: Session = {
        id: generateId(),
        createdAt: Date.now(),
        discipline,
        mode,
        segment: mode === 'segment' ? segment : undefined,
        videoName: videoInfo.name,
        durationSec: videoInfo.duration,
        frameCount: extractedFrames.length,
        thumbnail,
        result: analysisResult,
      };

      await saveSession(session);
      setSavedSession(session);

      setStep('result');
    } catch (err) {
      console.error('Analysis error:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('알 수 없는 오류가 발생했습니다');
      }
      setStep('error');
    }
  }, [videoElement, videoInfo, discipline, mode, segment]);

  const handleReset = useCallback(() => {
    setStep('upload');
    setMode('overview');
    setFrames([]);
    setResult(null);
    setError(null);
    setVideoInfo(null);
    setVideoElement(null);
    setSegment({ startSec: 0, endSec: 0 });
    setShowLengthWarning(false);
    setSavedSession(null);
  }, []);

  const handleCopyMarkdown = useCallback(() => {
    if (!result || !videoInfo) return;

    const disciplineInfo = getDiscipline(discipline);
    const markdown = generateMarkdown(result, videoInfo.name, disciplineInfo?.label || discipline, mode, segment);
    navigator.clipboard.writeText(markdown).then(() => {
      alert('마크다운이 클립보드에 복사되었습니다!');
    }).catch(() => {
      alert('복사에 실패했습니다. 다시 시도해주세요.');
    });
  }, [result, videoInfo, discipline, mode, segment]);

  const analysisDisabled = step === 'extracting' || step === 'analyzing';
  const segmentDuration = segment.endSec - segment.startSec;
  const disciplineInfo = getDiscipline(discipline);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 종목 선택 */}
      <DisciplineSelect
        value={discipline}
        onChange={setDiscipline}
        disabled={analysisDisabled || step === 'result'}
      />

      {/* 영상 업로드 */}
      <VideoDropzone
        onVideoLoad={handleVideoLoad}
        onVideoRef={handleVideoRef}
        disabled={analysisDisabled}
      />

      {/* 영상 로드 후 옵션들 */}
      {step !== 'upload' && videoInfo && (
        <>
          {/* 모드 선택 */}
          <ModeToggle
            mode={mode}
            onChange={handleModeChange}
            disabled={analysisDisabled}
          />

          {/* 구간 집중 모드일 때 트리머 표시 */}
          {mode === 'segment' && (
            <SegmentTrimmer
              duration={videoInfo.duration}
              segment={segment}
              onChange={setSegment}
              videoRef={videoElement}
              disabled={analysisDisabled}
            />
          )}

          {/* 길이 경고 */}
          {showLengthWarning && mode === 'overview' && (
            <div className="bg-[var(--descent-warning)]/10 border border-[var(--descent-warning)]/30 rounded-lg p-4 text-sm">
              <p className="text-[var(--descent-warning)]">
                영상이 2분을 초과합니다. 구간 집중 모드로 범위를 좁히면 더 정확한 분석이 가능합니다.
              </p>
            </div>
          )}

          {/* 분석 시작 버튼 */}
          {step === 'ready' && (
            <button
              onClick={handleStartAnalysis}
              className="w-full py-4 bg-[var(--descent-accent)] text-[var(--descent-deep)] font-medium rounded-xl hover:bg-[var(--descent-accent-dim)] transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {mode === 'overview'
                ? `${disciplineInfo?.label || discipline} 전체 분석 시작`
                : `${disciplineInfo?.label || discipline} 구간 분석 (${formatTime(segmentDuration)})`
              }
            </button>
          )}
        </>
      )}

      {/* 프레임 추출 중 */}
      {step === 'extracting' && (
        <FrameStrip frames={frames} isExtracting />
      )}

      {/* 분석 중 */}
      {step === 'analyzing' && (
        <>
          <FrameStrip frames={frames} />
          <LoadingState message={`${disciplineInfo?.label || discipline} 폼 분석 중...`} />
        </>
      )}

      {/* 결과 */}
      {step === 'result' && result && (
        <>
          <FrameStrip frames={frames} />

          {/* 분석 정보 표시 */}
          <div className="flex items-center gap-3 text-sm text-[var(--descent-text-dim)]">
            <span className="px-2 py-1 bg-[var(--descent-accent)]/20 text-[var(--descent-accent)] rounded">
              {disciplineInfo?.label || discipline}
            </span>
            <span>
              {mode === 'overview'
                ? '전체 다이브 분석'
                : `구간 분석 (${formatTime(segment.startSec)} - ${formatTime(segment.endSec)})`
              }
            </span>
            {savedSession && (
              <span className="text-[var(--descent-success)]">저장됨</span>
            )}
          </div>

          <ResultCard
            result={result}
            disciplineLabel={disciplineInfo?.label || discipline}
            mode={mode}
            onCopyMarkdown={handleCopyMarkdown}
            onReset={handleReset}
          />
        </>
      )}

      {/* 에러 */}
      {step === 'error' && (
        <div className="text-center py-12">
          <div className="inline-block p-8 rounded-xl bg-red-500/10 border border-red-500/30">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-lg font-medium text-red-400 mb-2">분석 실패</h3>
            <p className="text-[var(--descent-text-dim)] mb-4">{error}</p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-[var(--descent-accent)] text-[var(--descent-deep)] rounded-lg hover:bg-[var(--descent-accent-dim)] transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type HistoryTab = 'list' | 'compare';

function HistoryView() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<HistoryTab>('list');
  const [filterDiscipline, setFilterDiscipline] = useState<DisciplineId | 'all'>('all');

  // 세션 목록 로드
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await getAllSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSession(id);
      setSessions(sessions.filter(s => s.id !== id));
      if (selectedSession?.id === id) {
        setSelectedSession(null);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleCopyMarkdown = useCallback(() => {
    if (!selectedSession) return;

    const disciplineInfo = getDiscipline(selectedSession.discipline);
    const markdown = generateMarkdown(
      selectedSession.result,
      selectedSession.videoName,
      disciplineInfo?.label || selectedSession.discipline,
      selectedSession.mode,
      selectedSession.segment || { startSec: 0, endSec: selectedSession.durationSec }
    );
    navigator.clipboard.writeText(markdown).then(() => {
      alert('마크다운이 클립보드에 복사되었습니다!');
    }).catch(() => {
      alert('복사에 실패했습니다. 다시 시도해주세요.');
    });
  }, [selectedSession]);

  // 필터링된 세션
  const filteredSessions = useMemo(() => {
    if (filterDiscipline === 'all') return sessions;
    return sessions.filter(s => s.discipline === filterDiscipline);
  }, [sessions, filterDiscipline]);

  // 비교용 세션 (같은 종목, 시간순)
  const comparisonSessions = useMemo(() => {
    if (filterDiscipline === 'all') {
      // 가장 많은 종목 자동 선택
      const counts: Record<string, number> = {};
      sessions.forEach(s => {
        counts[s.discipline] = (counts[s.discipline] || 0) + 1;
      });
      const topDiscipline = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as DisciplineId;
      if (!topDiscipline) return [];
      return sessions.filter(s => s.discipline === topDiscipline).reverse();
    }
    return filteredSessions.slice().reverse(); // 시간순 (오래된 것 먼저)
  }, [sessions, filteredSessions, filterDiscipline]);

  // 종목별 세션 개수
  const disciplineCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sessions.length };
    sessions.forEach(s => {
      counts[s.discipline] = (counts[s.discipline] || 0) + 1;
    });
    return counts;
  }, [sessions]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-8 h-8 border-2 border-[var(--descent-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[var(--descent-text-dim)] mt-4">기록 불러오는 중...</p>
      </div>
    );
  }

  if (selectedSession) {
    return (
      <div className="max-w-2xl mx-auto">
        <SessionDetail
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onCopyMarkdown={handleCopyMarkdown}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-[var(--descent-text)]">
          분석 기록
        </h2>
        {sessions.length > 0 && (
          <span className="text-sm text-[var(--descent-text-dim)]">
            {sessions.length}개의 기록
          </span>
        )}
      </div>

      {sessions.length > 0 && (
        <>
          {/* 탭 */}
          <div className="flex gap-2">
            <button
              onClick={() => setTab('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'list'
                  ? 'bg-[var(--descent-accent)] text-[var(--descent-deep)]'
                  : 'text-[var(--descent-text-dim)] hover:text-[var(--descent-text)]'
              }`}
            >
              목록
            </button>
            <button
              onClick={() => setTab('compare')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'compare'
                  ? 'bg-[var(--descent-accent)] text-[var(--descent-deep)]'
                  : 'text-[var(--descent-text-dim)] hover:text-[var(--descent-text)]'
              }`}
            >
              추이 비교
            </button>
          </div>

          {/* 종목 필터 */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterDiscipline('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterDiscipline === 'all'
                  ? 'bg-[var(--descent-accent)]/20 text-[var(--descent-accent)] border border-[var(--descent-accent)]'
                  : 'text-[var(--descent-text-dim)] border border-[var(--descent-border)] hover:border-[var(--descent-accent-dim)]'
              }`}
            >
              전체 ({disciplineCounts.all})
            </button>
            {(['CWT', 'CNF', 'FIM'] as DisciplineId[]).map((d) => {
              const count = disciplineCounts[d] || 0;
              if (count === 0) return null;
              const info = getDiscipline(d);
              return (
                <button
                  key={d}
                  onClick={() => setFilterDiscipline(d)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filterDiscipline === d
                      ? 'bg-[var(--descent-accent)]/20 text-[var(--descent-accent)] border border-[var(--descent-accent)]'
                      : 'text-[var(--descent-text-dim)] border border-[var(--descent-border)] hover:border-[var(--descent-accent-dim)]'
                  }`}
                >
                  {info?.label || d} ({count})
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* 컨텐츠 */}
      {tab === 'list' ? (
        <SessionList
          sessions={filteredSessions}
          onSelect={setSelectedSession}
          onDelete={handleDelete}
        />
      ) : (
        <ComparisonChart sessions={comparisonSessions} />
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function generateMarkdown(
  result: AnalysisResult,
  videoName: string,
  disciplineLabel: string,
  mode: AnalysisMode,
  segment: Segment
): string {
  const date = new Date().toLocaleDateString('ko-KR');

  let md = `# 프리다이빙 폼 분석 결과\n\n`;
  md += `> ${result.hook}\n\n`;
  md += `**날짜:** ${date}  \n`;
  md += `**영상:** ${videoName}  \n`;
  md += `**종목:** ${disciplineLabel}  \n`;

  if (mode === 'segment') {
    md += `**분석 구간:** ${formatTime(segment.startSec)} - ${formatTime(segment.endSec)}\n\n`;
  } else {
    md += `**분석 모드:** 전체 다이브\n\n`;
  }

  md += `## 총평\n\n${result.overall}\n\n`;
  md += `## 항목별 평가\n\n`;

  for (const cat of result.categories) {
    md += `### ${cat.name} (${cat.score}/5)\n\n`;
    md += `**관찰:** ${cat.note}\n\n`;
    md += `**개선 팁:** ${cat.tip}\n\n`;
  }

  md += `---\n\n`;
  md += `*Diving Cat - 프리다이빙 폼 코치로 분석됨*\n`;

  return md;
}

export default App;
