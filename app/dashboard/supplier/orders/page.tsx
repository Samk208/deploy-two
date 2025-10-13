import { QueryClient, dehydrate } from "@tanstack/react-query";
import QueryProvider from "@/app/providers/query-provider";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

  // Determine if current viewer is admin to show a visual banner only
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  let isAdmin = false;
  if (session?.user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();
    isAdmin = (profile as any)?.role === "admin";
  }

  return (
    <QueryProvider state={state}>
      {isAdmin && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900 text-sm">
          Admin view: Supplier Orders. Writes are disabled while freeze is on.
        </div>
      )}
      <OrdersClient />
    </QueryProvider>
  );
}
