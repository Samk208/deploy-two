import type { SortKey } from "@/types/catalog";

export const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Newest", value: "new" },
  { label: "Price: Low \u2192 High", value: "price-asc" },
  { label: "Price: High \u2192 Low", value: "price-desc" },
];

export function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === "" || v === null) return;
    usp.set(k, String(v));
  });
  return usp.toString();
}
