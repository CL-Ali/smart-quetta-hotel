"use client";

import { trpc } from "@/lib/trpc";
import { clearDashboardPin } from "@/lib/dashboardAuth";

/**
 * Service Layer for Kitchen (KDS) Feature
 * Encapsulates all tRPC queries and item-level prep mutations.
 */
export function useKitchenService({
  pinUnlocked,
  onAuthError,
}: {
  pinUnlocked: boolean;
  onAuthError: () => void;
}) {
  const ordersQuery = trpc.hotel.getOrders.useQuery(undefined, {
    refetchInterval: 15000,
    enabled: pinUnlocked,
    retry: (failureCount: number, err: any) => {
      if (err?.data?.code === "UNAUTHORIZED") {
        clearDashboardPin();
        onAuthError();
        return false;
      }
      return failureCount < 2;
    },
  });

  const updateItemStatusMutation = trpc.hotel.updateItemStatus.useMutation();

  return {
    orders: ordersQuery.data,
    isLoading: ordersQuery.isLoading,
    refetch: ordersQuery.refetch,

    updateItemStatus: updateItemStatusMutation.mutateAsync,
    isMutating: updateItemStatusMutation.isPending,
  };
}
