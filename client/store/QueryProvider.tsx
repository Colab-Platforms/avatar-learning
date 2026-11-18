"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { store } from "@/store";

// Clears cached query results (e.g. an unauthenticated /direct2hire/me
// fetched before login) whenever the logged-in user changes, so a stale
// pre-login cache entry can't leak into the post-login render.
function QueryCacheAuthSync({ queryClient }: { queryClient: QueryClient }) {
  const prevUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    return store.subscribe(() => {
      const { user, hasHydrated } = store.getState().auth;
      if (!hasHydrated) return;

      const userId = user?.id ?? null;
      if (prevUserId.current === undefined) {
        prevUserId.current = userId;
        return;
      }
      if (prevUserId.current !== userId) {
        prevUserId.current = userId;
        queryClient.clear();
      }
    });
  }, [queryClient]);

  return null;
}

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 60 * 1000, // 10 min
            gcTime: 30 * 60 * 1000, // 30 min
            retry: 2,
            refetchOnWindowFocus: false,
            // refetchOnReconnect: true,
            // refetchOnMount: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <QueryCacheAuthSync queryClient={queryClient} />
      {children}
    </QueryClientProvider>
  );
}
