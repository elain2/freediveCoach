import type { AnalysisResult, AnalysisMode, DisciplineId, DivePlan } from './types';

async function parseJsonResponse<T>(res: Response, fallbackError: string): Promise<T> {
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data?.error || fallbackError);
    return data as T;
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error(fallbackError);
    }
    throw e;
  }
}

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
  return parseJsonResponse<AnalysisResult>(res, '분석 요청에 실패했어요. 잠시 후 다시 시도해 주세요.');
}

export async function parsePlan(text: string): Promise<DivePlan> {
  const res = await fetch('/api/parse-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return parseJsonResponse<DivePlan>(res, '플랜을 이해하지 못했어요. 잠시 후 다시 시도해 주세요.');
}
