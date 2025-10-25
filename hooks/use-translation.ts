'use client';

// Client hook with graceful fallback; gated by NEXT_PUBLIC_TRANSLATION_MIGRATION

type Target = 'en' | 'ko' | 'zh-CN' | 'zh-TW';

const clientCache = new Map<string, string>();

export function useTranslationTarget(): Target {
  if (typeof window === 'undefined') return 'en';
  const cookie = document.cookie
    .split('; ')
    .find((c) => c.startsWith('locale='))?.split('=')[1];
  const stored = (cookie || localStorage.getItem('locale') || 'en') as Target;
  return (['en','ko','zh-CN','zh-TW'].includes(stored) ? stored : 'en') as Target;
}

export async function translateClient(
  texts: string[],
  target: Target,
  options?: { namespace?: string; source?: string }
): Promise<string[]> {
  const enabled = process.env.NEXT_PUBLIC_TRANSLATION_MIGRATION === 'true';
  if (!enabled || target === 'en') return texts;

  const key = (t: string) => `${target}:${options?.namespace ?? ''}:${t}`;
  const hits: string[] = [];
  const misses: { index: number; text: string }[] = [];
  texts.forEach((t, i) => {
    const v = clientCache.get(key(t));
    if (v) hits[i] = v; else misses.push({ index: i, text: t });
  });

  if (misses.length === 0) return hits.length ? hits : texts;

  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      texts: misses.map((m) => m.text),
      target,
      source: options?.source ?? 'en',
      namespace: options?.namespace,
    }),
  }).catch(() => null);

  const out = [...texts];
  if (!res || !res.ok) return out; // fallback
  const data = (await res.json()) as { texts: string[] };
  misses.forEach((m, i) => {
    const v = data.texts?.[i] ?? m.text;
    out[m.index] = v;
    clientCache.set(key(m.text), v);
  });
  hits.forEach((v, i) => { if (v) out[i] = v; });
  return out;
}

export function clearClientTranslationCache() { clientCache.clear(); }


