import { useState } from 'react';
import type { TableMode, BreathTable } from '../lib/types';
import { generateTable } from '../lib/breathTable';
import { useTimer } from '../lib/useTimer';
import TableConfig from './breath/TableConfig';
import TableDisplay from './breath/TableDisplay';
import TableTimer from './breath/TableTimer';

export default function BreathView() {
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
        CO₂/O₂ 테이블로 숨참기 내성을 키우세요. PB를 입력하면 8라운드 훈련 테이블이 생성됩니다.
      </p>

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
    </div>
  );
}
