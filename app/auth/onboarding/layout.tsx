import React from "react";
import FreezeBanner from "@/components/FreezeBanner";
import { isFrozen } from "@/components/isFrozen";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FreezeBanner />
      <div className={isFrozen ? "pointer-events-none select-none opacity-95" : ""}>
        {children}
      </div>
    </>
  );
}
