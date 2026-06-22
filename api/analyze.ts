import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Types ───────────────────────────────────────────────────────────────────
type DisciplineId = 'CWT' | 'CNF' | 'FIM' | 'DYN' | 'STA';

interface RubricCategory {
  id: string;
  label: string;
  criteria: string;
}

interface Rubric {
  id: DisciplineId;
  label: string;
  context: string;
  categories: RubricCategory[];
}

interface CategoryResult {
  name: string;
  score: number;
  note: string;
  tip: string;
}

interface AnalysisResult {
  overall: string;
  categories: CategoryResult[];
  hook: string;
}

type ContentPart = { text: string } | { inline_data: { mime_type: string; data: string } };

// ─── Rubrics ─────────────────────────────────────────────────────────────────
const RUBRICS: Partial<Record<DisciplineId, Rubric>> = {
  CWT: {
    id: 'CWT',
    label: '콘스턴트 웨이트 (CWT)',
    context: 'AIDA 기준 핀 착용 수직 다이빙. 프레임에서 실제로 보이는 것만 근거로 삼고, 이퀄라이징·컨트랙션·내성처럼 영상으로 판단 불가한 것은 점수에 반영하지 말고 평가에서 뺀다.',
    categories: [
      { id: 'streamline', label: '유선형', criteria: '머리 중립(턱 살짝 당김), 양팔을 뻗어 상완이 귀를 감싸는지, 몸이 일직선인지, 불필요한 아치나 꺾임.' },
      { id: 'finning', label: '핀 킥', criteria: '고관절에서 시작하는 길고 부드러운 킥 vs 무릎 위주 자전거 킥, 발목 신전(포인 발), 진폭·리듬, 좌우 대칭.' },
      { id: 'entry', label: '입수·자세', criteria: '덕다이브의 몸 접기와 다리 수직 정렬, 또는 하강/프리폴 자세와 라인 정렬.' },
      { id: 'relax', label: '이완', criteria: '어깨·목·손·얼굴의 긴장 신호와 전반적인 평온함.' },
    ],
  },
  FIM: {
    id: 'FIM',
    label: '프리 이머전 (FIM)',
    context: 'AIDA 기준 로프를 잡고 당겨서 하강·상승하는 수직 다이빙. 핀을 사용하지 않음.',
    categories: [
      { id: 'streamline', label: '유선형', criteria: '머리 중립(턱 살짝 당김), 몸이 로프와 일직선인지, 다리가 정렬되어 있는지, 불필요한 아치나 꺾임.' },
      { id: 'pulling', label: '풀링 테크닉', criteria: '한 손씩 번갈아 당기는 리듬과 효율, 팔 동작의 부드러움, 로프를 놓는 타이밍, 몸 흔들림 최소화.' },
      { id: 'entry', label: '입수·자세', criteria: '덕다이브의 몸 접기와 다리 수직 정렬, 로프를 잡는 첫 동작의 매끄러움.' },
      { id: 'legs', label: '다리 자세', criteria: '다리가 모여 있고 발끝이 펴져 있는지, 불필요한 킥이나 움직임 없이 안정적인지.' },
      { id: 'relax', label: '이완', criteria: '어깨·목·손·얼굴의 긴장 신호와 전반적인 평온함.' },
    ],
  },
  CNF: {
    id: 'CNF',
    label: '콘스턴트 노핀 (CNF)',
    context: 'AIDA 기준 핀 없이 맨발로 수영하는 수직 다이빙.',
    categories: [
      { id: 'streamline', label: '유선형', criteria: '머리 중립(턱 살짝 당김), 양팔을 뻗어 상완이 귀를 감싸는지, 몸이 일직선인지, 불필요한 아치나 꺾임.' },
      { id: 'kick', label: '킥', criteria: '평영 킥(브레스트 킥) 또는 돌핀 킥의 효율성, 무릎 굽힘 각도, 발목 유연성, 추진력 대비 에너지 소모.' },
      { id: 'stroke', label: '스트로크', criteria: '팔 동작의 타이밍과 효율, 물 잡기(캐치)의 정확성, 리커버리 동작의 매끄러움, 킥과의 조화.' },
      { id: 'entry', label: '입수·자세', criteria: '덕다이브의 몸 접기와 다리 수직 정렬, 하강 시작 자세.' },
      { id: 'relax', label: '이완', criteria: '어깨·목·손·얼굴의 긴장 신호와 전반적인 평온함.' },
    ],
  },
};

// ─── Gemini API ──────────────────────────────────────────────────────────────
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = process.env.MODEL || 'gemini-2.5-flash';

