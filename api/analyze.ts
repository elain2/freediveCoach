import type { VercelRequest, VercelResponse } from '@vercel/node';
import { RUBRICS, type DisciplineId } from './_lib/rubrics';
import { callGemini, extractJson } from './_lib/gemini';

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

const MAX_FRAMES = 12;

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
        ? '이 프레임들은 다이브의 한 구간을 조밀하게 추출한 것이다. 해당 구간의 기술을 집중적으로 평가하라. 어떤 구간인지는 추정하지 말고 보이는 것 기준으로.'
        : '이 프레임들은 한 번의 다이브 전체를 시간순으로 추출한 것이다. 가능하면 구간(하강/프리폴/턴/상승)별 흐름을 짚어라.';

    const categoriesText = rubric.categories
      .map((c) => `- ${c.label}: ${c.criteria}`)
      .join('\n');

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

    const parts = [
      ...frames.map((data) => ({
        inline_data: { mime_type: 'image/jpeg', data },
      })),
      { text: prompt },
    ];

    let parsed: AnalysisResult;
    try {
      parsed = extractJson<AnalysisResult>(await callGemini(parts, 1500));
    } catch {
      // one retry
      parsed = extractJson<AnalysisResult>(await callGemini(parts, 1500));
    }

    if (!parsed?.categories?.length) {
      res.status(502).json({ error: '결과 형식이 올바르지 않아요. 다시 시도해 주세요.' });
      return;
    }

    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : '서버 오류' });
  }
}
