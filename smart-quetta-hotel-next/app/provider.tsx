"use client";

import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { getLoginUrl } from "./const";
import { getDashboardPin } from "@/lib/dashboardAuth";

const redirectToLoginIfUnauthorized = (error: unknown) => {
    if (!(error instanceof TRPCClientError)) return;
    if (typeof window === "undefined") return;
    if (error.message !== UNAUTHED_ERR_MSG) return;
    window.location.href = getLoginUrl();
};

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => {
        const qc = new QueryClient();
        qc.getQueryCache().subscribe(event => {
            if (event.type === "updated" && event.action.type === "error") {
                redirectToLoginIfUnauthorized(event.query.state.error);
            }
        });
        qc.getMutationCache().subscribe(event => {
            if (event.type === "updated" && event.action.type === "error") {
                redirectToLoginIfUnauthorized(event.mutation.state.error);
            }
        });
        return qc;
    });

    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    url: "/api/trpc",
                    transformer: superjson,
                    headers() {
                        const pin = getDashboardPin();
                        return pin ? { "x-dashboard-pin": pin } : {};
                    },
                    fetch(input, init) {
                        return globalThis.fetch(input, { ...(init ?? {}), credentials: "include" });
                    },
                }),
            ],
        })
    );

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </trpc.Provider>
    );
}