"use client";

import { trpc } from "@/lib/trpc";

/**
 * Service Layer for Waiter Feature
 * Encapsulates all tRPC queries and item serving mutations.
 */
export function useWaiterService() {
  const ordersQuery = trpc.hotel.getOrders.useQuery(undefined, {
    refetchInterval: 15000,
    retry: 2,
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
