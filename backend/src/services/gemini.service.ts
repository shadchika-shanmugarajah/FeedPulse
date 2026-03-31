import '../env';

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

let geminiCooldownUntilMs = 0;
const GEMINI_COOLDOWN_MS = 90_000;

function isGeminiCoolingDown(): boolean {
  return Date.now() < geminiCooldownUntilMs;
}

function markGemini429(): void {
  geminiCooldownUntilMs = Date.now() + GEMINI_COOLDOWN_MS;
}

function geminiExplicitlyDisabled(): boolean {
  const v = process.env.GEMINI_DISABLED?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function getGeminiConfig(): { key: string; model: string } {
  const key = (process.env.GEMINI_API_KEY ?? '')
    .trim()
    .replace(/^\uFEFF/, '')
    .replace(/^["']|["']$/g, '');
  const model = (process.env.GEMINI_MODEL ?? '').trim() || 'gemini-2.5-flash';
  return { key, model };
}

function buildGenerateUrl(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

const extractJson = (text: string): string | null => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
};

function normalizeToRecord(parsed: unknown): Record<string, unknown> | null {
  if (parsed == null || typeof parsed !== 'object') return null;
  if (Array.isArray(parsed)) {
    const first = parsed[0];
    if (first != null && typeof first === 'object' && !Array.isArray(first)) {
      return first as Record<string, unknown>;
    }
    return null;
  }
  return parsed as Record<string, unknown>;
}

function parseModelJson(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
  const inner = fenceMatch ? fenceMatch[1].trim() : trimmed;
  try {
    return normalizeToRecord(JSON.parse(inner));
  } catch {
    /* continue */
  }
  const extracted = extractJson(inner);
  if (extracted) {
    try {
      return normalizeToRecord(JSON.parse(extracted));
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
    console.error('Gemini API error object:', JSON.stringify(p.error));
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
  const joined = parts.map((part) => part.text || '').join('');
  if (!joined) {
    console.error('Gemini: empty text in parts; payload snippet:', JSON.stringify(payload).slice(0, 1200));
  }
  return joined;
};

function coercePriorityFromUnknown(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const m = value.trim().match(/\d+/);
    if (m) return Number(m[0]);
  }
  return null;
}

function extractPriorityScore(parsed: Record<string, unknown>): number | null {
  const keys = ['priority_score', 'priorityScore', 'priority', 'Priority'] as const;
  for (const k of keys) {
    const n = coercePriorityFromUnknown(parsed[k]);
    if (n != null) return n;
  }
  return null;
}

function mapParsedToResult(parsed: Record<string, unknown>): GeminiResult {
  const rawPriority = extractPriorityScore(parsed);
  if (rawPriority == null) {
    console.warn('Gemini: no numeric priority in JSON keys:', Object.keys(parsed).join(', '));
  }
  const category = ['Bug', 'Feature Request', 'Improvement', 'Other'].includes(String(parsed.category))
    ? String(parsed.category)
    : 'Other';
  const sentiment = ['Positive', 'Neutral', 'Negative'].includes(String(parsed.sentiment))
    ? (String(parsed.sentiment) as GeminiResult['sentiment'])
    : 'Neutral';
  const priority_score = Math.min(10, Math.max(1, rawPriority ?? 5));
  const summary =
    typeof parsed.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim()
      : 'AI analysis unavailable';
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.map(String).map((tag) => tag.trim()).filter(Boolean).slice(0, 6)
    : [];
  return { category, sentiment, priority_score, summary, tags };
}

const FEEDBACK_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    category: {
      type: 'string',
      enum: ['Bug', 'Feature Request', 'Improvement', 'Other'],
    },
    sentiment: {
      type: 'string',
      enum: ['Positive', 'Neutral', 'Negative'],
    },
    priority_score: { type: 'integer' },
    summary: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
  },
  required: ['category', 'sentiment', 'priority_score', 'summary', 'tags'],
};

const escapeForPrompt = (s: string) => s.replace(/"/g, '\\"');

const ANALYSIS_PROMPT = (title: string, description: string) =>
  `You are part of a backend system that processes user feedback using an external AI API.

Important:
- The system has strict rate limits.
- You must respond efficiently and avoid unnecessary output.
- Always return ONLY the required JSON format.
- Do not generate extra explanations or long responses.
- Keep responses concise to reduce processing time.

Analyse the following product feedback and return ONLY valid JSON.

Title: "${escapeForPrompt(title)}"
Description: "${escapeForPrompt(description)}"

Return this exact JSON structure:
{
  "category": "Bug | Feature Request | Improvement | Other",
  "sentiment": "Positive | Neutral | Negative",
  "priority_score": integer (1-10),
  "summary": "one short sentence",
  "tags": ["tag1", "tag2"]
}`;

type GeminiHttpError = Error & { status?: number };

function httpError(status: number, message: string): GeminiHttpError {
  const err = new Error(message) as GeminiHttpError;
  err.status = status;
  return err;
}

async function fetchGenerateContent(
  model: string,
  apiKey: string,
  prompt: string,
  generationConfig: Record<string, unknown>
): Promise<unknown> {
  const url = `${buildGenerateUrl(model)}?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });
  const bodyText = await response.text();
  if (!response.ok) {
    if (response.status === 429) {
      markGemini429();
    }
    console.error('Gemini request failed:', response.status, bodyText.slice(0, 800));
    throw httpError(response.status, `Gemini error ${response.status}`);
  }
  try {
    return JSON.parse(bodyText) as unknown;
  } catch {
    console.error('Gemini: invalid JSON in HTTP body:', bodyText.slice(0, 300));
    throw httpError(500, 'Gemini invalid response body');
  }
}

export async function analyseFeedback(title: string, description: string): Promise<GeminiResult> {
  const { key, model } = getGeminiConfig();

  if (geminiExplicitlyDisabled()) {
    return FALLBACK_RESULT;
  }
  if (isGeminiCoolingDown()) {
    return FALLBACK_RESULT;
  }
  if (!key || key === 'your_gemini_api_key_here') {
    console.error('Set GEMINI_API_KEY in backend/.env for AI analysis.');
    return FALLBACK_RESULT;
  }

  const prompt = ANALYSIS_PROMPT(title, description);
  const structuredConfig: Record<string, unknown> = {
    temperature: 0.25,
    maxOutputTokens: 512,
    responseMimeType: 'application/json',
    responseSchema: FEEDBACK_RESPONSE_SCHEMA,
  };
  const looseConfig: Record<string, unknown> = {
    temperature: 0.25,
    maxOutputTokens: 512,
  };

  const tryOnce = async (generationConfig: Record<string, unknown>): Promise<GeminiResult | null> => {
    const payload = await fetchGenerateContent(model, key, prompt, generationConfig);
    const rawText = getTextFromResponse(payload);
    const parsed = parseModelJson(rawText);
    if (parsed) return mapParsedToResult(parsed);
    console.error('Gemini: could not parse JSON from model output. Raw:', rawText.slice(0, 500));
    return null;
  };

  try {
    const first = await tryOnce(structuredConfig);
    if (first) return first;
    const second = await tryOnce(looseConfig);
    if (second) return second;
  } catch (e) {
    const status = typeof e === 'object' && e !== null && 'status' in e ? (e as GeminiHttpError).status : undefined;
    if (status === 429) {
      console.error(
        'Gemini: 429 — free-tier quota exhausted or limit:0. Enable billing / new API project, or set GEMINI_DISABLED=true. Pausing Gemini calls for 90s. https://ai.google.dev/gemini-api/docs/rate-limits'
      );
      return FALLBACK_RESULT;
    }
    console.error('Gemini analysis failed:', e);
  }
  return FALLBACK_RESULT;
}

export async function summarizeFeedbackCollection(
  feedbackItems: Array<{ title: string; description: string }>
): Promise<string> {
  const { key, model } = getGeminiConfig();

  if (geminiExplicitlyDisabled() || isGeminiCoolingDown()) {
    return 'Summary unavailable at this time.';
  }
  if (!key || key === 'your_gemini_api_key_here' || feedbackItems.length === 0) {
    return 'Summary unavailable at this time.';
  }

  const sampleText = feedbackItems
    .slice(0, 8)
    .map((item, index) => `${index + 1}. ${item.title}: ${item.description}`)
    .join('\n\n');
  const prompt = `Provide a concise product feedback summary based on the following feedback snippets. Return only plain text.\n\n${sampleText}`;

  try {
    const payload = await fetchGenerateContent(model, key, prompt, {
      temperature: 0.3,
      maxOutputTokens: 512,
    });
    const summary = getTextFromResponse(payload).trim();
    return summary || 'Summary unavailable at this time.';
  } catch (error) {
    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? (error as GeminiHttpError).status
        : undefined;
    if (status === 429) {
      console.error('Gemini digest skipped (429 quota). Using local digest if configured.');
    } else {
      console.error('Gemini summary failed:', error);
    }
    return 'Summary unavailable at this time.';
  }
}
