// api/analyze.ts
// Vercel 서버리스 함수 - Gemini Vision으로 프레임 분석

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { AnalyzeRequest, AnalyzeResponse, AnalysisMode } from '../shared/types';
import { getRubric, hasRubric, type Rubric } from '../shared/rubrics';

// 환경변수에서 모델 선택 (기본: gemini-2.0-flash)
const MODEL = process.env.MODEL || 'gemini-2.0-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const MAX_FRAMES = 12;
const MAX_FRAME_SIZE = 1.5 * 1024 * 1024; // 1.5MB

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더
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
    return res.status(500).json({ error: '서버 설정 오류' });
  }

  try {
    const body = req.body as AnalyzeRequest;
    const { discipline, mode, frames } = body;

    // 유효성 검사
    if (!discipline || !hasRubric(discipline)) {
      return res.status(400).json({ error: '지원하지 않는 종목입니다' });
    }

    if (!mode || !['overview', 'segment'].includes(mode)) {
      return res.status(400).json({ error: '분석 모드가 올바르지 않습니다' });
    }

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({ error: '프레임이 없습니다' });
    }

    if (frames.length > MAX_FRAMES) {
      return res.status(400).json({ error: `프레임은 최대 ${MAX_FRAMES}장까지 가능합니다` });
    }

    // 프레임 크기 검사
    for (const frame of frames) {
      const sizeBytes = Buffer.from(frame, 'base64').length;
      if (sizeBytes > MAX_FRAME_SIZE) {
        return res.status(400).json({ error: '프레임 크기가 너무 큽니다' });
      }
    }

    const rubric = getRubric(discipline)!;
    const prompt = buildPrompt(rubric, mode);

    // Gemini API 호출
    const result = await callGemini(frames, prompt);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Analysis error:', error);

    if (error instanceof Error && error.message.includes('parse')) {
      return res.status(500).json({ error: '분석 결과 처리 중 오류가 발생했습니다. 다시 시도해주세요.' });
    }

    return res.status(500).json({ error: '분석 중 오류가 발생했습니다' });
  }
}

function buildPrompt(rubric: Rubric, mode: AnalysisMode): string {
  const modeInstruction = mode === 'overview'
    ? '이 프레임들은 한 번의 다이브 전체를 시간순으로 추출한 것이다. 가능하면 구간(하강/프리폴/턴/상승)별 흐름을 짚어라.'
    : '이 프레임들은 다이브의 한 구간을 조밀하게 추출한 것이다. 해당 구간의 기술을 집중적으로 평가하라.';

  const categoryInstructions = rubric.categories
    .map(c => `- ${c.label}: ${c.criteria}`)
    .join('\n');

  return `당신은 AIDA 기준에 정통한 프리다이빙 코치입니다.
프레임에서 보이는 것만 근거로, AIDA 강사처럼 한국어로 평가합니다.

## 종목
${rubric.label}

## 맥락
${rubric.context}

## 분석 지시
${modeInstruction}

## 평가 항목
${categoryInstructions}

## 출력 형식
반드시 아래 JSON 형식으로만 응답하세요. 코드펜스(\`\`\`)를 사용하지 마세요. 순수 JSON만 출력하세요.

{
  "overall": "전체 평가 요약 (2-3문장)",
  "categories": [
    {
      "name": "항목명",
      "score": 점수(1~5, 0.5 단위),
      "note": "관찰 내용 (구체적으로 보이는 것)",
      "tip": "개선 팁 (실천 가능한 조언)"
    }
  ],
  "hook": "블로그/쇼츠용 후킹 카피 (1문장, 흥미를 끄는 표현)"
}`;
}

async function callGemini(frames: string[], prompt: string, retry = true): Promise<AnalyzeResponse> {
  // Gemini API 형식으로 이미지와 텍스트 구성
  const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [];

  // 이미지들 먼저 추가
  for (const frame of frames) {
    parts.push({
      inline_data: {
        mime_type: 'image/jpeg',
        data: frame,
      },
    });
  }

  // 텍스트 프롬프트 추가
  parts.push({ text: prompt });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts,
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', response.status, errorText);
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();

  // Gemini 응답에서 텍스트 추출
  const candidates = data.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error('No response from Gemini');
  }

  const content = candidates[0].content;
  if (!content || !content.parts || content.parts.length === 0) {
    throw new Error('Empty response from Gemini');
  }

  let text = content.parts
    .filter((part: { text?: string }) => part.text)
    .map((part: { text: string }) => part.text)
    .join('');

  // 코드펜스 제거 (혹시 포함된 경우)
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    const parsed = JSON.parse(text);

    // 스키마 검증
    if (!parsed.overall || !Array.isArray(parsed.categories) || !parsed.hook) {
      throw new Error('Invalid response schema');
    }

    // 카테고리 검증
    for (const cat of parsed.categories) {
      if (typeof cat.name !== 'string' ||
          typeof cat.score !== 'number' ||
          typeof cat.note !== 'string' ||
          typeof cat.tip !== 'string') {
        throw new Error('Invalid category schema');
      }
      // 점수 범위 검증
      if (cat.score < 1 || cat.score > 5) {
        cat.score = Math.max(1, Math.min(5, cat.score));
      }
    }

    return parsed as AnalyzeResponse;
  } catch (parseError) {
    console.error('Parse error:', parseError, 'Text:', text.substring(0, 200));

    // 1회 재시도
    if (retry) {
      console.log('Retrying...');
      return callGemini(frames, prompt, false);
    }

    throw new Error('Failed to parse response');
  }
}
