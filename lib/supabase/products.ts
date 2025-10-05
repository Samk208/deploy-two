// Minimal shape to avoid tight coupling in tests and external types
export type ProductQuery = any;

export interface ProductQueryResult<T = any> {
  data: T[] | null;
  error: any;
  count: number | null;
}

/**
 * Executes a products query with stable ordering/pagination.
 * Tests can mock this function to avoid changing production code paths.
 */
export async function executeProductQuery<T = any>(
  query: ProductQuery,
  from: number,
  to: number
): Promise<ProductQueryResult<T>> {
  // If query has order/range (normal Supabase builder)
  if (query && typeof (query as any).order === "function") {
    const resp = await (query as any).order("created_at", { ascending: false }).range(from, to);
    return { data: resp.data ?? null, error: resp.error ?? null, count: resp.count ?? null };
  }
  // Fallback: treat as already-resolved/mocked response
  const resp = await (query as any);
  const data = resp?.data ?? null;
  return {
    data,
    error: resp?.error ?? null,
    count: resp?.count ?? (Array.isArray(data) ? data.length : null),
  };
}
