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
      <div className="h-screen w-full flex flex-col overflow-hidden bg-[#F8F3EC] dark:bg-[#0B0F17] text-[#24180A] dark:text-[#F8FAFC]">
      {/* ── Monolithic Floating Luxe Header Navbar ───────────────────────── */}
      <header className="bg-white dark:bg-[#121824] rounded-[24px] sm:rounded-[28px] border-0 shadow-none px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0 gap-3 sticky top-3 z-30 mx-3 sm:mx-4 my-2">
        {/* Left: Brand + Context */}
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#D98A3C] text-white flex items-center justify-center font-black shrink-0 shadow-none">
            <Hotel className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-black text-[#24180A] dark:text-white leading-none truncate">
                {t.hotelName || "Smart Quetta Hotel"}
              </h1>
              {staff?.stationName && (
                <span className="bg-[#D98A3C]/15 text-[#D98A3C] text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                  <Store className="w-3 h-3 text-[#D98A3C]" />
                  <span>{staff.stationName}</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#D98A3C] font-extrabold uppercase tracking-widest mt-1 truncate">
              Cashier POS & Multi-Counter Billing
            </p>
          </div>
        </div>

        {/* Center: Centered Tab Navigation Pill */}
        <div className="flex-1 flex justify-center items-center px-2 min-w-0">
          <div className="flex items-center gap-1.5 bg-[#F4EFEA] dark:bg-[#1A2234] p-1.5 rounded-full overflow-x-auto no-scrollbar max-w-full border-0">
            {TABS.map(({ key, label, icon: Icon, badge }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  playTapSound();
                  vm.setTab(key as DashboardTab);
                }}
                className={`px-4 py-2 text-xs font-bold rounded-full transition flex items-center gap-2 cursor-pointer select-none shrink-0 border-0 ${
                  vm.tab === key
                    ? "bg-[#D98A3C] text-white shadow-none font-black"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {typeof badge === "number" && badge > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    vm.tab === key ? "bg-white/20 text-white" : "bg-red-500 text-white"
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

          {staff && (
            <div className="hidden md:flex items-center gap-2 bg-[#F4EFEA] dark:bg-[#1A2234] px-3.5 py-1.5 rounded-full text-xs border-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-[#24180A] dark:text-white">{staff?.name}</span>
              <span className="text-[10px] font-extrabold text-[#D98A3C] uppercase bg-amber-500/15 px-2 py-0.5 rounded-full">
                Cashier POS
              </span>
            </div>
          )}

          <LangSwitcher />

          <button
            type="button"
            onClick={() => logout()}
            className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full transition cursor-pointer shrink-0 border-0"
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
