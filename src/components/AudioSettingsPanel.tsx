import type { AudioSettings } from '../lib/types';
import { playTestBeep } from '../lib/audio';

interface Props {
  settings: AudioSettings;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onToggleCountdown: () => void;
  onTogglePhase: () => void;
  onToggleComplete: () => void;
  onClose: () => void;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-2">
      <span className="text-[14px]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-aqua' : 'bg-[var(--line)]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

export default function AudioSettingsPanel({
  settings,
  onToggleMute,
  onVolumeChange,
  onToggleCountdown,
  onTogglePhase,
  onToggleComplete,
  onClose,
}: Props) {
  const handleVolumeTest = () => {
    playTestBeep();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-bold">알림 설정</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-deep hover:text-ink"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        <div className="space-y-1">
          {/* 음소거 */}
          <Toggle checked={!settings.muted} onChange={onToggleMute} label="소리 켜기" />

          {/* 볼륨 */}
          <div className="py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[14px]">볼륨</span>
              <span className="mono text-[13px] text-muted">{Math.round(settings.volume * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={settings.volume * 100}
                onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
                disabled={settings.muted}
                className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-deep disabled:opacity-50
                  [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-aqua [&::-webkit-slider-thumb]:shadow"
              />
              <button
                onClick={handleVolumeTest}
                disabled={settings.muted}
                className="rounded-lg bg-deep px-3 py-1.5 text-[12px] font-semibold text-aqua hover:bg-aqua/20 disabled:opacity-50"
              >
                테스트
              </button>
            </div>
          </div>

          <div className="my-3 border-t border-[var(--line)]" />

          <p className="mb-2 text-[12px] text-muted">알림 유형별 설정</p>

          {/* 카운트다운 */}
          <Toggle
            checked={settings.countdownEnabled && !settings.muted}
            onChange={onToggleCountdown}
            label="카운트다운 (3, 2, 1...)"
          />

          {/* 페이즈 전환 */}
          <Toggle
            checked={settings.phaseEnabled && !settings.muted}
            onChange={onTogglePhase}
            label="페이즈 전환 / 마일스톤"
          />

          {/* 완료 */}
          <Toggle
            checked={settings.completeEnabled && !settings.muted}
            onChange={onToggleComplete}
            label="완료"
          />
        </div>
      </div>
    </div>
  );
}
