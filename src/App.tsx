import { useState } from 'react';
import AnalyzeView from './components/AnalyzeView';
import PlanView from './components/PlanView';
import HistoryView from './components/HistoryView';

type Tab = 'analyze' | 'plan' | 'history';

const TABS: { id: Tab; label: string }[] = [
  { id: 'analyze', label: '폼 분석' },
  { id: 'plan', label: '다이브 플랜' },
  { id: 'history', label: '기록' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('analyze');

  return (
    <div className="mx-auto max-w-[760px] px-5 pb-20">
      <header className="pt-14 pb-7">
        <div className="mono mb-5 flex items-center gap-2.5 text-[11px] uppercase tracking-[0.32em] text-aqua">
          <span className="inline-block h-px w-6 bg-aqua opacity-60" />
          AIDA · Freedive Coach
        </div>
        <h1 className="text-[clamp(40px,9vw,68px)] font-extrabold leading-[0.98] tracking-tight">Descent</h1>
        <p className="mt-3.5 max-w-[44ch] text-[15px] text-muted">
          다이빙 영상 한 편으로 폼을 짚고, 플랜을 뎁스 프로파일로 그립니다.
        </p>
      </header>

      <nav className="mb-8 flex gap-1 border-b border-[var(--line)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative px-4 py-3 text-[14px] font-semibold transition-colors ${
              tab === t.id ? 'text-aqua' : 'text-muted hover:text-ink'
            }`}
          >
            {t.label}
            {tab === t.id && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded bg-aqua" />}
          </button>
        ))}
      </nav>

      {tab === 'analyze' && <AnalyzeView />}
      {tab === 'plan' && <PlanView />}
      {tab === 'history' && <HistoryView />}
    </div>
  );
}
