"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

/**
 * DryRunBanner
 *
 * Displays a warning banner when onboarding is in dry-run mode (freezes active).
 * Shows at the top of onboarding pages to inform users that submissions won't persist.
 */
export function DryRunBanner() {
  // Check client-side freeze flags
  const isDryRun =
    process.env.NEXT_PUBLIC_CORE_FREEZE === "true" ||
    process.env.NEXT_PUBLIC_DRY_RUN_ONBOARDING === "true";

  if (!isDryRun) return null;

  return (
    <Alert variant="destructive" className="mb-6 border-yellow-500 bg-yellow-50 text-yellow-900">
      <AlertCircle className="h-5 w-5 text-yellow-600" />
      <AlertTitle className="font-semibold text-yellow-900">
        Onboarding in DRY-RUN Mode
      </AlertTitle>
      <AlertDescription className="text-yellow-800">
        The system is currently in freeze mode for safety. Your onboarding submission will be
        validated but <strong>no data will be saved</strong>. You will see what would happen
        without actually making changes to the database.
      </AlertDescription>
    </Alert>
  );
}
