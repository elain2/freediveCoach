import { useState } from 'react';
import type { TableMode, BreathTable } from '../lib/types';
import { generateTable } from '../lib/breathTable';
import { useTimer } from '../lib/useTimer';
import TableConfig from './breath/TableConfig';
import TableDisplay from './breath/TableDisplay';
import TableTimer from './breath/TableTimer';
import DiveSimulation from './breath/DiveSimulation';

type SubTab = 'table' | 'simulation';

export default function BreathView() {
  const [subTab, setSubTab] = useState<SubTab>('table');

  // 테이블 상태
  const [mode, setMode] = useState<TableMode>('co2');
  const [pbSec, setPbSec] = useState(180); // 3분 기본값
  const [table, setTable] = useState<BreathTable | null>(null);

  const timer = useTimer({
    rounds: table?.rounds ?? [],
  });

  const handleGenerate = () => {
    timer.reset();
    setTable(generateTable(mode, pbSec));
  };

  return (
    <div>
      <p className="mb-6 max-w-[48ch] text-[15px] text-muted">
        CO₂/O₂ 테이블로 숨참기 훈련을 하거나, 다이브 시뮬레이션으로 타이밍을 연습하세요.
      </p>

      {/* 서브 탭 */}
      <div className="mb-6 flex gap-2">
        {(['table', 'simulation'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition-colors ${
              subTab === t ? 'border-aqua text-aqua' : 'border-[var(--line)] text-muted hover:border-aqua'
            }`}
          >
            {t === 'table' ? 'CO₂/O₂ 테이블' : '다이브 시뮬레이션'}
          </button>
        ))}
      </div>

      {subTab === 'table' ? (
        <div className="space-y-4">
          <TableConfig
            mode={mode}
            onModeChange={(m) => {
              setMode(m);
              setTable(null);
              timer.reset();
            }}
            pbSec={pbSec}
            onPbChange={setPbSec}
            onGenerate={handleGenerate}
          />

          {table && (
            <>
              <TableDisplay table={table} currentRound={timer.currentRound} phase={timer.phase} />
              <TableTimer
                phase={timer.phase}
                currentRound={timer.currentRound}
                totalRounds={table.rounds.length}
                remainingSec={timer.remainingSec}
                progress={timer.progress}
                isRunning={timer.isRunning}
                onStart={timer.start}
                onPause={timer.pause}
                onReset={timer.reset}
              />
            </>
          )}
        </div>
      ) : (
        <DiveSimulation />
      )}
    </div>
  );
}
