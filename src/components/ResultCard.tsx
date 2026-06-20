import { useState } from 'react';
import type { AnalysisResult } from '../lib/types';

function scoreColor(s: number): string {
  if (s >= 4) return '#4fe0cc';
  if (s >= 3) return '#ffce6b';
  return '#ff8d6b';
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

  return (
    <div className="rope relative mt-8 pl-10">
      <div className="absolute left-[7px] top-[26px] h-3 w-3 rounded-full border-2 border-aqua bg-abyss" style={{ display: 'none' }} />
      <div className="rounded-2xl border border-[var(--line)] bg-card p-6">
        <div className="mono mb-2 text-[10px] uppercase tracking-[0.28em] text-aqua">총평 · Overall</div>
        <p className="text-[15.5px] leading-relaxed">{result.overall}</p>
      </div>

      {result.categories.map((c, i) => (
        <div key={i} className="relative py-5">
          <span
            className="absolute -left-[35px] top-[26px] h-3 w-3 rounded-full border-2 bg-abyss"
            style={{ borderColor: scoreColor(c.score) }}
          />
          <div className="mono mb-2 text-[10px] uppercase tracking-[0.2em] text-muted">
            Stop {String(i + 1).padStart(2, '0')}
          </div>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h3 className="text-[19px] font-bold">{c.name}</h3>
            <span className="mono whitespace-nowrap text-[15px] font-semibold" style={{ color: scoreColor(c.score) }}>
              {c.score.toFixed(1)} <span className="text-xs font-normal text-muted">/ 5.0</span>
            </span>
          </div>
          <div className="mb-3.5 h-[5px] overflow-hidden rounded bg-white/[0.07]">
            <div className="fill h-full rounded" style={{ width: `${(c.score / 5) * 100}%`, background: scoreColor(c.score) }} />
          </div>
          <div className="mb-2 text-[14.5px]">{c.note}</div>
          <div className="border-l-2 border-aqua-dim pl-3.5 text-[14px] text-muted">
            <b className="font-semibold text-aqua">다음엔</b> {c.tip}
          </div>
        </div>
      ))}

      {result.hook && (
        <div className="mt-6 rounded-2xl border border-aqua/20 p-5" style={{ background: 'linear-gradient(120deg, rgba(79,224,204,.1), rgba(79,224,204,.02))' }}>
          <div className="mono mb-2 text-[10px] uppercase tracking-[0.24em] text-aqua">콘텐츠 후킹</div>
          <div className="text-[17px] font-semibold leading-snug">{result.hook}</div>
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
    </div>
  );
}
