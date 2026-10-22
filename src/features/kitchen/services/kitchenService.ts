"use client";

import { trpc } from "@/lib/trpc";

/**
 * Service Layer for Kitchen (KDS) Feature
 * Encapsulates all tRPC queries and item-level prep mutations.
 */
export function useKitchenService() {
  const ordersQuery = trpc.hotel.getOrders.useQuery(undefined, {
    refetchInterval: 15000,
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
