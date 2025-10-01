export type PageResp<T> = {
  ok: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  message?: string;
};

export async function getProducts<T = any>(params: {
  page?: number;
  pageSize?: number;
  q?: string;
  region?: string;
  owner?: "supplier" | "admin";
}) {
  const url = new URL("/api/products", window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) {
      url.searchParams.set(k, String(v));
    }
  });
  const r = await fetch(url.toString(), { credentials: "include" });
  if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
  return (await r.json()) as PageResp<T>;
}
