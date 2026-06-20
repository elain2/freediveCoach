import { useEffect, useState } from 'react';
import type { Session } from '../lib/types';
import { listSessions, deleteSession } from '../lib/storage';
import ResultCard from './ResultCard';

export default function HistoryView() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [open, setOpen] = useState<Session | null>(null);

  const refresh = () => listSessions().then(setSessions);
  useEffect(() => {
    refresh();
  }, []);

  const avg = (s: Session) =>
    s.result.categories.reduce((a, c) => a + c.score, 0) / Math.max(1, s.result.categories.length);

  if (open) {
    return (
      <div>
        <button onClick={() => setOpen(null)} className="mb-2 text-[13px] text-aqua">
          ← 목록으로
        </button>
        <div className="mono text-[12px] text-muted">
          {new Date(open.createdAt).toLocaleString('ko-KR')} · {open.discipline} ·{' '}
          {open.mode === 'segment' ? '구간 집중' : '전체 개요'} · {open.frameCount}프레임
        </div>
        <ResultCard result={open.result} />
      </div>
    );
  }

  return (
    <div>
      <p className="mb-6 text-[15px] text-muted">저장된 분석 회차예요. 같은 종목으로 쌓이면 변화가 보입니다.</p>
      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] p-10 text-center text-[14px] text-muted">
          아직 기록이 없어요. 분석을 한 번 돌리면 여기에 쌓입니다.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-card/40 p-3 transition-colors hover:border-aqua"
            >
              {s.thumbnail && (
                <img src={`data:image/jpeg;base64,${s.thumbnail}`} className="h-12 w-16 flex-none rounded object-cover" />
              )}
              <button className="flex-1 text-left" onClick={() => setOpen(s)}>
                <div className="text-[14px] font-semibold">{s.videoName}</div>
                <div className="mono text-[11px] text-muted">
                  {new Date(s.createdAt).toLocaleDateString('ko-KR')} · {s.discipline} · 평균 {avg(s).toFixed(1)}
                </div>
              </button>
              <button
                onClick={async () => {
                  await deleteSession(s.id);
                  refresh();
                }}
                className="mono px-2 text-[12px] text-muted hover:text-coral"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
