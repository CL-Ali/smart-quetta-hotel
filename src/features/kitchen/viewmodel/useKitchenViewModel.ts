"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";
import { getDashboardPin } from "@/lib/dashboardAuth";
import { useKitchenService } from "../services/kitchenService";

/**
 * ViewModel for Kitchen Display System (KDS) Feature (MVVM)
 * Orchestrates KitchenService, item checklist states, and realtime sockets.
 */
export function useKitchenViewModel() {
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());
  const [pinUnlocked, setPinUnlocked] = useState(() => !!getDashboardPin());
  const pinErrorRef = useRef<((msg: string) => void) | null>(null);

  // ── Service Layer Hook ───────────────────────────────────────────────────
  const service = useKitchenService({
    pinUnlocked,
    onAuthError: () => {
      setPinUnlocked(false);
      pinErrorRef.current?.("Incorrect PIN — try again");
    },
  });

  // Realtime Socket Sync
  const socket = useSocket();
  useEffect(() => {
    const handler = () => service.refetch();
    socket.on("order.created", handler);
    socket.on("order.updated", handler);
    socket.on("kitchen.ready", handler);
    return () => {
      socket.off("order.created", handler);
      socket.off("order.updated", handler);
      socket.off("kitchen.ready", handler);
    };
  }, [socket, service.refetch]);

  const toggleExpand = (id: number) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleItemAction = async (itemId: number, currentStatus: string) => {
    const next =
      currentStatus === "pending"
        ? "preparing"
        : currentStatus === "preparing"
        ? "ready"
        : null;

    if (!next) return;

    setLoadingItems((prev) => new Set(prev).add(itemId));
    try {
      await service.updateItemStatus({ itemId, kitchenStatus: next as any });
      service.refetch();
      toast.success(next === "preparing" ? "Cooking started" : "Item ready ✓");
    } catch {
      toast.error("Failed");
    } finally {
      setLoadingItems((prev) => {
        const n = new Set(prev);
        n.delete(itemId);
        return n;
      });
    }
  };

  const handleMarkAllReady = async (activeItems: any[]) => {
    const itemIds = activeItems
      .filter((i: any) => i.kitchenStatus === "pending" || i.kitchenStatus === "preparing")
      .map((i: any) => i.id);

    setLoadingItems((prev) => {
      const n = new Set(prev);
      itemIds.forEach((id) => n.add(id));
      return n;
    });

    try {
      for (const item of activeItems) {
        if (item.kitchenStatus === "pending" || item.kitchenStatus === "preparing") {
          await service.updateItemStatus({ itemId: item.id, kitchenStatus: "ready" });
        }
      }
      service.refetch();
      toast.success("All items marked ready");
    } catch {
      toast.error("Failed");
    } finally {
      setLoadingItems((prev) => {
        const n = new Set(prev);
        itemIds.forEach((id) => n.delete(id));
        return n;
      });
    }
  };

  const handleUnlockPin = (onErr: (msg: string) => void) => {
    pinErrorRef.current = onErr;
    setPinUnlocked(true);
  };

  // Orders with at least one active (unserved) item
  const activeOrders = (service.orders ?? []).filter(
    (o) =>
      (o.status === "pending" || o.status === "preparing" || o.status === "ready") &&
      o.items?.some((i: any) => i.kitchenStatus !== "served")
  );

  // Group by customer
  const groupedOrders = activeOrders.reduce<Record<string, typeof activeOrders>>(
    (acc, order) => {
      const key = order.customerName ?? `#${order.id}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(order);
      return acc;
    },
    {}
  );

  return {
    pinUnlocked,
    isLoading: service.isLoading,
    activeOrders,
    groupedOrders,
    expandedOrders,
    loadingItems,
    isMutating: service.isMutating,
    handleUnlockPin,
    toggleExpand,
    handleItemAction,
    handleMarkAllReady,
  };
}
