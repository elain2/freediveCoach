import { useState, useEffect } from 'react';
import AnalyzeView from './components/AnalyzeView';
import DiveSimulation from './components/breath/DiveSimulation';
import BreathView from './components/BreathView';
import HistoryView from './components/HistoryView';
import AdBanner from './components/AdBanner';
import AudioSettingsPanel from './components/AudioSettingsPanel';
import { useAudioSettings } from './lib/useAudioSettings';
import { updateAudioSettings } from './lib/audio';

const ADFIT_UNIT_ID = 'DAN-FSn400opi3lj0gM9';

type Tab = 'analyze' | 'simulation' | 'breath' | 'history';

const TABS: { id: Tab; label: string }[] = [
  { id: 'analyze', label: '폼 분석' },
  { id: 'simulation', label: '다이빙 시뮬레이터' },
  { id: 'breath', label: '호흡 훈련' },
  { id: 'history', label: '기록' },
];

function DivingCatLogo() {
  return (
    <img
      src="/diving-cat.png"
      alt="Diving Cat"
      width={72}
      height={72}
      className="rounded-full drop-shadow-lg"
    />
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
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const {
    settings: audioSettings,
    toggleMute,
    setVolume,
    toggleCountdown,
    togglePhase,
    toggleComplete,
  } = useAudioSettings();

  // 오디오 설정 동기화
  useEffect(() => {
    updateAudioSettings(audioSettings);
  }, [audioSettings]);

  return (
    <>
      {showAudioSettings && (
        <AudioSettingsPanel
          settings={audioSettings}
          onToggleMute={toggleMute}
          onVolumeChange={setVolume}
          onToggleCountdown={toggleCountdown}
          onTogglePhase={togglePhase}
          onToggleComplete={toggleComplete}
          onClose={() => setShowAudioSettings(false)}
        />
      )}
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
            딥다이버가 되기 위한 첫걸음!
          </p>
        </header>

        <nav className="mb-8 flex items-center gap-1 border-b border-[var(--line)]">
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
          <div className="flex-1" />
          <button
            onClick={() => setShowAudioSettings(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-deep hover:text-ink"
            aria-label="알림 설정"
          >
            {audioSettings.muted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
        </nav>

        {/* 상단 광고 - 항상 보이는 위치 */}
        {ADFIT_UNIT_ID && (
          <div className="mb-8">
            <AdBanner unitId={ADFIT_UNIT_ID} width={320} height={100} />
          </div>
        )}

        {tab === 'analyze' && <AnalyzeView />}
        {tab === 'simulation' && <DiveSimulation />}
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
