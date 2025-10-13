import { QueryClient, dehydrate } from "@tanstack/react-query";
import QueryProvider from "@/app/providers/query-provider";
import type { CommissionsFilters } from "@/components/dashboard/commissions/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function Page() {
  const qc = new QueryClient();
  const defaultFilters: CommissionsFilters = { owner: "supplier", status: "pending", page: 1, pageSize: 20 };
  await qc.prefetchQuery({
    queryKey: ["commissions", defaultFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(defaultFilters).forEach(([k, v]) => params.set(k, String(v)));
      const base = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const url = `${base.replace(/\/$/, "")}/api/commissions?${params.toString()}`;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) {
        let info = "";
        try {
          info = await r.text();
        } catch (e: any) {
          info = `Failed to read response body: ${e?.message || String(e)}`;
        }
        throw new Error(
          `fetch commissions failed: ${r.status} ${r.statusText || ""} ${info ? "- " + info : ""}`.trim()
        );
      }
      return r.json();
    },
  });

  const state = dehydrate(qc);
  const CommissionsClient = (await import("@/components/dashboard/commissions/client")).default;

  // Server-side role check to display an admin view banner only
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
          Admin view: Supplier Commissions. Writes are disabled while freeze is on.
        </div>
      )}
      <CommissionsClient defaultFilters={defaultFilters} />
    </QueryProvider>
  );
}
