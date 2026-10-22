"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";
import { useDashboardService } from "../services/dashboardService";

export type DashboardTab = "orders" | "stock" | "guests" | "products" | "department";

/**
 * ViewModel for Cashier & POS Terminal Dashboard (MVVM)
 * Orchestrates DashboardService, realtime socket sync, and UI states.
 */
export function useDashboardViewModel() {
  const [tab, setTab] = useState<DashboardTab>("orders");
  const [payOrder, setPayOrder] = useState<any>(null);
  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);

  // ── Service Layer Hook ───────────────────────────────────────────────────
  const service = useDashboardService();

  // Realtime Socket Sync
  const socket = useSocket();
  useEffect(() => {
    const onOrderChange = () => service.refetchOrders();
    const onPayment = () => {
      service.refetchOrders();
      service.refetchCash();
    };

    socket.on("order.created", onOrderChange);
    socket.on("order.updated", onOrderChange);
    socket.on("kitchen.ready", onOrderChange);
    socket.on("payment.received", onPayment);

    return () => {
      socket.off("order.created", onOrderChange);
      socket.off("order.updated", onOrderChange);
      socket.off("kitchen.ready", onOrderChange);
      socket.off("payment.received", onPayment);
    };
  }, [socket, service.refetchOrders, service.refetchCash]);

  // Derived metrics
  const unpaidCount = (service.orders ?? []).filter(
    (o) => o.paymentStatus !== "paid" && o.status !== "cancelled"
  ).length;
  const pendingCount = (service.orders ?? []).filter(
    (o) => o.status === "pending" || o.status === "preparing"
  ).length;
  const readyCount = (service.orders ?? []).filter((o) => o.status === "ready").length;

  // Handlers
  const handleConfirmCancel = async (id: number) => {
    try {
      await service.updateOrderStatus({ orderId: id, status: "cancelled" });
      service.refetchOrders();
      toast.success("Order cancelled");
    } catch {
      toast.error("Failed to cancel order");
    }
  };

  const handleSaveStock = async (
    id: number,
    values: { total: number; inUse: number; broken: number }
  ) => {
    try {
      await service.updateStock({
        stockId: id,
        totalQuantity: values.total,
        inUse: values.inUse,
        broken: values.broken,
      });
      toast.success("Stock updated");
      service.refetchStock();
    } catch {
      toast.error("Failed to update stock");
    }
  };

  return {
    // State
    tab,
    payOrder,
    cancelOrderId,
    showNewOrder,
    ordersLoading: service.ordersLoading,
    orders: service.orders ?? [],
    stockData: service.stockData ?? [],
    stockLoading: service.stockLoading,
    isUpdatingStock: service.isUpdatingStock,
    cash: service.cash,
    guestsData: service.guestsData ?? [],
    guestsLoading: service.guestsLoading,
    unpaidCount,
    pendingCount,
    readyCount,

    // Actions
    setTab,
    setPayOrder,
    setCancelOrderId,
    setShowNewOrder,
    handleConfirmCancel,
    handleSaveStock,
    refetchOrders: service.refetchOrders,
    refetchCash: service.refetchCash,
  };
}
