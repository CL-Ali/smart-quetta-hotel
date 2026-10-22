"use client";

import { trpc } from "@/lib/trpc";

/**
 * Service Layer for Dashboard Feature
 * Encapsulates all tRPC queries and mutations for orders, stock, cash reports, and guests.
 */
export function useDashboardService() {
  const ordersQuery = trpc.hotel.getOrders.useQuery(undefined, {
    refetchInterval: 15000,
  });

  const stockQuery = trpc.hotel.getStock.useQuery(undefined);

  const cashQuery = trpc.hotel.getCashReport.useQuery(undefined, {
    refetchInterval: 15000,
  });

  const guestsQuery = trpc.guest.getGuests.useQuery(undefined, {
    refetchInterval: 30000,
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
