import { QueryClient, dehydrate } from "@tanstack/react-query";
import QueryProvider from "@/app/providers/query-provider";

export default async function Page() {
  const qc = new QueryClient();
  await qc.prefetchQuery({
    queryKey: ["supplier-dashboard"],
    queryFn: async () => {
      const r = await fetch(`/api/dashboard/supplier`, { cache: "no-store" });
      if (!r.ok) throw new Error("dashboard fetch failed");
      return r.json();
    },
  });
  const state = dehydrate(qc);
  const OrdersClient = (await import("@/components/dashboard/orders/client")).default;
  return (
    <QueryProvider state={state}>
      <OrdersClient />
    </QueryProvider>
  );
}
