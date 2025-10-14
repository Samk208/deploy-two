import React from "react";
import FreezeBanner from "@/components/FreezeBanner";
import { DryRunBanner } from "@/components/onboarding/DryRunBanner";
import { isFrozen } from "@/components/isFrozen";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FreezeBanner />
      <DryRunBanner />
      <div className={isFrozen ? "opacity-95" : ""}>
        {children}
      </div>
    </>
  );
}
