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
  Store,
  ChefHat,
  LogOut,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { playTapSound } from "@/lib/sound";
import { useLang } from "@/contexts/LangContext";
import { useAuth } from "@/contexts/AuthContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import { StaffWorkspaceSwitcher } from "@/components/StaffWorkspaceSwitcher";
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
import { StaffAuthGuard } from "@/components/StaffAuthGuard";

/**
 * Cashier & POS Terminal View (MVVM)
 * Full Responsive Single-Screen 100vh Square POS Terminal
 */
export function DashboardView() {
  const { t } = useLang();
  const { staff, logout, permissions } = useAuth();
  const vm = useDashboardViewModel();

  const TABS = [
    { key: "pos", label: "POS Register", icon: LayoutGrid },
    { key: "orders", label: t.orders, icon: ClipboardList, badge: vm.unpaidCount },
    { key: "guests", label: "Guests", icon: Users },
    { key: "products", label: "Products", icon: Package },
    { key: "department", label: "Department", icon: Folder },
    { key: "stock", label: t.stock, icon: Utensils },
  ];

  return (
    <StaffAuthGuard allowedRoles={["admin", "cashier"]}>
      <div className="h-screen w-full flex flex-col overflow-hidden bg-stone-50 text-stone-900">
      {/* ── Compact Streamlined Header Navbar ───────────────────────── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-xs gap-3 sticky top-0 z-30 w-full">
        {/* Left: Brand + Context */}
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
            <Hotel className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-black text-stone-900 leading-none truncate">
                {t.hotelName || "Smart Quetta Hotel"}
              </h1>
              {staff?.stationName && (
                <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                  <Store className="w-3 h-3 text-amber-600" />
                  <span>{staff.stationName}</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-amber-600 font-extrabold uppercase tracking-widest mt-0.5 truncate">
              Cashier POS Terminal & Counter Billing
            </p>
          </div>
        </div>

        {/* Center: Tab Switcher Pills */}
        <div className="flex-1 flex justify-center items-center px-2 min-w-0">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full border border-stone-200/60">
            {TABS.map(({ key, label, icon: Icon, badge }) => (
              <button
                key={key}
                type="button"
                onClick={() => vm.setTab(key as DashboardTab)}
                className={`px-2.5 py-1.5 text-xs font-extrabold rounded-lg transition flex items-center gap-1.5 cursor-pointer select-none shrink-0 ${
                  vm.tab === key
                    ? "bg-amber-500 text-stone-950 shadow-xs font-black"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {typeof badge === "number" && badge > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                    vm.tab === key ? "bg-stone-950 text-amber-400" : "bg-red-500 text-white"
                  }`}>
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Desktop Tools */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Quick Staff View Links */}
          <StaffWorkspaceSwitcher current="cashier" />

          <div className="hidden md:flex items-center gap-2 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-stone-800">{staff?.name}</span>
            <span className="text-[10px] font-extrabold text-amber-800 uppercase bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
              Cashier POS
            </span>
          </div>

          <LangSwitcher />

          <button
            type="button"
            onClick={() => logout()}
            className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
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
    </StaffAuthGuard>
  );
}

export default DashboardView;