async function callGemini(parts: ContentPart[], maxTokens = 1500): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('[gemini] API key exists:', !!apiKey);
  console.log('[gemini] Using model:', MODEL);

  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured on the server.');

  const res = await fetch(`${GEMINI_URL}/${MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
    }),
  });

  console.log('[gemini] response status:', res.status);

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('[gemini] error detail:', detail.slice(0, 500));
    throw new Error(`Gemini API ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log('[gemini] response text length:', text?.length ?? 0);

  if (!text) {
    console.error('[gemini] empty response:', JSON.stringify(data).slice(0, 500));
    throw new Error('Gemini returned empty response');
  }

  return text;
}

function extractJson<T>(text: string): T {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/[{[][\s\S]*[}\]]/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error('Model did not return valid JSON.');
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────
const MAX_FRAMES = 12;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[analyze] handler started');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { discipline, mode, frames } = req.body as {
      discipline: DisciplineId;
      mode: 'overview' | 'segment';
      segment?: { startSec: number; endSec: number };
      frames: string[];
    };

    console.log('[analyze] discipline:', discipline, 'mode:', mode, 'frames:', frames?.length);

    const rubric = RUBRICS[discipline];
    if (!rubric) {
      res.status(400).json({ error: `아직 지원하지 않는 종목이에요: ${discipline}` });
      return;
    }
    if (!Array.isArray(frames) || frames.length === 0) {
      res.status(400).json({ error: '프레임이 없어요.' });
      return;
    }
    if (frames.length > MAX_FRAMES) {
      res.status(400).json({ error: `프레임은 최대 ${MAX_FRAMES}장까지예요.` });
      return;
    }

    const modeLine =
      mode === 'segment'
        ? '이 프레임들은 다이브의 한 구간을 조밀하게 추출한 것이다. 해당 구간의 기술을 집중적으로 평가하라.'
        : '이 프레임들은 한 번의 다이브 전체를 시간순으로 추출한 것이다. 가능하면 구간(하강/프리폴/턴/상승)별 흐름을 짚어라.';

    const categoriesText = rubric.categories.map((c) => `- ${c.label}: ${c.criteria}`).join('\n');

    const prompt = `당신은 AIDA 기준에 정통한 프리다이빙 코치입니다. 아래 다이빙 영상에서 순서대로 추출한 프레임들을 보고 폼을 평가하세요.

종목: ${rubric.label}
${rubric.context}
${modeLine}

평가 항목:
${categoriesText}

중요: 프레임에서 실제로 보이는 것만 근거로 삼으세요. 보이지 않거나 영상만으로 판단 불가한 것은 점수에 반영하지 말고 솔직히 언급하세요. 구체적이고 건설적인 코칭 톤으로, AIDA 강사가 말하듯 한국어로 작성하세요.

다른 말 없이 아래 JSON만 출력하세요(마크다운 코드펜스 금지):
{
  "overall": "2~3문장 총평",
  "categories": [
${rubric.categories.map((c) => `    {"name":"${c.label}","score":4,"note":"보이는 것 관찰 1~2문장","tip":"개선 팁 1문장"}`).join(',\n')}
  ],
  "hook": "블로그/쇼츠 후킹용 한 줄 카피"
}
score는 0.5 단위 1~5. 각 문장은 간결하게.`;

    const parts: ContentPart[] = [
      ...frames.map((data) => ({ inline_data: { mime_type: 'image/jpeg', data } })),
      { text: prompt },
    ];

    console.log('[analyze] calling Gemini API...');

    let parsed: AnalysisResult;
    try {
      const raw = await callGemini(parts, 1500);
      console.log('[analyze] Gemini response length:', raw?.length);
      parsed = extractJson<AnalysisResult>(raw);
    } catch (e) {
      console.log('[analyze] first attempt failed:', e instanceof Error ? e.message : e);
      const raw = await callGemini(parts, 1500);
      console.log('[analyze] retry response length:', raw?.length);
      parsed = extractJson<AnalysisResult>(raw);
    }

    if (!parsed?.categories?.length) {
      console.log('[analyze] invalid result format:', JSON.stringify(parsed).slice(0, 200));
      res.status(502).json({ error: '결과 형식이 올바르지 않아요. 다시 시도해 주세요.' });
      return;
    }

    console.log('[analyze] success');
    res.status(200).json(parsed);
  } catch (err) {
    console.error('[analyze] error:', err instanceof Error ? err.message : err);
    console.error('[analyze] stack:', err instanceof Error ? err.stack : 'no stack');
    res.status(500).json({ error: err instanceof Error ? err.message : '서버 오류' });
  }
}
