"use client";

import { trpc } from "@/lib/trpc";
import { clearDashboardPin } from "@/lib/dashboardAuth";

/**
 * Service Layer for Waiter Feature
 * Encapsulates all tRPC queries and item serving mutations.
 */
export function useWaiterService({
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
