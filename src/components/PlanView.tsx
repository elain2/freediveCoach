import { useState } from 'react';
import type { DivePlan, DiveProfile } from '../lib/types';
import { buildProfile } from '../lib/diveProfile';
import { parsePlan } from '../lib/api';
import DiveProfileChart from './DiveProfileChart';

const DEFAULT_PLAN: DivePlan = {
  discipline: 'CWT',
  targetDepth: 40,
  descentSpeed: 1.0,
  freefallStartDepth: 25,
  freefallSpeed: 1.3,
  ascentSpeed: 1.0,
  bottomTimeSec: 3,
  mouthfillDepth: 30,
  safetyMeetDepth: 30,
};

type Field = { key: keyof DivePlan; label: string; step?: number };
const FIELDS: Field[] = [
  { key: 'targetDepth', label: '목표 수심 (m)' },
  { key: 'descentSpeed', label: '하강 속도 (m/s)', step: 0.1 },
  { key: 'ascentSpeed', label: '상승 속도 (m/s)', step: 0.1 },
  { key: 'freefallStartDepth', label: '프리폴 시작 (m)' },
  { key: 'freefallSpeed', label: '프리폴 속도 (m/s)', step: 0.1 },
  { key: 'mouthfillDepth', label: '마우스필 (m)' },
  { key: 'safetyMeetDepth', label: '세이프티 미팅 (m)' },
  { key: 'bottomTimeSec', label: '턴 체류 (s)' },
];

export default function PlanView() {
  const [inputMode, setInputMode] = useState<'param' | 'nl'>('param');
  const [plan, setPlan] = useState<DivePlan>(DEFAULT_PLAN);
  const [nl, setNl] = useState('CWT 40미터, 하강 1m/s, -25에서 프리폴, 마우스필 -30, 세이프티 -30 미팅');
  const [profile, setProfile] = useState<DiveProfile>(() => buildProfile(DEFAULT_PLAN));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const renderParam = () => {
    setError('');
    setProfile(buildProfile(plan));
  };

  const renderNl = async () => {
    setBusy(true);
    setError('');
    try {
      const parsed = await parsePlan(nl);
      setPlan(parsed);
      setProfile(buildProfile(parsed));
    } catch (e) {
      setError(e instanceof Error ? e.message : '플랜을 이해하지 못했어요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="mb-6 max-w-[48ch] text-[15px] text-muted">
        다이브 플랜을 수심-시간 프로파일로 그립니다. 파라미터로 직접 넣거나, 문장으로 말해도 돼요.
        도식은 그대로 PNG/캡처해서 브리핑·콘텐츠로 쓰면 됩니다.
      </p>

      <div className="mb-4 flex gap-2">
        {(['param', 'nl'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setInputMode(m)}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition-colors ${
              inputMode === m ? 'border-aqua text-aqua' : 'border-[var(--line)] text-muted hover:border-aqua'
            }`}
          >
            {m === 'param' ? '파라미터 입력' : '자연어 입력'}
          </button>
        ))}
      </div>

      {inputMode === 'param' ? (
        <div className="rounded-2xl border border-[var(--line)] bg-card/40 p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FIELDS.map((f) => (
              <label key={f.key} className="mono text-[11px] text-muted">
                <span className="mb-1 block">{f.label}</span>
                <input
                  type="number"
                  step={f.step ?? 1}
                  value={(plan[f.key] as number | undefined) ?? ''}
                  onChange={(e) =>
                    setPlan((p) => ({ ...p, [f.key]: e.target.value === '' ? undefined : Number(e.target.value) }))
                  }
                  className="w-full rounded bg-deep px-2.5 py-2 text-[14px] text-ink"
                />
              </label>
            ))}
          </div>
          <button
            onClick={renderParam}
            className="mt-4 w-full rounded-xl bg-aqua py-3.5 text-[14px] font-bold text-[#04222a] transition-transform hover:-translate-y-px"
          >
            프로파일 그리기
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--line)] bg-card/40 p-5">
          <textarea
            value={nl}
            onChange={(e) => setNl(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl bg-deep px-3.5 py-3 text-[14px] text-ink outline-none"
            placeholder="예: CWT 40미터, 하강 1m/s, -25에서 프리폴, 마우스필 -30, 세이프티 -30 미팅"
          />
          <button
            onClick={renderNl}
            disabled={busy}
            className="mt-3 w-full rounded-xl bg-aqua py-3.5 text-[14px] font-bold text-[#04222a] transition-transform hover:-translate-y-px disabled:opacity-45"
          >
            {busy ? '읽는 중…' : '문장으로 프로파일 만들기'}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-coral/35 bg-coral/10 p-4 text-[14px] text-[#ffd7c9]">{error}</div>
      )}

      <div className="mt-6 rounded-2xl border border-[var(--line)] bg-deep/40 p-2">
        <DiveProfileChart profile={profile} />
      </div>
    </div>
  );
}
