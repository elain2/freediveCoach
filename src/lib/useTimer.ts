import { useState, useRef, useCallback, useEffect } from 'react';
import type { TimerPhase, TableRound } from './types';
import { playPhaseBeep, playCompleteBeep, playCountdownBeep } from './audio';

interface UseTimerOptions {
  rounds: TableRound[];
  onComplete?: () => void;
}

interface UseTimerReturn {
  phase: TimerPhase;
  currentRound: number;
  remainingSec: number;
  totalElapsedSec: number;
  progress: number; // 0~1
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

export function useTimer({ rounds, onComplete }: UseTimerOptions): UseTimerReturn {
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [currentRound, setCurrentRound] = useState(0);
  const [remainingSec, setRemainingSec] = useState(0);
  const [totalElapsedSec, setTotalElapsedSec] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const lastCountdownRef = useRef<number>(-1);

  const getCurrentPhaseDuration = useCallback(
    (roundIdx: number, currentPhase: 'breathe' | 'hold'): number => {
      if (roundIdx < 0 || roundIdx >= rounds.length) return 0;
      return currentPhase === 'breathe' ? rounds[roundIdx].breatheSec : rounds[roundIdx].holdSec;
    },
    [rounds]
  );

  const tick = useCallback(() => {
    setRemainingSec((prev) => {
      const next = prev - 1;

      // 카운트다운 비프 (3, 2, 1초 남았을 때)
      if (next <= 3 && next > 0 && next !== lastCountdownRef.current) {
        lastCountdownRef.current = next;
        playCountdownBeep();
      }

      if (next <= 0) {
        // 페이즈 전환
        setPhase((currentPhase) => {
          if (currentPhase === 'breathe') {
            playPhaseBeep();
            lastCountdownRef.current = -1;
            setRemainingSec(getCurrentPhaseDuration(currentRound, 'hold'));
            return 'hold';
          } else if (currentPhase === 'hold') {
            const nextRound = currentRound + 1;
            if (nextRound >= rounds.length) {
              playCompleteBeep();
              setIsRunning(false);
              onComplete?.();
              return 'complete';
            }
            playPhaseBeep();
            lastCountdownRef.current = -1;
            setCurrentRound(nextRound);
            setRemainingSec(rounds[nextRound].breatheSec);
            return 'breathe';
          }
          return currentPhase;
        });
        return 0;
      }
      return next;
    });

    setTotalElapsedSec((prev) => prev + 1);
  }, [currentRound, rounds, getCurrentPhaseDuration, onComplete]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(tick, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, tick]);

  const start = useCallback(() => {
    if (phase === 'idle' || phase === 'complete') {
      setCurrentRound(0);
      setPhase('breathe');
      setRemainingSec(rounds[0]?.breatheSec ?? 0);
      setTotalElapsedSec(0);
      lastCountdownRef.current = -1;
    }
    setIsRunning(true);
    playPhaseBeep();
  }, [phase, rounds]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setPhase('idle');
    setCurrentRound(0);
    setRemainingSec(0);
    setTotalElapsedSec(0);
    lastCountdownRef.current = -1;
  }, []);

  const progress =
    phase === 'idle' || phase === 'complete'
      ? 0
      : 1 - remainingSec / getCurrentPhaseDuration(currentRound, phase === 'breathe' ? 'breathe' : 'hold');

  return {
    phase,
    currentRound,
    remainingSec,
    totalElapsedSec,
    progress,
    isRunning,
    start,
    pause,
    reset,
  };
}
