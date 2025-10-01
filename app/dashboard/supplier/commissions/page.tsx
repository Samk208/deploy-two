import { QueryClient, dehydrate } from "@tanstack/react-query";
import QueryProvider from "@/app/providers/query-provider";

export default async function Page() {
  const qc = new QueryClient();
  const defaultFilters = { owner: "supplier", status: "pending", page: 1, pageSize: 20 } as const;

  await qc.prefetchQuery({
    queryKey: ["commissions", defaultFilters],
    queryFn: async () => {
      const u = new URL("/api/commissions", "http://localhost");
      Object.entries(defaultFilters).forEach(([k, v]) => u.searchParams.set(k, String(v)));
      const r = await fetch(`/api/commissions?${u.searchParams.toString()}`, { cache: "no-store" });
      if (!r.ok) throw new Error("fetch commissions failed");
      return r.json();
    },
  });

  const state = dehydrate(qc);
  const CommissionsClient = (await import("@/components/dashboard/commissions/client")).default;

  return (
    <QueryProvider state={state}>
      <CommissionsClient defaultFilters={defaultFilters as any} />
    </QueryProvider>
  );
}
