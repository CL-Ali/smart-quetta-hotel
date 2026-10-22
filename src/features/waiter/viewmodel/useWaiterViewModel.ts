"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";
import { useWaiterService } from "../services/waiterService";

/**
 * ViewModel for Waiter Delivery System Feature (MVVM)
 * Orchestrates WaiterService, table order grouping, and partial delivery actions.
 */
export function useWaiterViewModel() {
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [serving, setServing] = useState<Set<number>>(new Set());

  // ── Service Layer Hook ───────────────────────────────────────────────────
  const service = useWaiterService();

  // Realtime Socket Sync
  const socket = useSocket();
  useEffect(() => {
    const handler = () => service.refetch();
    socket.on("kitchen.ready", handler);
    socket.on("order.updated", handler);
    socket.on("order.created", handler);
    return () => {
      socket.off("kitchen.ready", handler);
      socket.off("order.updated", handler);
      socket.off("order.created", handler);
    };
  }, [socket, service.refetch]);

  const toggleExpand = (id: number) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleServeItem = async (itemId: number, qty: number) => {
    setServing((prev) => new Set(prev).add(itemId));
    try {
      await service.updateItemStatus({
        itemId,
        kitchenStatus: "served",
        serveQty: qty,
      });
      service.refetch();
      toast.success("Item served");
    } catch {
      toast.error("Failed");
    } finally {
      setServing((prev) => {
        const n = new Set(prev);
        n.delete(itemId);
        return n;
      });
    }
  };

  const handleServeAll = async (order: any) => {
    const readyItems = order.items?.filter((i: any) => i.kitchenStatus === "ready") ?? [];
    for (const item of readyItems) {
      await handleServeItem(item.id, item.quantity - (item.servedQty ?? 0));
    }
  };

  // Orders with at least one ready item
  const withReady = (service.orders ?? []).filter((o) =>
    o.items?.some((i: any) => i.kitchenStatus === "ready")
  );

  // Recently fully served (last 8)
  const recentServed = (service.orders ?? [])
    .filter((o) => o.status === "served" || o.status === "paid")
    .slice(0, 8);

  // Group ready orders by customer
  const groupedReady = withReady.reduce<Record<string, typeof withReady>>((acc, order) => {
    const key = order.customerName ?? `#${order.id}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(order);
    return acc;
  }, {});

  return {
    isLoading: service.isLoading,
    withReady,
    recentServed,
    groupedReady,
    expandedOrders,
    serving,
    showNewOrder,
    setShowNewOrder,
    toggleExpand,
    handleServeItem,
    handleServeAll,
    refetch: service.refetch,
  };
}
