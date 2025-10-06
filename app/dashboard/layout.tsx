import React, { Suspense } from "react";
import FreezeBanner from "@/components/FreezeBanner";
import { isFrozen } from "@/components/isFrozen";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Dashboard - One-Link",
  description: "Manage your One-Link account and products",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FreezeBanner />
      <div className={isFrozen ? "pointer-events-none select-none opacity-95" : ""}>
        {children}
      </div>
    </Suspense>
  );
}
