"use client"

import { useMemo } from "react"

/**
 * Hook to determine if mock data should be used instead of real API calls
 * Based on the NEXT_PUBLIC_USE_MOCKS environment variable
 */
export function useMockData(): boolean {
  return useMemo(() => {
    return process.env.NEXT_PUBLIC_USE_MOCKS === "true"
  }, [])
}
