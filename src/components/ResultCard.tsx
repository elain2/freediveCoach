import { useState } from 'react';
import type { AnalysisResult } from '../lib/types';

function scoreColor(s: number): string {
  if (s >= 4) return '#4fe0cc';
  if (s >= 3) return '#ffce6b';
  return '#ff8d6b';
}

function scoreEmoji(s: number): string {
  if (s >= 4.5) return '✨';
  if (s >= 4) return '😺';
  if (s >= 3) return '🐱';
  return '😿';
}

export default function ResultCard({ result }: { result: AnalysisResult }) {
  const [copied, setCopied] = useState(false);

  const copyMarkdown = () => {
    let md = `## 다이빙 폼 체크\n\n${result.overall}\n\n`;
    for (const c of result.categories) {
      md += `**${c.name} — ${c.score.toFixed(1)}/5.0**\n${c.note}\n> 다음엔: ${c.tip}\n\n`;
    }
    if (result.hook) md += `_${result.hook}_\n`;
    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  const avgScore = result.categories.length > 0
    ? result.categories.reduce((sum, c) => sum + c.score, 0) / result.categories.length
    : 0;

  return (
    <div className="mt-8">
      {/* 고양이 코치 헤더 */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative">
          <img
            src="/coach-cat.png"
            alt="Agent Cat"
            className="h-20 w-20 rounded-full border-2 border-aqua/50 object-cover shadow-lg shadow-aqua/20"
          />
          <span className="absolute -bottom-1 -right-1 text-lg">🎓</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-aqua">Agent Cat의 분석 리포트</h2>
          <p className="text-sm text-muted">프리다이빙 전문 고양이가 분석했다냥!</p>
        </div>
      </div>

      {/* 총평 - 말풍선 스타일 */}
      <div className="relative mb-6">
        <div className="absolute -left-2 top-4 h-4 w-4 rotate-45 rounded-sm bg-card border-l border-b border-[var(--line)]" />
        <div className="rounded-2xl border border-[var(--line)] bg-card p-6 pl-8">
          <div className="mono mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-aqua">
            <span>총평</span>
            <span className="text-base">{scoreEmoji(avgScore)}</span>
          </div>
          <p className="text-[15.5px] leading-relaxed">{result.overall}</p>
        </div>
      </div>

      {/* 카테고리별 분석 */}
      <div className="space-y-4">
        {result.categories.map((c, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--line)] bg-card/50 p-5 transition-all hover:border-aqua/30 hover:bg-card"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-lg"
                  style={{ background: `${scoreColor(c.score)}20` }}>
                  {scoreEmoji(c.score)}
                </span>
                <h3 className="text-[17px] font-bold">{c.name}</h3>
              </div>
              <span className="mono whitespace-nowrap text-[15px] font-semibold" style={{ color: scoreColor(c.score) }}>
                {c.score.toFixed(1)} <span className="text-xs font-normal text-muted">/ 5.0</span>
              </span>
            </div>

            <div className="mb-3 h-[5px] overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(c.score / 5) * 100}%`, background: scoreColor(c.score) }}
              />
            </div>

            <div className="mb-3 rounded-xl bg-white/[0.03] p-3 text-[14.5px]">
              {c.note}
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-aqua/20 bg-aqua/5 p-3">
              <span className="text-sm">💡</span>
              <div className="text-[14px]">
                <span className="font-semibold text-aqua">다음엔</span>{' '}
                <span className="text-muted">{c.tip}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 콘텐츠 후킹 & 액션 */}
      {result.hook && (
        <div className="mt-6 rounded-2xl border border-aqua/20 p-5" style={{ background: 'linear-gradient(120deg, rgba(79,224,204,.1), rgba(79,224,204,.02))' }}>
          <div className="mb-3 flex items-center gap-3">
            <img
              src="/coach-cat.png"
              alt="Agent Cat"
              className="h-10 w-10 rounded-full border border-aqua/30 object-cover"
            />
            <div>
              <div className="mono text-[10px] uppercase tracking-[0.24em] text-aqua">Agent Cat의 한마디</div>
            </div>
          </div>
          <div className="text-[17px] font-semibold leading-snug">"{result.hook}"</div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              onClick={copyMarkdown}
              className="rounded-[10px] border border-[var(--line)] px-4 py-2.5 text-[13px] font-semibold transition-colors hover:border-aqua hover:text-aqua"
            >
              {copied ? '✓ 복사됨' : '📋 블로그용 텍스트 복사'}
            </button>
          </div>
        </div>
      )}

      {/* 푸터 */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
        <img src="/coach-cat.png" alt="" className="h-5 w-5 rounded-full opacity-50" />
        <span>Analyzed by Agent Cat · Powered by AI</span>
      </div>
    </div>
  );
}
