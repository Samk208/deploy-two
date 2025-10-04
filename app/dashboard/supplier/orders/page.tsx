import { QueryClient, dehydrate } from "@tanstack/react-query";
import QueryProvider from "@/app/providers/query-provider";

export default async function Page() {
  const qc = new QueryClient();
  await qc.prefetchQuery({
    queryKey: ["supplier-dashboard"],
    queryFn: async () => {
      const base =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "http://localhost:3000";
      const url = `${base.replace(/\/$/, "")}/api/dashboard/supplier`;
      const r = await fetch(url, { cache: "no-store" });
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
