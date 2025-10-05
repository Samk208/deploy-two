import { QueryClient, dehydrate } from "@tanstack/react-query";
import QueryProvider from "@/app/providers/query-provider";

export default async function Page() {
  const qc = new QueryClient();
  await qc.prefetchQuery({
    queryKey: ["supplier-dashboard"],
    queryFn: async () => {
      const baseCandidate =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL;
      if (!baseCandidate) {
        throw new Error(
          "Missing site URL env var: set NEXT_PUBLIC_APP_URL or APP_URL or NEXT_PUBLIC_SITE_URL"
        );
      }
      const base = baseCandidate.replace(/\/$/, "");
      const url = `${base}/api/dashboard/supplier`;
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
