"use client";

import { useState, useEffect, useRef } from "react";
import React from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Loader2,
  Package,
  Hotel,
  ClipboardList,
  Utensils,
  Users,
  Folder,
} from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import { NewOrderSheet } from "@/components/NewOrderSheet";
import { useSocket } from "@/hooks/useSocket";
import { DashboardPinGate } from "@/components/DashboardPinGate";
import { getDashboardPin, clearDashboardPin } from "@/lib/dashboardAuth";

// Sub-components
import { ProductsTab } from "./Dashboard/ProductsTab";
import { DepartmentsTab } from "./Dashboard/DepartmentsTab";
import { PaymentSheet } from "./Dashboard/PaymentSheet";
import { DashboardKpis } from "./Dashboard/DashboardKpis";
import { OrdersTab } from "./Dashboard/OrdersTab";
import { GuestsTab } from "./Dashboard/GuestsTab";
import { StockTab } from "./Dashboard/StockTab";
import { CancelOrderModal } from "./Dashboard/CancelOrderModal";

type DashboardTab = "orders" | "stock" | "guests" | "products" | "department";

/**
 * Main Cashier & Admin Dashboard for Smart Quetta Hotel
 */
export default function Dashboard() {
  const { t } = useLang();
  const [tab, setTab] = useState<DashboardTab>("orders");
  const [payOrder, setPayOrder] = useState<any>(null);
  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);

  // ── PIN Lock Security ──────────────────────────────────────────────────────
  const [pinUnlocked, setPinUnlocked] = useState(() => !!getDashboardPin());
  const pinErrorRef = useRef<((msg: string) => void) | null>(null);

  // ── tRPC Data Queries ──────────────────────────────────────────────────────
  const { data: orders, isLoading, refetch: refetchOrders } =
    trpc.hotel.getOrders.useQuery(undefined, {
      refetchInterval: 15000,
      enabled: pinUnlocked,
      retry: (failureCount: number, err: any) => {
        if (err?.data?.code === "UNAUTHORIZED") {
          clearDashboardPin();
          setPinUnlocked(false);
          pinErrorRef.current?.("Incorrect PIN — try again");
          return false;
        }
        return failureCount < 2;
      },
    });

  const { data: stockData, refetch: refetchStock } = trpc.hotel.getStock.useQuery(
    undefined,
    { enabled: pinUnlocked }
  );

  const { data: cash, refetch: refetchCash } = trpc.hotel.getCashReport.useQuery(
    undefined,
    { refetchInterval: 15000, enabled: pinUnlocked }
  );

  const { data: guestsData, isLoading: guestsLoading } = trpc.guest.getGuests.useQuery(
    undefined,
    { refetchInterval: 30000, enabled: pinUnlocked }
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const updateStatus = trpc.hotel.updateOrderStatus.useMutation();
  const updateStock = trpc.hotel.updateStock.useMutation();

  // ── Realtime Socket Synchronization ───────────────────────────────────────
  const socket = useSocket();
  useEffect(() => {
    const onOrderChange = () => refetchOrders();
    const onPayment = () => {
      refetchOrders();
      refetchCash();
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
  }, [socket, refetchOrders, refetchCash]);

  // ── Order Counts ───────────────────────────────────────────────────────────
  const unpaidCount = (orders ?? []).filter(
    (o) => o.paymentStatus !== "paid" && o.status !== "cancelled"
  ).length;
  const pendingCount = (orders ?? []).filter(
    (o) => o.status === "pending" || o.status === "preparing"
  ).length;
  const readyCount = (orders ?? []).filter((o) => o.status === "ready").length;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleConfirmCancel = async (id: number) => {
    try {
      await updateStatus.mutateAsync({ orderId: id, status: "cancelled" });
      refetchOrders();
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
      await updateStock.mutateAsync({
        stockId: id,
        totalQuantity: values.total,
        inUse: values.inUse,
        broken: values.broken,
      });
      toast.success("Stock updated ✓");
      refetchStock();
    } catch {
      toast.error("Failed to update stock");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
      </div>
    );
  }

  // ── Render PIN Gate if locked ──────────────────────────────────────────────
  if (!pinUnlocked) {
    return (
      <DashboardPinGate
        onUnlocked={(onErr) => {
          pinErrorRef.current = onErr;
          setPinUnlocked(true);
        }}
      />
    );
  }

  const TABS = [
    { key: "orders", label: t.orders, icon: ClipboardList },
    { key: "guests", label: "Guests", icon: Users },
    { key: "products", label: "Products", icon: Package },
    { key: "department", label: "Department", icon: Folder },
    { key: "stock", label: t.stock, icon: Utensils },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
              <Hotel className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">{t.hotelName}</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold leading-none">
                {t.adminPanel}
              </p>
            </div>
          </div>
          <LangSwitcher />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
        {/* KPI Banner */}
        <DashboardKpis
          cashReport={cash}
          pendingCount={pendingCount}
          readyCount={readyCount}
          unpaidCount={unpaidCount}
        />

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-gray-200/80 rounded-xl p-1 mb-4 overflow-x-auto no-scrollbar">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key as DashboardTab)}
              className={`flex-1 shrink-0 py-2 px-3 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === key ? "bg-white shadow-xs text-black" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Views */}
        {tab === "orders" && (
          <OrdersTab
            orders={orders ?? []}
            unpaidCount={unpaidCount}
            pendingCount={pendingCount}
            readyCount={readyCount}
            onNewOrder={() => setShowNewOrder(true)}
            onPayOrder={(order) => setPayOrder(order)}
            onCancelOrder={(id) => setCancelOrderId(id)}
          />
        )}

        {tab === "guests" && (
          <GuestsTab guests={guestsData} isLoading={guestsLoading} />
        )}

        {tab === "stock" && (
          <StockTab
            stockData={stockData}
            isUpdating={updateStock.isPending}
            onSaveStock={handleSaveStock}
          />
        )}

        {tab === "products" && <ProductsTab />}

        {tab === "department" && <DepartmentsTab />}
      </div>

      {/* Payment Settlement Modal */}
      {payOrder && (
        <PaymentSheet
          order={payOrder}
          open={!!payOrder}
          onClose={() => setPayOrder(null)}
          onDone={() => {
            refetchOrders();
            refetchCash();
            setPayOrder(null);
          }}
        />
      )}

      {/* Cancel Order Confirmation Modal */}
      <CancelOrderModal
        orderId={cancelOrderId}
        onClose={() => setCancelOrderId(null)}
        onConfirm={handleConfirmCancel}
      />

      {/* Quick Add Order Sheet */}
      <NewOrderSheet
        open={showNewOrder}
        onClose={() => setShowNewOrder(false)}
        onDone={() => {
          refetchOrders();
          setShowNewOrder(false);
        }}
      />
    </div>
  );
}
