"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: (failureCount, error: any) => {
              if (typeof window !== "undefined" && !navigator.onLine) {
                return false;
              }
              // Don't retry 401/403s
              if (error?.status === 401 || error?.status === 403) return false;
              return failureCount < 3;
            },
            refetchOnWindowFocus: () => typeof window !== "undefined" && navigator.onLine,
            refetchOnReconnect: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
