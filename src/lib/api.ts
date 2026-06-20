import type { AnalysisResult, AnalysisMode, DisciplineId, DivePlan } from './types';

export async function analyzeFrames(params: {
  discipline: DisciplineId;
  mode: AnalysisMode;
  segment?: { startSec: number; endSec: number };
  frames: string[];
}): Promise<AnalysisResult> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || '분석 요청에 실패했어요.');
  return data as AnalysisResult;
}

export async function parsePlan(text: string): Promise<DivePlan> {
  const res = await fetch('/api/parse-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || '플랜을 이해하지 못했어요.');
  return data as DivePlan;
}
