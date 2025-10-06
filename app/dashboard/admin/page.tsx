import { redirect } from "next/navigation";

export default function Page() {
  // Consolidate legacy route to canonical admin dashboard
  redirect("/admin/dashboard");
}
