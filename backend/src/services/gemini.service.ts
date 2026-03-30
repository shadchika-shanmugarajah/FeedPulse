import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
/** Prefer a current model; override with GEMINI_MODEL in .env if needed */
const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash';
const GENERATE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface GeminiResult {
  category: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  priority_score: number;
  summary: string;
  tags: string[];
}

const FALLBACK_RESULT: GeminiResult = {
  category: 'Other',
  sentiment: 'Neutral',
  priority_score: 5,
  summary: 'AI analysis unavailable',
  tags: [],
};

const extractJson = (text: string): string | null => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
};

/** Parse JSON from model output: raw JSON, or ```json ... ```, or prose containing {...} */
function parseModelJson(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
  const inner = fenceMatch ? fenceMatch[1].trim() : trimmed;

  try {
    return JSON.parse(inner) as Record<string, unknown>;
  } catch {
    /* continue */
  }

  const extracted = extractJson(inner);
  if (extracted) {
    try {
      return JSON.parse(extracted) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return null;
}

const getTextFromResponse = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') return '';
  const p = payload as Record<string, unknown>;

  if (p.error && typeof p.error === 'object') {
    const err = p.error as Record<string, unknown>;
    console.error('Gemini API error object:', JSON.stringify(err));
  }

  const promptFeedback = p.promptFeedback as Record<string, unknown> | undefined;
  if (promptFeedback?.blockReason) {
    console.error('Gemini prompt blocked:', promptFeedback.blockReason);
  }

  const candidates = p.candidates as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(candidates) || !candidates[0]) {
    console.error('Gemini: no candidates in response');
    return '';
  }

  const first = candidates[0];
  if (first.finishReason && first.finishReason !== 'STOP') {
    console.warn('Gemini finishReason:', first.finishReason);
  }

  const content = first.content as Record<string, unknown> | undefined;
  if (!content) return '';
  const parts = content.parts as Array<{ text?: string }> | undefined;
  if (!Array.isArray(parts)) return '';
  return parts.map((part) => part.text || '').join('');
};

function mapParsedToResult(parsed: Record<string, unknown>): GeminiResult {
  return {
    category: String(parsed.category || 'Other'),
    sentiment: (['Positive', 'Neutral', 'Negative'].includes(String(parsed.sentiment))
      ? parsed.sentiment
      : 'Neutral') as GeminiResult['sentiment'],
    priority_score: Math.min(10, Math.max(1, Number(parsed.priority_score) || 5)),
    summary: String(parsed.summary || 'AI analysis unavailable'),
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
  };
}

export async function analyseFeedback(title: string, description: string): Promise<GeminiResult> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.error('Set GEMINI_API_KEY in backend/.env for AI analysis.');
    return FALLBACK_RESULT;
  }

  const prompt = `Analyse this product feedback. Return a JSON object with: category, sentiment, priority_score (1-10), summary, tags (string array).

category: one of Bug, Feature Request, Improvement, Other
sentiment: one of Positive, Neutral, Negative

Title: "${title.replace(/"/g, '\\"')}"
Description: "${description.replace(/"/g, '\\"')}"`;

  const url = `${GENERATE_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      console.error('Gemini request failed:', response.status, bodyText);
      throw new Error(`Gemini error ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const rawText = getTextFromResponse(payload);
    const parsed = parseModelJson(rawText);
    if (!parsed) {
      console.error('Gemini: could not parse JSON from model output. Raw:', rawText.slice(0, 500));
      return FALLBACK_RESULT;
    }

    return mapParsedToResult(parsed);
  } catch (error) {
    console.error('Gemini analysis failed:', error);
    return FALLBACK_RESULT;
  }
}

export async function summarizeFeedbackCollection(
  feedbackItems: Array<{ title: string; description: string }>
): Promise<string> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here' || feedbackItems.length === 0) {
    return 'Summary unavailable at this time.';
  }

  const sampleText = feedbackItems
    .slice(0, 8)
    .map((item, index) => `${index + 1}. ${item.title}: ${item.description}`)
    .join('\n\n');

  const prompt = `Provide a concise product feedback summary based on the following feedback snippets. Return only plain text.\n\n${sampleText}`;

  try {
    const url = `${GENERATE_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      console.error('Gemini summary failed:', response.status, bodyText);
      throw new Error(`Gemini summary error ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const summary = getTextFromResponse(payload).trim();
    return summary || 'Summary unavailable at this time.';
  } catch (error) {
    console.error('Gemini summary failed:', error);
    return 'Summary unavailable at this time.';
  }
}
