"use client";

import { trpc } from "@/lib/trpc";
import { clearDashboardPin } from "@/lib/dashboardAuth";

/**
 * Service Layer for Dashboard Feature
 * Encapsulates all tRPC queries and mutations for orders, stock, cash reports, and guests.
 */
export function useDashboardService({
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

  const stockQuery = trpc.hotel.getStock.useQuery(undefined, {
    enabled: pinUnlocked,
  });

  const cashQuery = trpc.hotel.getCashReport.useQuery(undefined, {
    refetchInterval: 15000,
    enabled: pinUnlocked,
  });

  const guestsQuery = trpc.guest.getGuests.useQuery(undefined, {
    refetchInterval: 30000,
    enabled: pinUnlocked,
  });

  const updateStatusMutation = trpc.hotel.updateOrderStatus.useMutation();
  const updateStockMutation = trpc.hotel.updateStock.useMutation();
  const recordPaymentMutation = trpc.hotel.recordPayment.useMutation();

  return {
    orders: ordersQuery.data,
    ordersLoading: ordersQuery.isLoading,
    refetchOrders: ordersQuery.refetch,

    stockData: stockQuery.data,
    stockLoading: stockQuery.isLoading,
    refetchStock: stockQuery.refetch,

    cash: cashQuery.data,
    refetchCash: cashQuery.refetch,

    guestsData: guestsQuery.data,
    guestsLoading: guestsQuery.isLoading,
    refetchGuests: guestsQuery.refetch,

    updateOrderStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,

    updateStock: updateStockMutation.mutateAsync,
    isUpdatingStock: updateStockMutation.isPending,

    recordPayment: recordPaymentMutation.mutateAsync,
    isRecordingPayment: recordPaymentMutation.isPending,
  };
}
