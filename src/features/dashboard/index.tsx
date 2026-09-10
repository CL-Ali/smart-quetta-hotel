"use client";

import React from "react";
import {
  Loader2,
  Hotel,
  ClipboardList,
  Utensils,
  Users,
  Folder,
  Package,
  LayoutGrid,
} from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import { DashboardPinGate } from "@/components/DashboardPinGate";
import { NewOrderSheet } from "@/components/NewOrderSheet";

// ViewModel
import { useDashboardViewModel, DashboardTab } from "./viewmodel/useDashboardViewModel";

// Sub-components
import { PosTerminalTab } from "./components/PosTerminalTab";
import { DashboardKpis } from "./components/DashboardKpis";
import { OrdersTab } from "./components/OrdersTab";
import { PaymentSheet } from "./components/PaymentSheet";
import { GuestsTab } from "./components/GuestsTab";
import { StockTab } from "./components/StockTab";
import { CancelOrderModal } from "./components/CancelOrderModal";
import { DepartmentsTab } from "./components/DepartmentsTab";
import { ProductsTab } from "./components/ProductsTab";

/**
 * Cashier & Admin Dashboard View (MVVM)
 * Full Responsive Single-Screen 100vh Square POS Terminal
 */
export function DashboardView() {
  const { t } = useLang();
  const vm = useDashboardViewModel();

  if (vm.ordersLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
      </div>
    );
  }

  // 1. PIN Lock Guard
  if (!vm.pinUnlocked) {
    return <DashboardPinGate onUnlocked={vm.handleUnlockPin} />;
  }

  const TABS = [
    { key: "pos", label: "POS Register", icon: LayoutGrid },
    { key: "orders", label: t.orders, icon: ClipboardList, badge: vm.unpaidCount },
    { key: "guests", label: "Guests", icon: Users },
    { key: "products", label: "Products", icon: Package },
    { key: "department", label: "Department", icon: Folder },
    { key: "stock", label: t.stock, icon: Utensils },
  ];

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-gray-50/80">
      {/* ── Compact Streamlined Header Navbar ───────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-2 flex flex-col md:flex-row md:items-center justify-between shrink-0 shadow-2xs z-30 gap-2">
        {/* Brand & Right Tools Row on Mobile */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black shadow-2xs shrink-0">
              <Hotel className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-black text-gray-900 leading-none truncate">
                {t.hotelName}
              </h1>
              <p className="text-[9px] text-gray-400 uppercase tracking-wider font-extrabold leading-none mt-0.5">
                POS & Admin
              </p>
            </div>
          </div>

          {/* Mobile Right Tools */}
          <div className="flex items-center gap-1.5 md:hidden">
            <LangSwitcher />
          </div>
        </div>

        {/* Tab Switcher Pills (Horizontal Scroll on Mobile, Center Row on Desktop) */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full md:max-w-xl w-full md:w-auto">
          {TABS.map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              type="button"
              onClick={() => vm.setTab(key as DashboardTab)}
              className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition flex items-center gap-1.5 cursor-pointer select-none shrink-0 ${
                vm.tab === key
                  ? "bg-white text-gray-900 shadow-2xs font-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
              {typeof badge === "number" && badge > 0 && (
                <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Desktop Right Tools */}
        <div className="hidden md:flex items-center gap-2">
          <LangSwitcher />
        </div>
      </header>

      {/* ── Main Viewport Area (100% Height Filled, Zero Window Scroll) ──── */}
      <main className="flex-1 min-h-0 w-full px-3 sm:px-4 lg:px-6 py-2.5 overflow-hidden">
        {/* POS Tab Mode (Full Viewport Dual Pane) */}
        {vm.tab === "pos" && (
          <PosTerminalTab
            onOrderCreated={(newOrder) => {
              vm.setPayOrder(newOrder);
              vm.refetchOrders();
              vm.refetchCash();
            }}
          />
        )}

        {/* Non-POS Management Tabs (Scrollable when needed) */}
        {vm.tab !== "pos" && (
          <div className="h-full overflow-y-auto pr-1 no-scrollbar space-y-4 max-w-6xl mx-auto py-1">
            {/* KPI Banner */}
            <DashboardKpis
              cashReport={vm.cash}
              pendingCount={vm.pendingCount}
              readyCount={vm.readyCount}
              unpaidCount={vm.unpaidCount}
            />

            {vm.tab === "orders" && (
              <OrdersTab
                orders={vm.orders}
                unpaidCount={vm.unpaidCount}
                pendingCount={vm.pendingCount}
                readyCount={vm.readyCount}
                onNewOrder={() => vm.setShowNewOrder(true)}
                onPayOrder={(order) => vm.setPayOrder(order)}
                onCancelOrder={(id) => vm.setCancelOrderId(id)}
              />
            )}

            {vm.tab === "guests" && (
              <GuestsTab guests={vm.guestsData} isLoading={vm.guestsLoading} />
            )}

            {vm.tab === "stock" && (
              <StockTab
                stockData={vm.stockData}
                isUpdating={vm.isUpdatingStock}
                onSaveStock={vm.handleSaveStock}
              />
            )}

            {vm.tab === "products" && <ProductsTab />}

            {vm.tab === "department" && <DepartmentsTab />}
          </div>
        )}
      </main>

      {/* Payment Settlement Modal */}
      {vm.payOrder && (
        <PaymentSheet
          order={vm.payOrder}
          open={!!vm.payOrder}
          onClose={() => vm.setPayOrder(null)}
          onDone={() => {
            vm.refetchOrders();
            vm.refetchCash();
            vm.setPayOrder(null);
          }}
        />
      )}

      {/* Cancel Order Confirmation Modal */}
      <CancelOrderModal
        orderId={vm.cancelOrderId}
        onClose={() => vm.setCancelOrderId(null)}
        onConfirm={vm.handleConfirmCancel}
      />

      {/* Quick Add Order Sheet */}
      <NewOrderSheet
        open={vm.showNewOrder}
        onClose={() => vm.setShowNewOrder(false)}
        onDone={() => {
          vm.refetchOrders();
          vm.setShowNewOrder(false);
        }}
      />
    </div>
  );
}

export default DashboardView;
