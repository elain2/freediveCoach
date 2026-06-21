import { useState } from 'react';
import AnalyzeView from './components/AnalyzeView';
import PlanView from './components/PlanView';
import BreathView from './components/BreathView';
import HistoryView from './components/HistoryView';
import AdBanner from './components/AdBanner';

const ADFIT_UNIT_ID = 'DAN-FSn400opi3lj0gM9';

type Tab = 'analyze' | 'plan' | 'breath' | 'history';

const TABS: { id: Tab; label: string }[] = [
  { id: 'analyze', label: '폼 분석' },
  { id: 'plan', label: '다이브 플랜' },
  { id: 'breath', label: '호흡 훈련' },
  { id: 'history', label: '기록' },
];

function DivingCatLogo() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="drop-shadow-lg">
      {/* 머리 */}
      <ellipse cx="36" cy="40" rx="22" ry="20" fill="#ffecd2" />
      {/* 왼쪽 귀 */}
      <path d="M18 28 L14 14 L26 22 Z" fill="#ffecd2" />
      <path d="M19 26 L17 18 L24 23 Z" fill="#ffcba4" />
      {/* 오른쪽 귀 */}
      <path d="M54 28 L58 14 L46 22 Z" fill="#ffecd2" />
      <path d="M53 26 L55 18 L48 23 Z" fill="#ffcba4" />
      {/* 새싹 */}
      <g className="sprout">
        <path d="M36 14 Q32 8 36 4 Q40 8 36 14" fill="#a8d86e" />
        <path d="M36 14 Q40 10 44 6 Q40 12 36 14" fill="#8bc34a" />
        <line x1="36" y1="14" x2="36" y2="20" stroke="#7cb342" strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* 마스크 */}
      <path
        d="M16 38 Q16 28 36 28 Q56 28 56 38 Q56 48 36 50 Q16 48 16 38"
        fill="rgba(125, 212, 200, 0.3)"
        stroke="#7dd4c8"
        strokeWidth="3"
      />
      {/* 마스크 빛 반사 */}
      <path d="M22 34 Q26 32 30 34" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
      {/* 눈 */}
      <ellipse cx="28" cy="40" rx="3" ry="4" fill="#4a3728" />
      <ellipse cx="44" cy="40" rx="3" ry="4" fill="#4a3728" />
      <circle cx="29" cy="39" r="1" fill="white" />
      <circle cx="45" cy="39" r="1" fill="white" />
      {/* 코 */}
      <ellipse cx="36" cy="48" rx="3" ry="2" fill="#ffb199" />
      {/* 볼터치 */}
      <ellipse cx="22" cy="46" rx="4" ry="2" fill="#ffcba4" opacity="0.6" />
      <ellipse cx="50" cy="46" rx="4" ry="2" fill="#ffcba4" opacity="0.6" />
      {/* 수염 */}
      <g stroke="#c4a574" strokeWidth="1" strokeLinecap="round" opacity="0.6">
        <line x1="10" y1="42" x2="18" y2="44" />
        <line x1="10" y1="46" x2="18" y2="46" />
        <line x1="54" y1="44" x2="62" y2="42" />
        <line x1="54" y1="46" x2="62" y2="46" />
      </g>
    </svg>
  );
}

function Bubbles() {
  const bubbles = [
    { size: 8, left: '10%', delay: 0, duration: 12 },
    { size: 5, left: '20%', delay: 2, duration: 10 },
    { size: 6, left: '35%', delay: 4, duration: 14 },
    { size: 4, left: '50%', delay: 1, duration: 11 },
    { size: 7, left: '65%', delay: 3, duration: 13 },
    { size: 5, left: '80%', delay: 5, duration: 10 },
    { size: 6, left: '90%', delay: 2, duration: 12 },
  ];

  return (
    <div className="bubbles">
      {bubbles.map((b, i) => (
        <span
          key={i}
          style={{
            width: b.size,
            height: b.size,
            left: b.left,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>('analyze');

  return (
    <>
      <Bubbles />
      <div className="relative z-10 mx-auto max-w-[760px] px-5 pb-20">
        <header className="pt-10 pb-7">
          <div className="mb-4 flex items-end gap-4">
            <DivingCatLogo />
            <div>
              <div className="mono mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-aqua">
                <span className="inline-block h-px w-4 bg-aqua opacity-60" />
                Freedive Coach
              </div>
              <h1 className="text-[clamp(32px,8vw,52px)] font-extrabold leading-[1] tracking-tight">Diving Cat</h1>
            </div>
          </div>
          <p className="mt-3 max-w-[44ch] text-[15px] text-muted">
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
        {tab === 'breath' && <BreathView />}
        {tab === 'history' && <HistoryView />}

        {ADFIT_UNIT_ID && (
          <div className="mt-12">
            <AdBanner unitId={ADFIT_UNIT_ID} width={300} height={250} />
          </div>
        )}

        <footer className="mt-16 border-t border-[var(--line)] pt-6 text-center text-[13px] text-muted">
          문의는 인스타 <a href="https://instagram.com/free.young.510" target="_blank" rel="noopener noreferrer" className="text-aqua hover:underline">@free.young.510</a>으로
        </footer>
      </div>
    </>
  );
}
