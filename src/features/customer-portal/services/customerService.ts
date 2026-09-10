"use client";

import { trpc } from "@/lib/trpc";

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
  // Queries
  const menuQuery = trpc.hotel.getMenu.useQuery(undefined, {
    enabled: isMenuStep,
  });

  const ordersQuery = trpc.hotel.getCustomerOrders.useQuery(
    { customerName: guestName },
    { enabled: isMenuStep && !!guestName, refetchInterval: 15000 }
  );

  const visitStatusQuery = trpc.visit.getVisitStatus.useQuery(
    { visitId: visitId ?? 0 },
    { enabled: langSelected && visitId !== null && step === "name", retry: false }
  );

  // Mutations
  const createGuestMutation = trpc.guest.createGuest.useMutation();
  const openVisitMutation = trpc.visit.openVisit.useMutation();
  const resumeVisitMutation = trpc.visit.resumeVisit.useMutation();
  const placeOrderMutation = trpc.hotel.placeOrder.useMutation();

  return {
    menu: menuQuery.data,
    menuLoading: menuQuery.isLoading,
    myOrders: ordersQuery.data,
    ordersLoading: ordersQuery.isLoading,
    refetchOrders: ordersQuery.refetch,
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
  };
}
