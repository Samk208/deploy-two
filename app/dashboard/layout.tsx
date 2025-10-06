import React, { Suspense } from "react";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Dashboard - One-Link",
  description: "Manage your One-Link account and products",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>;
}
