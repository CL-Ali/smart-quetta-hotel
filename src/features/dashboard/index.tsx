"use client";

import React from "react";
import { Loader2, Hotel, ClipboardList, Utensils, Users, Folder, Package } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import { DashboardPinGate } from "@/components/DashboardPinGate";
import { NewOrderSheet } from "@/components/NewOrderSheet";

// ViewModel
import { useDashboardViewModel, DashboardTab } from "./viewmodel/useDashboardViewModel";

// Sub-components
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
 * Pure UI Layer consuming useDashboardViewModel
 */
export function DashboardView() {
  const { t } = useLang();
  const vm = useDashboardViewModel();

  if (vm.ordersLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
      </div>
    );
  }

  // 1. PIN Lock Guard
  if (!vm.pinUnlocked) {
    return <DashboardPinGate onUnlocked={vm.handleUnlockPin} />;
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
      {/* Top Navbar */}
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

      {/* Main Container */}
      <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
        {/* KPI Banner */}
        <DashboardKpis
          cashReport={vm.cash}
          pendingCount={vm.pendingCount}
          readyCount={vm.readyCount}
          unpaidCount={vm.unpaidCount}
        />

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-gray-200/80 rounded-xl p-1 mb-4 overflow-x-auto no-scrollbar">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => vm.setTab(key as DashboardTab)}
              className={`flex-1 shrink-0 py-2 px-3 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                vm.tab === key ? "bg-white shadow-xs text-black" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Views */}
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
