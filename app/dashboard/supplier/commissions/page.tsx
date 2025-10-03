import { QueryClient, dehydrate } from "@tanstack/react-query";
import QueryProvider from "@/app/providers/query-provider";
import type { CommissionsFilters } from "@/components/dashboard/commissions/client";

export default async function Page() {
  const qc = new QueryClient();
  const defaultFilters: CommissionsFilters = { owner: "supplier", status: "pending", page: 1, pageSize: 20 };

  await qc.prefetchQuery({
    queryKey: ["commissions", defaultFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(defaultFilters).forEach(([k, v]) => params.set(k, String(v)));
      const r = await fetch(`/api/commissions?${params.toString()}`, { cache: "no-store" });
      if (!r.ok) throw new Error("fetch commissions failed");
      return r.json();
    },
  });

  const state = dehydrate(qc);
  const CommissionsClient = (await import("@/components/dashboard/commissions/client")).default;

  return (
    <QueryProvider state={state}>
      <CommissionsClient defaultFilters={defaultFilters} />
    </QueryProvider>
  );
}
