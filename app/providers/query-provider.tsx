"use client";
import { QueryClient, QueryClientProvider, HydrationBoundary, type DehydratedState } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export default function QueryProvider({ children, state }: { children: ReactNode; state?: DehydratedState | null }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <HydrationBoundary state={state}>{children}</HydrationBoundary>
    </QueryClientProvider>
  );
}
