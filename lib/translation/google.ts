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

  // Credential detection
  const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
  const serviceAccount = decodeServiceAccount();
  console.log("[translateBatch] Service account loaded:", !!serviceAccount);

  // -------- Preferred path: v2 (Basic) using API key --------
  if (!serviceAccount && API_KEY) {
    try {
      console.info("[translateBatch] Using v2 + API key");
      const url =
        "https://translation.googleapis.com/language/translate/v2?key=" +
        encodeURIComponent(API_KEY);
      const bodyV2: any = {
        q: texts,
        target,
        format: "text",
      };
      if (source) bodyV2.source = source;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyV2),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("[translateBatch] v2 error", res.status, errText);
        return texts.slice();
      }
      const json: any = await res.json();
      const out = (json?.data?.translations ?? []).map(
        (t: any, i: number) => t?.translatedText ?? texts[i] ?? ""
      );
      console.log("[translateBatch] SUCCESS! Translated (v2)");
      return out;
    } catch (error) {
      console.log("[translateBatch] EXCEPTION (v2):", error);
      return texts.slice();
    }
  }

  // -------- Fallback path: v3 (Advanced) using service account --------
  if (serviceAccount) {
    const projectId = getEnv("GOOGLE_PROJECT_ID");
    const location = getEnv("GOOGLE_LOCATION", "global");
    console.log("[translateBatch] Project:", projectId, "Location:", location);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const url = `https://translation.googleapis.com/v3/projects/${projectId}/locations/${location}:translateText`;

    try {
      console.info("[translateBatch] Using v3 + service account");
      // Use OAuth2 JWT for service account via google-auth-library (lazy import to avoid bundle)
      const { GoogleAuth } = await import("google-auth-library");
      const auth = new GoogleAuth({
        credentials: serviceAccount,
        scopes: ["https://www.googleapis.com/auth/cloud-translation"],
      });
      const client = await auth.getClient();
      const token = await client.getAccessToken();
      headers.Authorization = `Bearer ${token.token ?? token}`;

      const bodyV3 = {
        sourceLanguageCode: source,
        targetLanguageCode: target,
        contents: texts,
        mimeType: "text/plain",
      } as const;

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyV3),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("[translateBatch] v3 error", res.status, errText);
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
      console.log("[translateBatch] SUCCESS! Translated (v3)");
      return result;
    } catch (error) {
      console.log("[translateBatch] EXCEPTION (v3):", error);
      return texts.slice();
    }
  }

  // No credentials configured: return originals (safe no-op)
  console.log("[translateBatch] ERROR: No credentials configured!");
  return texts.slice();

  // Unreachable, kept for type completeness
}
