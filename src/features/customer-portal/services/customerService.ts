"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useSocket } from "@/hooks/useSocket";

/**
 * Service Layer for Customer Portal Feature
 * Encapsulates all tRPC queries and mutations for customer ordering, visits & menu.
 */
export function useCustomerService({
  isMenuStep,
  guestName,
  visitId,
  langSelected,
  step,
}: {
  isMenuStep: boolean;
  guestName: string;
  visitId: number | null;
  langSelected: boolean;
  step: string;
}) {
  const socket = useSocket();

  // Queries
  const configQuery = trpc.hotel.getSystemConfig.useQuery(undefined, {
    refetchInterval: 10000,
  });

  const showCustomerQueue = configQuery.data?.showCustomerQueue ?? true;

  const menuQuery = trpc.hotel.getMenu.useQuery(undefined, {
    enabled: isMenuStep,
  });

  const ordersQuery = trpc.hotel.getCustomerOrders.useQuery(
    { customerName: guestName },
    { enabled: isMenuStep && !!guestName, refetchInterval: 8000 }
  );

  const visitStatusQuery = trpc.visit.getVisitStatus.useQuery(
    { visitId: visitId ?? 0 },
    { enabled: langSelected && visitId !== null && step === "name", retry: false }
  );

  const kitchenQueueQuery = trpc.hotel.getLiveKitchenQueueToday.useQuery(undefined, {
    enabled: isMenuStep && showCustomerQueue,
    refetchInterval: 4000,
  });

  // Real-time WebSocket Listeners for Instant Live Kitchen Queue & Order Updates
  useEffect(() => {
    if (!socket || typeof socket.on !== "function") return;

    const handleUpdate = () => {
      kitchenQueueQuery.refetch();
      ordersQuery.refetch();
    };

    socket.on("order:created", handleUpdate);
    socket.on("order:preparing", handleUpdate);
    socket.on("order:ready", handleUpdate);
    socket.on("order:served", handleUpdate);
    socket.on("order:cancelled", handleUpdate);
    socket.on("order:accepted", handleUpdate);
    socket.on("kitchen:item:updated", handleUpdate);

    return () => {
      socket.off("order:created", handleUpdate);
      socket.off("order:preparing", handleUpdate);
      socket.off("order:ready", handleUpdate);
      socket.off("order:served", handleUpdate);
      socket.off("order:cancelled", handleUpdate);
      socket.off("order:accepted", handleUpdate);
      socket.off("kitchen:item:updated", handleUpdate);
    };
  }, [socket, kitchenQueueQuery, ordersQuery]);

  // Mutations
  const createGuestMutation = trpc.guest.createGuest.useMutation();
  const openVisitMutation = trpc.visit.openVisit.useMutation();
  const resumeVisitMutation = trpc.visit.resumeVisit.useMutation();
  const placeOrderMutation = trpc.hotel.placeOrder.useMutation();
  const cancelOrderItemMutation = trpc.hotel.cancelOrderItem.useMutation();

  return {
    systemConfig: configQuery.data,
    showCustomerQueue,
    menu: menuQuery.data,
    menuLoading: menuQuery.isLoading,
    myOrders: ordersQuery.data,
    ordersLoading: ordersQuery.isLoading,
    refetchOrders: () => {
      ordersQuery.refetch();
      kitchenQueueQuery.refetch();
    },
    kitchenQueue: kitchenQueueQuery.data,
    kitchenQueueLoading: kitchenQueueQuery.isLoading,
    visitStatus: visitStatusQuery.data,
    isVisitStatusPending: visitStatusQuery.isLoading,

    createGuest: createGuestMutation.mutateAsync,
    isCreatingGuest: createGuestMutation.isPending,

    openVisit: openVisitMutation.mutateAsync,
    isOpeningVisit: openVisitMutation.isPending,

    resumeVisit: resumeVisitMutation.mutateAsync,
    isResumingVisit: resumeVisitMutation.isPending,

    placeOrder: placeOrderMutation.mutateAsync,
    isPlacingOrder: placeOrderMutation.isPending,

    cancelOrderItem: cancelOrderItemMutation.mutateAsync,
    isCancellingItem: cancelOrderItemMutation.isPending,
  };
}
