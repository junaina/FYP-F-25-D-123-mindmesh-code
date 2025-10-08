"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// (optional) devtools — remove if you don't want it
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // create the client once (per browser session)
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // tweak as you like:
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      {/* {process.env.NODE_ENV !== "production" ? <ReactQueryDevtools initialIsOpen={false} /> : null} */}
    </QueryClientProvider>
  );
}
