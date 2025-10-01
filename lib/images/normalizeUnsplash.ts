export function normalizeUnsplash(url: string): string {
  try {
    if (!url || typeof url !== "string") return url;
    const u = new URL(url);
    if (u.hostname !== "images.unsplash.com") return url;

    // Ensure canonical params
    if (!u.searchParams.has("auto")) u.searchParams.set("auto", "format");
    if (!u.searchParams.has("fit")) u.searchParams.set("fit", "crop");
    if (!u.searchParams.has("crop")) u.searchParams.set("crop", "entropy");
    if (!u.searchParams.has("w")) u.searchParams.set("w", "800");
    if (!u.searchParams.has("h")) u.searchParams.set("h", "800");
    if (!u.searchParams.has("q")) u.searchParams.set("q", "80");

    // Rebuild
    return `${u.origin}${u.pathname}?${u.searchParams.toString()}`;
  } catch {
    return url;
  }
}

export function normalizeAll(images: string[] | undefined | null): string[] {
  if (!Array.isArray(images)) return [];
  return images.map((img) => normalizeUnsplash(String(img).trim()));
}
