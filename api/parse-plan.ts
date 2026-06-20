import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callClaude, extractJson } from './_lib/anthropic';

interface DivePlan {
  discipline: string;
  targetDepth: number;
  descentSpeed: number;
  freefallStartDepth?: number;
  freefallSpeed?: number;
  ascentSpeed: number;
  bottomTimeSec?: number;
  mouthfillDepth?: number;
  safetyMeetDepth?: number;
}

const VALID = ['CWT', 'CNF', 'FIM', 'DYN', 'STA'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { text } = req.body as { text?: string };
    if (!text || !text.trim()) {
      res.status(400).json({ error: '플랜 문장을 입력해 주세요.' });
      return;
    }

    const prompt = `다음 문장은 프리다이빙 다이브 플랜이다. 아래 JSON 스키마로 구조화하라.

문장: """${text.trim()}"""

스키마(모르는 값은 생략):
{
  "discipline": "CWT|CNF|FIM|DYN|STA",
  "targetDepth": 숫자(미터, 양수),
  "descentSpeed": 숫자(m/s, 능동 하강),
  "freefallStartDepth": 숫자(미터, 프리폴 시작 수심),
  "freefallSpeed": 숫자(m/s),
  "ascentSpeed": 숫자(m/s),
  "bottomTimeSec": 숫자(초),
  "mouthfillDepth": 숫자(미터),
  "safetyMeetDepth": 숫자(미터)
}

규칙: 수심은 모두 양수로. 속도가 언급 없으면 descentSpeed/ascentSpeed는 1.0으로. discipline 불명확하면 "CWT". 다른 말 없이 JSON만 출력(코드펜스 금지).`;

    const raw = extractJson<Partial<DivePlan>>(await callClaude([{ type: 'text', text: prompt }], 400));
    res.status(200).json(normalize(raw));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : '서버 오류' });
  }
}

function normalize(p: Partial<DivePlan>): DivePlan {
  const discipline = VALID.includes(String(p.discipline)) ? (p.discipline as string) : 'CWT';
  const target = pos(p.targetDepth) ?? 20;
  const plan: DivePlan = {
    discipline,
    targetDepth: target,
    descentSpeed: pos(p.descentSpeed) ?? 1.0,
    ascentSpeed: pos(p.ascentSpeed) ?? 1.0,
  };
  const ff = pos(p.freefallStartDepth);
  if (ff != null && ff < target) plan.freefallStartDepth = ff;
  const ffs = pos(p.freefallSpeed);
  if (ffs != null) plan.freefallSpeed = ffs;
  const bt = pos(p.bottomTimeSec);
  if (bt != null) plan.bottomTimeSec = bt;
  const mf = pos(p.mouthfillDepth);
  if (mf != null && mf <= target) plan.mouthfillDepth = mf;
  const sf = pos(p.safetyMeetDepth);
  if (sf != null && sf <= target) plan.safetyMeetDepth = sf;
  return plan;
}

function pos(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.abs(n) : null;
}
