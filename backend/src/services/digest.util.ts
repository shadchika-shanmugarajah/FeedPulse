/** Deterministic dashboard digest when Gemini is unavailable (quota, key, or network). */

export type DigestItem = {
  title: string;
  description: string;
  category?: string;
  ai_category?: string;
  ai_sentiment?: string;
};

function countBy<T extends string>(values: T[]): Map<T, number> {
  const m = new Map<T, number>();
  for (const v of values) {
    m.set(v, (m.get(v) || 0) + 1);
  }
  return m;
}

export function buildLocalDigestSummary(items: DigestItem[]): string {
  if (items.length === 0) {
    return 'No feedback submitted yet. When entries arrive, you will see a snapshot here.';
  }

  const userCats = countBy(items.map((i) => (i.category || 'Other') as string));
  const userCatLine = [...userCats.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `${c}: ${n}`)
    .join(', ');

  const sentiments = countBy(items.map((i) => (i.ai_sentiment || 'Neutral') as string));
  const sentLine = [...sentiments.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([s, n]) => `${s} (${n})`)
    .join(', ');

  const aiCats = countBy(items.map((i) => (i.ai_category || 'Other') as string));
  const aiCatLine = [...aiCats.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `${c}: ${n}`)
    .join(', ');

  const samples = items.slice(0, 5).map((i) => i.title.trim());
  const sampleText = samples.join('; ');

  return [
    `Snapshot of ${items.length} feedback item(s).`,
    userCatLine ? `User categories — ${userCatLine}.` : '',
    aiCatLine ? `AI categories — ${aiCatLine}.` : '',
    sentLine ? `AI sentiment — ${sentLine}.` : '',
    sampleText ? `Examples: ${sampleText}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}
