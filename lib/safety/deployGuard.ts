export function warnIfLocalhostInPreview() {
  try {
    const isNetlify = !!process.env.NETLIFY;
    if (!isNetlify) return; // Only warn on Netlify preview/staging

    const urls = [
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ].filter(Boolean) as string[];

    const hasLocalhost = urls.some((u) => /(^|\.)localhost(?::\d+)?/i.test(u) || /^http:\/\/127\.0\.0\.1(?::\d+)?/i.test(u) || /^http:\/\/localhost(?::\d+)?/i.test(u));

    if (hasLocalhost) {
      // eslint-disable-next-line no-console
      console.warn(
        '[deployGuard] Detected localhost URL in Netlify environment. Ensure NEXT_PUBLIC_APP_URL and Supabase URLs point to the preview/staging domains.'
      );
    }
  } catch {
    // Never throw from a guard
  }
}
