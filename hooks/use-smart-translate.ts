"use client";

import { useEffect, useState } from "react";
import { requestTranslation } from "@/lib/translation/batcher";

export function useTranslate() {
  async function t(text: string, opts?: { namespace?: string; fallback?: string }) {
    try {
      const v = await requestTranslation(text, opts?.namespace);
      return v || opts?.fallback || text;
    } catch {
      return opts?.fallback || text;
    }
  }
  return { t } as const;
}
