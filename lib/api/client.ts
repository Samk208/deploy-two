export const PAGE_SIZE = 10;

export type NormalizedPage<T> = {
  ok?: boolean;
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  message?: string;
};

type RawPageResponse<T> = {
  ok?: boolean;
  data?: T[];
  products?: T[];
  items?: T[];
  total?: number;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  message?: string;
};

export type GetProductsParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  region?: string;
  owner?: "supplier" | "admin";
  baseUrl?: string; // optional explicit base URL for SSR callers
};

export async function getProducts<T = any>(
  params: GetProductsParams
): Promise<NormalizedPage<T>> {
  const { baseUrl, ...query } = params ?? {};

  // Ensure defaults
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? PAGE_SIZE;

  // Build relative or absolute URL string without using window
  const endpoint = `${baseUrl ? baseUrl.replace(/\/$/, "") : ""}/api/products`;
  const searchParams = new URLSearchParams();
  Object.entries({ ...query, page, pageSize }).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) {
      searchParams.set(k, String(v));
    }
  });
  const url = `${endpoint}?${searchParams.toString()}`;

  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
  const raw = (await r.json()) as RawPageResponse<T>;

  const items = raw.items ?? raw.data ?? raw.products ?? ([] as T[]);
  const total = (raw.total ?? raw.totalCount ?? 0) as number;
  const normalized: NormalizedPage<T> = {
    ok: raw.ok,
    items,
    total,
    page: raw.page ?? page,
    pageSize: raw.pageSize ?? pageSize,
    message: raw.message,
  };

  return normalized;
}

// Additional typed client helpers for dashboard pages

export type PageResp<T> = {
  ok: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  message?: string;
};

export async function getSupplierDashboard(baseUrl?: string) {
  const endpoint = `${baseUrl ? baseUrl.replace(/\/$/, "") : ""}/api/dashboard/supplier`;
  const r = await fetch(endpoint, { cache: "no-store", credentials: "include" as RequestCredentials });
  if (!r.ok) throw new Error("dashboard fetch failed");
  return r.json();
}

export async function getCommissions(
  params: Record<string, string | number | boolean | undefined>,
  baseUrl?: string
): Promise<PageResp<any>> {
  const isBrowser = typeof window !== "undefined";
  let url: string;
  if (isBrowser) {
    const endpoint = new URL("/api/commissions", window.location.origin);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) endpoint.searchParams.set(k, String(v));
    });
    url = endpoint.toString();
  } else {
    if (!baseUrl) throw new Error("getCommissions: baseUrl is required for SSR");
    const endpoint = new URL("/api/commissions", baseUrl.replace(/\/$/, ""));
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) endpoint.searchParams.set(k, String(v));
    });
    url = endpoint.toString();
  }
  const r = await fetch(url, { credentials: "include" as RequestCredentials });
  if (!r.ok) throw new Error("commissions fetch failed");
  return r.json() as Promise<PageResp<any>>;
}

export async function getOrderById(id: string, baseUrl?: string) {
  const endpoint = `${baseUrl ? baseUrl.replace(/\/$/, "") : ""}/api/orders/${encodeURIComponent(id)}`;
  const r = await fetch(endpoint, { credentials: "include" as RequestCredentials });
  if (!r.ok) throw new Error("order fetch failed");
  return r.json();
}
