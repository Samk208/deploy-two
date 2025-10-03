export function normalizeUnsplash(url: string): string {
  try {
    if (!url || typeof url !== "string") return "";
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
    const query = u.searchParams.toString();
    const base = `${u.origin}${u.pathname}${query ? `?${query}` : ""}`;
    return `${base}${u.hash || ""}`;
  } catch {
    return typeof url === "string" ? url : "";
  }
}

export function normalizeAll(images: string[] | undefined | null): string[] {
  if (!Array.isArray(images)) return [];
  const filtered = images.filter(
    (img): img is string => typeof img === "string" && img.trim() !== ""
  );
  return filtered.map((img) => normalizeUnsplash(img.trim()));
}
