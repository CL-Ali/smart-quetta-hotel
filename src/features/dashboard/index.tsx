"use client";

import React from "react";
import { motion } from "framer-motion";
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
import { StaffHeaderBar } from "@/components/StaffHeaderBar";
import { StaffBottomNav } from "@/components/StaffBottomNav";
import { StaffDrawerSheet } from "@/components/StaffDrawerSheet";
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
import { StaffAuthGuard } from "@/components/StaffAuthGuard";

/**
 * Cashier Management & Counter Billing View (MVVM)
 */
export function DashboardView() {
  const { t, lang } = useLang();
  const { staff } = useAuth();
  const vm = useDashboardViewModel();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const TABS = [
    { key: "orders", label: t.orders || (lang === "ur" ? "آرڈرز و بل" : "Orders & Bills"), icon: ClipboardList, badge: vm.unpaidCount },
    { key: "guests", label: lang === "ur" ? "گاہک" : "Guests", icon: Users },
    { key: "products", label: lang === "ur" ? "اشیاء مینو" : "Products", icon: Package },
    { key: "department", label: lang === "ur" ? "شعبہ جات" : "Departments", icon: Folder },
    { key: "stock", label: t.stock || (lang === "ur" ? "اسٹاک" : "Stock"), icon: Utensils },
  ];

  return (
    <StaffAuthGuard requiredPermission="canCashier" allowedRoles={["admin", "cashier"]}>
      <div className="min-h-screen bg-[#F8F3EC] dark:bg-[#0B0F17] text-[#24180A] dark:text-[#F8FAFC] flex flex-col pb-20 md:pb-4">
      {/* ── Top Unified Navigation Header ───────────────────────── */}
      <StaffHeaderBar
        current="cashier"
        title={t.hotelName || "Smart Hotel"}
        subtitle={`${lang === "ur" ? "کیشیئر مینجمنٹ" : "Cashier Management"}${staff?.stationName ? ` • ${staff.stationName}` : ""}`}
        icon={Store}
        onOpenDrawer={() => setDrawerOpen(true)}
        centerContent={
          <div className="inline-flex items-center bg-[#F4EFEA] dark:bg-[#1A2234] p-1 rounded-full overflow-x-auto no-scrollbar max-w-full border-0 shadow-none relative">
            {TABS.map(({ key, label, icon: Icon, badge }) => {
              const isActive = vm.tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    vm.setTab(key as DashboardTab);
                  }}
                  className={`relative px-3.5 h-8 text-xs font-extrabold rounded-full inline-flex items-center gap-1.5 transition-colors duration-200 select-none cursor-pointer border-0 ${
                    isActive
                      ? "text-white"
                      : "text-stone-600 dark:text-stone-400 hover:text-[#24180A] dark:hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="cashierTabIndicator"
                      className="absolute inset-0 bg-[#D98A3C] rounded-full shadow-xs -z-0"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{label}</span>
                  {typeof badge === "number" && badge > 0 && (
                    <span className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? "bg-white/25 text-white" : "bg-red-500 text-white"
                    }`}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        }
      />

      {/* ── Main Viewport Area (Management Tabs Container) ──── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 lg:px-6 py-3 space-y-4 pb-20">
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

      {/* Mobile Bottom Navigation */}
      <StaffBottomNav
        current="cashier"
        items={TABS}
        activeItem={vm.tab}
        onSelectItem={(k) => vm.setTab(k as DashboardTab)}
        onOpenDrawer={() => setDrawerOpen(true)}
      />

      {/* Mobile Drawer Sheet */}
      <StaffDrawerSheet
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        current="cashier"
      />
    </div>
    </StaffAuthGuard>
  );
}

export default DashboardView;
