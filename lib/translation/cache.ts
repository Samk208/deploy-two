// Cache layer: persistent (Supabase) + optional in-memory LRU
// cost guard + cache-first

// Supabase admin is optional; if not configured, we skip DB caching safely
async function getSupabaseAdmin() {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return null;
    }
    // Dynamic import to satisfy lint rule and avoid bundling on clients
    const mod = await import("@/lib/supabase/admin");
    return mod.supabaseAdmin;
  } catch {
    return null;
  }
}

type CacheEntry = {
  key: string;
  source: string;
  target: "en" | "ko" | "zh-CN" | "zh-TW";
  namespace?: string;
  sourceText: string;
  translatedText: string;
};

const memory = new Map<string, { value: string; expiresAt: number }>();
const TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function getCached(
  keys: string[]
): Promise<Record<string, string | undefined>> {
  const now = Date.now();
  const result: Record<string, string | undefined> = {};

  const missing: string[] = [];
  for (const key of keys) {
    const entry = memory.get(key);
    if (entry && entry.expiresAt > now) {
      result[key] = entry.value;
    } else {
      missing.push(key);
    }
  }

  if (missing.length === 0) return result;

  // Fetch from Supabase by primary key
  const admin = await getSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin
      .from("translations")
      .select("key_hash, translated_text")
      .in("key_hash", missing);
    if (!error && data) {
      for (const row of data as Array<{
        key_hash: string;
        translated_text: string;
      }>) {
        result[row.key_hash] = row.translated_text as string;
        memory.set(row.key_hash, {
          value: row.translated_text as string,
          expiresAt: now + TTL_MS,
        });
      }
    }
  }

  return result;
}

export async function putCached(entries: CacheEntry[]): Promise<void> {
  if (entries.length === 0) return;
  const rows = entries.map((e) => ({
    key_hash: e.key,
    source_lang: e.source,
    target_lang: e.target,
    namespace: e.namespace ?? null,
    source_text: e.sourceText,
    translated_text: e.translatedText,
    hits: 1,
    updated_at: new Date().toISOString(),
  }));
  const admin = await getSupabaseAdmin();
  if (admin) {
    await admin.from("translations").upsert(rows, { onConflict: "key_hash" });
  }
  const expiresAt = Date.now() + TTL_MS;
  for (const r of rows) {
    memory.set(r.key_hash as string, {
      value: r.translated_text as string,
      expiresAt,
    });
  }
}
