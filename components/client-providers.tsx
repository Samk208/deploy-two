"use client";

import { useCartStore } from "@/lib/store/cart";
import { useEffect } from "react";
import { Toaster } from "sonner";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  // Ensure persisted Zustand stores are rehydrated on the client to avoid SSR mismatches
  useEffect(() => {
    try {
      // Zustand persist API is attached on the store function
      // skipHydration is enabled in the store, so we trigger manual rehydrate here
      useCartStore.persist?.rehydrate?.();
    } catch (_) {
      // no-op
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register a basic service worker for installability/offline cache
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => {
          if (!reg) {
            return navigator.serviceWorker.register("/sw.js");
          }
          return reg;
        })
        .catch(() => {
          // no-op
        });
    }
  }, []);

  return (
    <>
      {/* Global toast UI for feedback (used by cart actions) */}
      <Toaster richColors position="top-right" />
      {children}
    </>
  );
}
