import { getCached } from "@/lib/translation/cache";
import { buildKeyHash, translateBatch } from "@/lib/translation/google";
import { NextResponse } from "next/server";

type Target = "en" | "ko" | "zh-CN" | "zh-TW";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Version tag so we know this exact code path is running
  if (process.env.NODE_ENV !== "production")
    console.log("[translate route] v3");

  try {
    const body: any = await req.json().catch(() => ({}));
    if (process.env.NODE_ENV !== "production") {
      console.log("/api/translate body:", body);
    }

    const source =
      typeof body.source === "string" && body.source ? body.source : "en";
    const target = body.target as Target | undefined;
    const namespace =
      typeof body.namespace === "string" ? body.namespace : undefined;

    const texts: string[] = Array.isArray(body.texts)
      ? body.texts.filter((t: unknown) => typeof t === "string")
      : typeof body.text === "string"
        ? [body.text]
        : [];

    // Feature flags
    const enabled = process.env.TRANSLATION_MIGRATION_ENABLED === "true";
    const cacheOnly = process.env.TRANSLATION_CACHE_ONLY_MODE === "true";

    if (process.env.NODE_ENV !== "production") {
      console.log("[DEBUG] Translation flags:", { enabled, cacheOnly });
      console.log(
        "[DEBUG] TRANSLATION_MIGRATION_ENABLED=",
        process.env.TRANSLATION_MIGRATION_ENABLED
      );
      console.log(
        "[DEBUG] TRANSLATION_CACHE_ONLY_MODE=",
        process.env.TRANSLATION_CACHE_ONLY_MODE
      );
    }

    if (texts.length === 0 || !target) {
      return NextResponse.json({ texts });
    }

    const keys = texts.map((t) => buildKeyHash(source, target, namespace, t));
    const cached = await getCached(keys);

    const misses: { index: number; text: string; key: string }[] = [];
    texts.forEach((t, i) => {
      if (!cached[keys[i]]) misses.push({ index: i, text: t, key: keys[i] });
    });

    const translated = [...texts];

    if (process.env.NODE_ENV !== "production") {
      console.log("[DEBUG] Misses count:", misses.length);
      console.log(
        "[DEBUG] Will call Google API?",
        enabled && !cacheOnly && misses.length > 0
      );
    }

    // If enabled and not cache-only, call Google for misses
    if (enabled && !cacheOnly && misses.length > 0) {
      console.log(
        "[Translation] Calling Google API for",
        misses.length,
        "texts"
      );

      const batch = await translateBatch({
        texts: misses.map((m) => m.text),
        source,
        target,
      });

      console.log(
        "[Translation] API returned:",
        Array.isArray(batch) ? `len=${batch.length}` : batch
      );

      // ***** TEMP SANITY EARLY RETURN *****
      // Ensure we return a plain array of strings to the client.
      return NextResponse.json({
        texts: (Array.isArray(batch) ? batch : []).map((s) =>
          typeof s === "string" ? s : ""
        ),
      });

      // ---- REMOVE THE EARLY RETURN ABOVE ONCE VERIFIED, THEN USE MERGE BELOW ----
      // // Merge Google results into translated array in original order with fallbacks
      // misses.forEach((m, i) => {
      //   const v = Array.isArray(batch) ? batch[i] : undefined;
      //   translated[m.index] = typeof v === "string" && v.length > 0 ? v : m.text;
      // });
      // // Optional: best-effort cache write (only when not frozen)
      // const toStore = misses.map((m, i) => ({
      //   key: m.key,
      //   source,
      //   target,
      //   namespace,
      //   sourceText: m.text,
      //   translatedText:
      //     Array.isArray(batch) && typeof batch[i] === "string" && batch[i]
      //       ? (batch[i] as string)
      //       : m.text,
      // }));
      // await putCached(toStore);
    }

    // Fill from cache (hits)
    texts.forEach((_, i) => {
      const v = cached[keys[i]];
      if (v) translated[i] = v;
    });

    // Final guards to ensure stable shape
    if (!Array.isArray(translated)) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[Translation][WARN] translated not array, coercing");
      }
      const coerced = texts.map((t, i) => (translated as any)?.[i] ?? t);
      return NextResponse.json({ texts: coerced });
    }

    if (translated.length !== texts.length) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[Translation][WARN] length mismatch", {
          in: texts.length,
          out: translated.length,
        });
      }
      const fixed = texts.map((t, i) => translated[i] ?? t);
      return NextResponse.json({ texts: fixed });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[Translation] Returning texts length:", translated.length);
    }
    return NextResponse.json({ texts: translated });
  } catch (err) {
    // Fallback to original strings on any error
    try {
      const { texts } = (await req.json()) as { texts: string[] };
      return NextResponse.json({ texts });
    } catch {
      return NextResponse.json({ texts: [] });
    }
  }
}
