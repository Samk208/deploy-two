// Server-only Google Cloud Translation v3 REST wrapper (no client lib required)
// new API call + cost guard + batching

import crypto from "crypto";

type SupportedTarget = "en" | "ko" | "zh-CN" | "zh-TW";

export function buildKeyHash(
  source: string,
  target: SupportedTarget,
  namespace: string | undefined,
  text: string
): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  const version = "v1"; // bump if normalization changes
  return crypto
    .createHash("sha256")
    .update(`${version}|${source}|${target}|${namespace ?? ""}|${normalized}`)
    .digest("hex");
}

function getEnv(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

function decodeServiceAccount(): any | null {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64;
  if (!b64) return null;
  const json = Buffer.from(b64, "base64").toString("utf8");
  return JSON.parse(json);
}

export async function translateBatch({
  texts,
  source,
  target,
}: {
  texts: string[];
  source: string;
  target: SupportedTarget;
}): Promise<string[]> {
  console.log("[translateBatch] Called with:", { texts, source, target });
  
  if (!Array.isArray(texts) || texts.length === 0) {
    console.log("[translateBatch] Empty texts array, returning []");
    return [];
  }

  const maxCharsPerRequest = parseInt(
    process.env.TRANSLATION_MAX_CHARS_PER_REQUEST || "20000",
    10
  );
  const maxStringsPerRequest = parseInt(
    process.env.TRANSLATION_MAX_STRINGS_PER_REQUEST || "100",
    10
  );

  const joinedChars = texts.reduce((t, s) => t + s.length, 0);
  if (joinedChars > maxCharsPerRequest || texts.length > maxStringsPerRequest) {
    // cost guard: return originals rather than error
    return texts.slice();
  }

  // Build auth token using service account if provided; otherwise fall back to API key
  const serviceAccount = decodeServiceAccount();
  console.log("[translateBatch] Service account loaded:", !!serviceAccount);
  
  const projectId = getEnv("GOOGLE_PROJECT_ID");
  const location = getEnv("GOOGLE_LOCATION", "global");
  console.log("[translateBatch] Project:", projectId, "Location:", location);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  let url = `https://translation.googleapis.com/v3/projects/${projectId}/locations/${location}:translateText`;

  if (serviceAccount) {
    // Use OAuth2 JWT for service account via google-auth-library (lazy import to avoid bundle)
    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/cloud-translation"],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    headers.Authorization = `Bearer ${token.token ?? token}`;
  } else if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    console.log("[translateBatch] Using API key");
    url += `?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`;
  } else {
    // No credentials configured: return originals (safe no-op)
    console.log("[translateBatch] ERROR: No credentials configured!");
    return texts.slice();
  }

  const body = {
    sourceLanguageCode: source,
    targetLanguageCode: target,
    contents: texts,
    mimeType: "text/plain",
  } as const;

  try {
    console.log("[translateBatch] Calling Google API...", url);
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.log("[translateBatch] ERROR: API returned", res.status, errorText);
      return texts.slice();
    }
    const data = (await res.json()) as {
      translations: Array<{ translatedText: string }>;
    };
    if (!data.translations || data.translations.length !== texts.length) {
      const out = [...texts];
      (data.translations || []).forEach(
        (t, i) => (out[i] = t.translatedText ?? texts[i])
      );
      return out;
    }
    const result = data.translations.map((t) => t.translatedText);
    console.log("[translateBatch] SUCCESS! Translated:", texts, "→", result);
    return result;
  } catch (error) {
    // network/auth error -> return originals
    console.log("[translateBatch] EXCEPTION:", error);
    return texts.slice();
  }
}
