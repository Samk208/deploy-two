import { QueryClient, dehydrate } from "@tanstack/react-query";
import QueryProvider from "@/app/providers/query-provider";

export default async function Page() {
  const qc = new QueryClient();
  await qc.prefetchQuery({
    queryKey: ["supplier-dashboard"],
    queryFn: async () => {
      // Safe: prefer relative fetch to same-origin API to avoid host header injection
      // If you need absolute URLs in some environments, set BASE_URL and validate it via env
      const base = process.env.BASE_URL?.trim();
      const useAbsolute = base && /^https?:\/\//i.test(base);
      const url = useAbsolute ? `${base}/api/dashboard/supplier` : "/api/dashboard/supplier";
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error("dashboard fetch failed");
      return r.json();
    },
  });
  const state = dehydrate(qc);
  const AnalyticsClient = (await import("@/components/dashboard/analytics/client")).default;
  return (
    <QueryProvider state={state}>
      <AnalyticsClient />
    </QueryProvider>
  );
}
