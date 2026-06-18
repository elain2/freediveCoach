// api/analyze.ts
// Vercel 서버리스 함수 - Gemini Vision으로 프레임 분석

import type { VercelRequest, VercelResponse } from '@vercel/node';

// 타입 정의 (인라인)
type DisciplineId = 'CWT' | 'CNF' | 'FIM' | 'DYN' | 'STA';
type AnalysisMode = 'overview' | 'segment';

interface AnalyzeRequest {
  discipline: DisciplineId;
  mode: AnalysisMode;
  frames: string[];
}

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

// 루브릭 정의 (인라인)
const RUBRICS: Partial<Record<DisciplineId, Rubric>> = {
  CWT: {
    id: 'CWT',
    label: '콘스턴트 웨이트 (CWT)',
    context: 'AIDA 기준 핀 착용 수직 다이빙. 프레임에서 보이는 것만 평가.',
    categories: [
      { id: 'streamline', label: '유선형', criteria: '머리 중립, 양팔을 뻗어 상완이 귀를 감싸는지, 몸이 일직선인지.' },
      { id: 'finning', label: '핀 킥', criteria: '고관절에서 시작하는 킥 vs 무릎 위주 킥, 발목 신전, 진폭·리듬.' },
      { id: 'entry', label: '입수·덕다이브', criteria: '덕다이브의 몸 접기와 다리 수직 정렬.' },
      { id: 'relax', label: '이완', criteria: '어깨·목·손·얼굴의 긴장 신호.' },
    ],
  },
  CNF: {
    id: 'CNF',
    label: '콘스턴트 노핀 (CNF)',
    context: 'AIDA 기준 핀 없이 맨몸으로 수직 다이빙.',
    categories: [
      { id: 'streamline', label: '유선형', criteria: '글라이드 구간에서의 스트림라인 유지.' },
      { id: 'kick', label: '브레스트 킥', criteria: '무릎 리커버리 최소화, 발목 굴곡 효율.' },
      { id: 'pull', label: '팔 스트로크', criteria: '캐치, 풀, 리커버리, 타이밍.' },
      { id: 'relax', label: '이완·효율', criteria: '불필요한 동작 없이 효율적인 움직임.' },
    ],
  },
  FIM: {
    id: 'FIM',
    label: '프리 이머젼 (FIM)',
    context: 'AIDA 기준 로프를 잡고 당기며 하강/상승.',
    categories: [
      { id: 'streamline', label: '유선형', criteria: '로프를 당기는 동안 몸이 일직선 유지.' },
      { id: 'pull', label: '풀 테크닉', criteria: '긴 스트로크, 양팔 교대 리듬, 글라이드.' },
      { id: 'legs', label: '다리 자세', criteria: '다리가 모아져서 일직선 유지.' },
      { id: 'relax', label: '이완', criteria: '어깨와 목의 긴장 최소화.' },
    ],
  },
};

// 환경변수
const MODEL = process.env.MODEL || 'gemini-3.5-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const MAX_FRAMES = 12;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not configured');
    return res.status(500).json({ error: 'API 키가 설정되지 않았습니다' });
  }

  try {
    const body = req.body as AnalyzeRequest;
    const { discipline, mode, frames } = body;

    if (!discipline || !RUBRICS[discipline]) {
      return res.status(400).json({ error: '지원하지 않는 종목입니다' });
    }

    if (!frames || frames.length === 0) {
      return res.status(400).json({ error: '프레임이 없습니다' });
    }

    if (frames.length > MAX_FRAMES) {
      return res.status(400).json({ error: `프레임은 최대 ${MAX_FRAMES}장까지 가능합니다` });
    }

    console.log(`분석 시작: ${discipline}, ${frames.length}장, 모델: ${MODEL}`);

    const rubric = RUBRICS[discipline]!;
    const prompt = buildPrompt(rubric, mode);
    const result = await callGemini(frames, prompt);

    console.log('분석 완료');
    return res.status(200).json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : '분석 중 오류 발생';
    return res.status(500).json({ error: message });
  }
}

function buildPrompt(rubric: Rubric, mode: AnalysisMode): string {
  const modeInstruction = mode === 'overview'
    ? '이 프레임들은 한 번의 다이브 전체를 시간순으로 추출한 것이다.'
    : '이 프레임들은 다이브의 한 구간을 조밀하게 추출한 것이다.';

  const categoryInstructions = rubric.categories
    .map(c => `- ${c.label}: ${c.criteria}`)
    .join('\n');

  return `당신은 AIDA 기준에 정통한 프리다이빙 코치입니다.
프레임에서 보이는 것만 근거로, AIDA 강사처럼 한국어로 평가합니다.

## 종목: ${rubric.label}
## 맥락: ${rubric.context}
## 분석 지시: ${modeInstruction}

## 평가 항목
${categoryInstructions}

## 출력 형식
반드시 아래 JSON 형식으로만 응답하세요. 코드펜스 없이 순수 JSON만:

{
  "overall": "전체 평가 요약 (2-3문장)",
  "categories": [
    { "name": "항목명", "score": 점수(1~5, 0.5단위), "note": "관찰 내용", "tip": "개선 팁" }
  ],
  "hook": "블로그용 후킹 카피 (1문장)"
}`;
}

async function callGemini(frames: string[], prompt: string): Promise<object> {
  const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [];

  for (const frame of frames) {
    parts.push({
      inline_data: {
        mime_type: 'image/jpeg',
        data: frame,
      },
    });
  }
  parts.push({ text: prompt });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', response.status, errorText);
    throw new Error(`Gemini API 오류: ${response.status}`);
  }

  const data = await response.json();
  const candidates = data.candidates;

  if (!candidates || candidates.length === 0) {
    throw new Error('Gemini로부터 응답이 없습니다');
  }

  let text = candidates[0].content.parts
    .filter((p: { text?: string }) => p.text)
    .map((p: { text: string }) => p.text)
    .join('');

  // 코드펜스 제거
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(text);
  } catch {
    console.error('JSON 파싱 실패. 응답:', text.substring(0, 500));
    throw new Error('AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.');
  }
}
