import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SupplierSettingsPage() {
  // Server-side role lookup to render an admin-view banner only
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
    <div className="space-y-4">
      {isAdmin && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900 text-sm">
          Admin view: Supplier Settings. Writes are disabled while freeze is on.
        </div>
      )}
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-muted-foreground">Supplier settings page placeholder. Configure supplier-specific preferences here.</p>
    </div>
  );
}
