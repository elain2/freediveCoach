// SERVER ONLY.
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export const MODEL = process.env.MODEL || 'gemini-2.0-flash';

type ContentPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

export async function callGemini(parts: ContentPart[], maxTokens = 1500): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured on the server.');

  const url = `${GEMINI_URL}/${MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Gemini API ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response');

  return text;
}

/** Strips code fences and parses the first JSON object/array in the text. */
export function extractJson<T>(text: string): T {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/[{[][\s\S]*[}\]]/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error('Model did not return valid JSON.');
  }
}
