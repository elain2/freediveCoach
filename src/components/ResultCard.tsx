import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import type { AnalysisResult } from '../../shared/types';

interface ResultCardProps {
  result: AnalysisResult;
  disciplineLabel?: string;
  mode?: string;
  onCopyMarkdown: () => void;
  onReset: () => void;
}

export function ResultCard({ result, disciplineLabel, mode, onCopyMarkdown, onReset }: ResultCardProps) {
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleExportPNG = async () => {
    if (!exportRef.current || exporting) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#0a1628',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      const filename = `descent-${disciplineLabel || 'analysis'}-${Date.now()}.png`;
      link.download = filename.replace(/\s+/g, '-').toLowerCase();
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('이미지 저장에 실패했습니다.');
    } finally {
      setExporting(false);
    }
  };

  const avgScore = result.categories.reduce((sum, c) => sum + c.score, 0) / result.categories.length;
  const dateStr = new Date().toLocaleDateString('ko-KR');

  return (
    <div className="w-full space-y-6">
      {/* 총평 */}
      <div className="bg-[var(--descent-card)] border border-[var(--descent-border)] rounded-xl p-6">
        <h3 className="text-lg font-medium text-[var(--descent-accent)] mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          총평
        </h3>
        <p className="text-[var(--descent-text)] leading-relaxed">
          {result.overall}
        </p>
      </div>

      {/* 항목별 평가 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-[var(--descent-text)] flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--descent-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          항목별 평가
        </h3>

        {result.categories.map((category, index) => (
          <CategoryCard key={index} category={category} />
        ))}
      </div>

      {/* 후킹 카피 */}
      <div className="bg-gradient-to-r from-[var(--descent-accent)]/20 to-transparent border border-[var(--descent-accent)]/30 rounded-xl p-6">
        <h3 className="text-sm font-medium text-[var(--descent-accent)] mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          콘텐츠용 후킹 카피
        </h3>
        <p className="text-[var(--descent-text)] italic">
          "{result.hook}"
        </p>
      </div>

      {/* 내보내기 섹션 */}
      <div className="border border-[var(--descent-border)] rounded-xl overflow-hidden">
        <button
          onClick={() => setShowExport(!showExport)}
          className="w-full py-3 px-4 bg-[var(--descent-card)] text-[var(--descent-text)] flex items-center justify-between hover:bg-[var(--descent-surface)] transition-colors"
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--descent-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            이미지로 내보내기
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${showExport ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showExport && (
          <div className="p-4 space-y-4 border-t border-[var(--descent-border)]">
            {/* 내보내기용 카드 미리보기 */}
            <div
              ref={exportRef}
              className="p-6 rounded-2xl"
              style={{
                background: 'linear-gradient(180deg, #0a1628 0%, #0f2847 100%)',
                color: '#e8f4f8',
              }}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#2a4a6a]">
                <div>
                  <h2 className="text-xl font-bold text-[#00d4ff]">Descent</h2>
                  <p className="text-xs text-[#8ba4b4] mt-1">프리다이빙 폼 코치</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-[#00d4ff]/20 text-[#00d4ff] rounded-full text-sm">
                    {disciplineLabel || '분석 결과'}
                  </span>
                </div>
              </div>

              {/* 메타 정보 */}
              <div className="flex items-center gap-4 text-xs text-[#8ba4b4] mb-4">
                <span>{dateStr}</span>
                <span>•</span>
                <span>{mode === 'segment' ? '구간 분석' : '전체 분석'}</span>
              </div>

              {/* 총평 */}
              <div className="mb-6 p-4 bg-[#1a3a5c]/50 rounded-xl">
                <p className="text-sm leading-relaxed">{result.overall}</p>
              </div>

              {/* 점수 그리드 */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {result.categories.map((cat, i) => (
                  <div key={i} className="p-3 bg-[#0f2847] rounded-lg border border-[#2a4a6a]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[#8ba4b4]">{cat.name}</span>
                      <span className={`text-lg font-bold ${getExportScoreColor(cat.score)}`}>
                        {cat.score.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#2a4a6a] rounded-full overflow-hidden">
                      <div
                        className={getExportScoreBarColor(cat.score)}
                        style={{ width: `${((cat.score - 1) / 4) * 100}%`, height: '100%', borderRadius: '9999px' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* 평균 점수 */}
              <div className="flex items-center justify-center gap-3 py-4 border-t border-[#2a4a6a]">
                <span className="text-[#8ba4b4]">평균</span>
                <span className={`text-3xl font-bold ${getExportScoreColor(avgScore)}`}>
                  {avgScore.toFixed(1)}
                </span>
                <span className="text-[#8ba4b4]">/ 5</span>
              </div>

              {/* 후킹 카피 */}
              <div className="mt-4 pt-4 border-t border-[#2a4a6a] text-center">
                <p className="text-sm text-[#00d4ff] italic">"{result.hook}"</p>
              </div>
            </div>

            {/* 저장 버튼 */}
            <button
              onClick={handleExportPNG}
              disabled={exporting}
              className="w-full py-3 px-4 bg-[var(--descent-accent)] text-[var(--descent-deep)] font-medium rounded-lg hover:bg-[var(--descent-accent-dim)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  PNG로 저장
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 기본 액션 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={onCopyMarkdown}
          className="flex-1 py-3 px-4 bg-[var(--descent-accent)] text-[var(--descent-deep)] font-medium rounded-lg hover:bg-[var(--descent-accent-dim)] transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          마크다운 복사
        </button>
        <button
          onClick={onReset}
          className="py-3 px-4 border border-[var(--descent-border)] text-[var(--descent-text-dim)] rounded-lg hover:border-[var(--descent-accent-dim)] hover:text-[var(--descent-text)] transition-colors"
        >
          새 분석
        </button>
      </div>
    </div>
  );
}

interface CategoryCardProps {
  category: {
    name: string;
    score: number;
    note: string;
    tip: string;
  };
}

function CategoryCard({ category }: CategoryCardProps) {
  const scoreColor = getScoreColor(category.score);
  const scorePercent = ((category.score - 1) / 4) * 100;

  return (
    <div className="bg-[var(--descent-card)] border border-[var(--descent-border)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-[var(--descent-text)]">{category.name}</h4>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${scoreColor}`}>
            {category.score.toFixed(1)}
          </span>
          <span className="text-sm text-[var(--descent-text-dim)]">/ 5</span>
        </div>
      </div>

      {/* 점수 바 */}
      <div className="h-2 bg-[var(--descent-border)] rounded-full mb-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(category.score)}`}
          style={{ width: `${scorePercent}%` }}
        />
      </div>

      {/* 관찰 */}
      <div className="mb-3">
        <span className="text-xs text-[var(--descent-text-dim)] uppercase tracking-wide">관찰</span>
        <p className="text-sm text-[var(--descent-text)] mt-1">{category.note}</p>
      </div>

      {/* 개선 팁 */}
      <div className="bg-[var(--descent-surface)]/50 rounded-lg p-3">
        <span className="text-xs text-[var(--descent-accent)] uppercase tracking-wide flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          개선 팁
        </span>
        <p className="text-sm text-[var(--descent-text)] mt-1">{category.tip}</p>
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 4) return 'text-[var(--descent-success)]';
  if (score >= 3) return 'text-[var(--descent-accent)]';
  if (score >= 2) return 'text-[var(--descent-warning)]';
  return 'text-red-400';
}

function getScoreBarColor(score: number): string {
  if (score >= 4) return 'bg-[var(--descent-success)]';
  if (score >= 3) return 'bg-[var(--descent-accent)]';
  if (score >= 2) return 'bg-[var(--descent-warning)]';
  return 'bg-red-400';
}

// 내보내기용 (인라인 스타일 필요)
function getExportScoreColor(score: number): string {
  if (score >= 4) return 'text-[#00cc88]';
  if (score >= 3) return 'text-[#00d4ff]';
  if (score >= 2) return 'text-[#ff6b35]';
  return 'text-[#ff4444]';
}

function getExportScoreBarColor(score: number): string {
  if (score >= 4) return 'background-color: #00cc88';
  if (score >= 3) return 'background-color: #00d4ff';
  if (score >= 2) return 'background-color: #ff6b35';
  return 'background-color: #ff4444';
}
