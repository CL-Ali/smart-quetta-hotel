"use client";

import React, { useState, useMemo } from "react";
import { FaUtensils, FaFire, FaReceipt, FaPen, FaChair, FaSpinner, FaArrowRight, FaTicket } from "react-icons/fa6";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import { playTapSound } from "@/lib/sound";
import { isOrderOpenByDefault } from "@/lib/time";

// ViewModel
import { useCustomerViewModel } from "./viewmodel/useCustomerViewModel";

// Sub-components
import { LangSelectScreen } from "./components/LangSelectScreen";
import { NameEntryStep } from "./components/NameEntryStep";
import { SeatingStep } from "./components/SeatingStep";
import { MenuSection } from "./components/MenuSection";
import { ActiveOrdersTab } from "./components/ActiveOrdersTab";
import { OrderHistoryCard } from "./components/OrderHistoryCard";
import { CartBottomBar } from "./components/CartBottomBar";
import { DesktopCartSidebar } from "./components/DesktopCartSidebar";
import { ConfirmPlaceModal } from "./components/ConfirmPlaceModal";
import { OrderSuccessModal } from "./components/OrderSuccessModal";
import { OrdersOverviewBanner } from "./components/OrdersOverviewBanner";

/**
 * Customer Portal View (MVVM)
 * Minimalist, ultra-clean POS & customer ordering experience
 */
export function CustomerPortalView() {
  const { t } = useLang();
  const vm = useCustomerViewModel();

  const [historyFilter, setHistoryFilter] = useState<string>("active");

  const filteredHistoryOrders = useMemo(() => {
    if (!vm.myOrders) return [];
    if (historyFilter === "all") return vm.myOrders;
    if (historyFilter === "active") {
      const activeList = vm.myOrders.filter((o) => {
        const isOpenActive = isOrderOpenByDefault(o);
        const hasActiveStatus =
          o.status === "pending" ||
          o.status === "preparing" ||
          o.items?.some(
            (i: any) =>
              (i.kitchenStatus || i.status) === "pending" ||
              (i.kitchenStatus || i.status) === "preparing"
          );
        return isOpenActive && hasActiveStatus;
      });
      return activeList.length > 0
        ? activeList
        : vm.myOrders.filter((o) => isOrderOpenByDefault(o));
    }
    if (historyFilter === "ready") {
      return vm.myOrders.filter((o) => {
        const isOpenActive = isOrderOpenByDefault(o);
        const hasReadyStatus =
          o.status === "ready" ||
          o.items?.some((i: any) => (i.kitchenStatus || i.status) === "ready");
        return isOpenActive && hasReadyStatus;
      });
    }
    if (historyFilter === "served") {
      return vm.myOrders.filter(
        (o) => o.status === "served" || o.status === "paid"
      );
    }
    if (historyFilter.startsWith("ticket:")) {
      const tkt = historyFilter.replace("ticket:", "").trim().toUpperCase();
      return vm.myOrders.filter((o) => {
        const orderTkt = (o.ticketNo || o.orderNo || `TKT-${o.id}`).trim().toUpperCase();
        return orderTkt === tkt;
      });
    }
    return vm.myOrders;
  }, [vm.myOrders, historyFilter]);

  // 1. Initial Language Selection Step
  if (vm.step === "lang") {
    return <LangSelectScreen onDone={() => vm.setStep(vm.guestName ? "seating" : "name")} />;
  }

  // 2. Opening fresh visit / loading
  if (vm.isOpeningVisit) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <FaSpinner className="animate-spin h-7 w-7 text-amber-500" />
          <p className="text-xs text-stone-500 dark:text-zinc-400 font-medium">Setting up session…</p>
        </div>
      </div>
    );
  }

  // 3. Name entry onboarding step (First-Time User)
  if (vm.step === "name") {
    return (
      <NameEntryStep
        guestName={vm.guestName}
        guestPhone={vm.guestPhone}
        previousName={vm.previousName}
        peopleCount={vm.peopleCount}
        seatOrTableNo={vm.seatOrTableNo}
        isBusy={vm.isNameBusy}
        isResuming={vm.isResuming}
        setGuestName={vm.setGuestName}
        setGuestPhone={vm.setGuestPhone}
        setPeopleCount={vm.setPeopleCount}
        setSeatOrTableNo={vm.setSeatOrTableNo}
        onSubmit={vm.handleNameSubmit}
      />
    );
  }

  // 4. Seating & Party Size Step (Returning User / Every Session)
  if (vm.step === "seating") {
    return (
      <SeatingStep
        guestName={vm.guestName}
        peopleCount={vm.peopleCount}
        seatOrTableNo={vm.seatOrTableNo}
        isBusy={vm.isOpeningVisit}
        setPeopleCount={vm.setPeopleCount}
        setSeatOrTableNo={vm.setSeatOrTableNo}
        onSubmit={vm.handleSeatingSubmit}
        onChangeName={vm.handleChangeName}
      />
    );
  }

  // Format active non-served tokens
  const activeTokensList = (vm.activeTickets && vm.activeTickets.length > 0)
    ? vm.activeTickets
    : vm.ticketNo ? [vm.ticketNo] : [];

  // 5. Active Single-Screen Viewport with Material Design 3 Architecture
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-stone-50 dark:bg-zinc-950">
      {/* ── M3 Top App Bar ──────────────────────────────────────── */}
      <header className="h-14 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-stone-200/80 dark:border-zinc-800/80 px-3 sm:px-4 lg:px-6 flex items-center justify-between shrink-0 z-20 gap-3">
        {/* Left: Brand + Seating Context */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            <FaUtensils className="w-4 h-4" />
          </div>
          
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-stone-900 dark:text-white tracking-tight truncate">
                {t.hotelName}
              </span>
            </div>
            
            {/* Context chip (Guest & Table) */}
            <button
              type="button"
              onClick={() => {
                playTapSound();
                vm.setStep("seating");
              }}
              className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white transition group text-left cursor-pointer truncate"
              title="Change table or name"
            >
              {vm.peopleCount === 1 ? (
                <FaChair className="w-2.5 h-2.5 text-stone-400 shrink-0" />
              ) : (
                <FaUtensils className="w-2.5 h-2.5 text-stone-400 shrink-0" />
              )}
              <span className="font-medium text-stone-700 dark:text-zinc-300 truncate">
                {vm.formattedSeatingLabel}
              </span>
              <span className="text-stone-400 dark:text-zinc-500">• {vm.guestName || "Guest"}</span>
              <FaPen className="w-2 h-2 opacity-40 group-hover:opacity-100 transition-opacity ml-0.5 shrink-0" />
            </button>
          </div>
        </div>

        {/* Center: Desktop M3 Segmented Navigation (Hidden on mobile, bottom bar used instead) */}
        <div className="hidden lg:flex items-center bg-stone-100 dark:bg-zinc-800/80 p-1 rounded-full border border-stone-200/60 dark:border-zinc-700/60 shadow-2xs">
          {/* 1. Menu Tab */}
          <button
            type="button"
            onClick={() => {
              playTapSound();
              vm.setActiveTab("menu");
            }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              vm.activeTab === "menu"
                ? "bg-white dark:bg-zinc-900 text-stone-900 dark:text-white shadow-xs font-bold"
                : "text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            <FaUtensils className="w-3 h-3" />
            <span>{t.menu || "Menu"}</span>
          </button>

          {/* 2. Live Active Orders Tab */}
          <button
            type="button"
            onClick={() => {
              playTapSound();
              vm.setActiveTab("active");
            }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
              vm.activeTab === "active"
                ? "bg-white dark:bg-zinc-900 text-stone-900 dark:text-white shadow-xs font-bold"
                : "text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            <FaFire
              className={`w-3 h-3 ${
                vm.hasActiveOrders ? "text-amber-500" : "text-stone-400"
              }`}
            />
            <span>{t.activeKitchen || "Active Kitchen"}</span>
            {vm.activeItemsCount > 0 && (
              <span className="bg-amber-500 text-stone-950 text-[10px] rounded-full px-1.5 py-0.2 font-black font-mono">
                {vm.activeItemsCount}
              </span>
            )}
          </button>

          {/* 3. All Orders History Tab */}
          <button
            type="button"
            onClick={() => {
              if (vm.hasOrders) {
                playTapSound();
                vm.setActiveTab("history");
              }
            }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
              !vm.hasOrders
                ? "text-stone-400 dark:text-zinc-600 cursor-not-allowed opacity-50"
                : vm.activeTab === "history"
                ? "bg-white dark:bg-zinc-900 text-stone-900 dark:text-white shadow-xs font-bold"
                : "text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            <FaReceipt className="w-3 h-3 opacity-60" />
            <span>{t.myOrders || "Orders"}</span>
            {vm.hasOrders && (
              <span className="bg-stone-200 dark:bg-zinc-700 text-stone-800 dark:text-zinc-200 text-[10px] rounded-full px-1.5 py-0.2 font-bold font-mono">
                {vm.myOrders!.length}
              </span>
            )}
          </button>
        </div>

        {/* Right: Language Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <LangSwitcher />
        </div>
      </header>

      {/* ── Main Viewport ────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 w-full px-3 sm:px-4 lg:px-6 py-2 overflow-hidden pb-16 lg:pb-2">
        {/* 1. Menu Tab */}
        {vm.activeTab === "menu" && (
          <div className="h-full flex flex-col overflow-hidden space-y-2">
            {/* Subtle Tonal Kitchen Notice for all Active Non-Served Orders */}
            {vm.hasActiveOrders && (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  vm.setActiveTab("active");
                }}
                className="w-full bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:hover:bg-zinc-800/80 border border-stone-200/70 dark:border-zinc-800 rounded-2xl p-3 flex items-center justify-between gap-3 transition cursor-pointer text-left shrink-0 shadow-2xs group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <FaFire className="w-4 h-4 text-amber-500 animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-stone-900 dark:text-white truncate">
                      <span>{vm.activeItemsCount} {t.nonServedItems || "items being cooked in kitchen"}</span>
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">
                      {t.trackOrderRealtime || (lang === "ur" ? "لائیو کچن تفصیلات دیکھیں" : "Live Kitchen Tracking")}
                    </div>
                  </div>
                </div>
                <span className="h-8 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-2xs group-hover:scale-95 transition-transform">
                  <span>{t.trackOrderBtn || "Track"}</span>
                  <FaArrowRight className="w-2.5 h-2.5 rtl:rotate-180" />
                </span>
              </button>
            )}

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch overflow-hidden min-h-0">
              {/* Left Area: Food Matrix */}
              <div className="h-full lg:col-span-8 xl:col-span-8 2xl:col-span-9 flex flex-col overflow-hidden min-h-0">
                <MenuSection
                  menu={vm.menu}
                  isLoading={vm.menuLoading}
                  cart={vm.cart}
                  onAdd={vm.handleAddToCart}
                  onDec={vm.handleDecFromCart}
                  onRemoveItem={vm.handleRemoveFromCart}
                />
              </div>

              {/* Right Area: Pinned Live Cart Sidebar (Desktop/Tablet) */}
              <div className="hidden lg:flex lg:col-span-4 xl:col-span-4 2xl:col-span-3 flex-col h-full overflow-hidden min-h-0">
                <DesktopCartSidebar
                  cart={vm.cart}
                  cartTotal={vm.cartTotal}
                  guestName={vm.guestName}
                  seatingLabel={vm.formattedSeatingLabel}
                  ticketNo={vm.ticketNo}
                  placing={vm.placing}
                  menu={vm.menu}
                  onAdd={vm.handleAddToCart}
                  onDec={vm.handleDecFromCart}
                  onRemoveItem={vm.handleRemoveFromCart}
                  onCheckout={() => vm.setConfirmPlace(true)}
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. Active Orders (Live Kitchen Queue with Ahead Tracking) */}
        {vm.activeTab === "active" && (
          <div className="h-full max-w-2xl mx-auto overflow-hidden">
            <ActiveOrdersTab
              orders={vm.myOrders || []}
              kitchenQueue={vm.kitchenQueue || []}
              guestName={vm.guestName}
              seatingLabel={vm.formattedSeatingLabel}
              ticketNo={vm.ticketNo}
              activeTickets={vm.activeTickets || []}
              onCancelItem={vm.handleCancelOrderItem}
              cancellingItemId={vm.cancellingItemId}
              onOrderMore={() => vm.setActiveTab("menu")}
              onViewAllOrders={() => vm.setActiveTab("history")}
            />
          </div>
        )}

        {/* 3. All Orders History Tab */}
        {vm.activeTab === "history" && (
          <div className="h-full max-w-2xl mx-auto overflow-y-auto pr-1 py-1.5 space-y-2 no-scrollbar">
            {vm.ordersLoading ? (
              <div className="flex justify-center py-20">
                <FaSpinner className="animate-spin h-7 w-7 text-amber-500" />
              </div>
            ) : vm.myOrders && vm.myOrders.length > 0 ? (
              <>
                <OrdersOverviewBanner
                  orders={vm.myOrders}
                  selectedFilter={historyFilter}
                  onSelectFilter={setHistoryFilter}
                />
                <div className="space-y-1.5 sm:space-y-2">
                  {filteredHistoryOrders.map((order, idx) => (
                    <OrderHistoryCard
                      key={order.id}
                      order={order}
                      defaultOpen={isOrderOpenByDefault(order, idx === 0)}
                      onCancelItem={vm.handleCancelOrderItem}
                      cancellingItemId={vm.cancellingItemId}
                    />
                  ))}
                  {filteredHistoryOrders.length === 0 && (
                    <div className="text-center py-10 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 text-stone-400">
                      <p className="text-xs font-medium">No orders matching this filter</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 text-stone-400">
                <FaUtensils className="w-8 h-8 mx-auto mb-3 opacity-30 text-stone-400" />
                <p className="text-sm font-bold text-stone-700 dark:text-stone-300">{t.noPastOrders}</p>
                <p className="text-xs text-stone-400 mt-1">
                  {t.placeOrderPrompt}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Summary (Only on Mobile screens < lg) */}
      {vm.cartCount > 0 && vm.activeTab === "menu" && (
        <div className="lg:hidden shrink-0">
          <CartBottomBar
            cart={vm.cart}
            cartTotal={vm.cartTotal}
            placing={vm.placing}
            onRemoveItem={vm.handleRemoveFromCart}
            onCheckout={() => vm.setConfirmPlace(true)}
          />
        </div>
      )}

      {/* ── Material 3 Mobile Bottom Navigation Bar ────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-stone-200/80 dark:border-zinc-800/80 z-20 flex items-center justify-around px-2 pb-safe">
        {/* Destination 1: Menu */}
        <button
          type="button"
          onClick={() => {
            playTapSound();
            vm.setActiveTab("menu");
          }}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition-colors"
        >
          <div
            className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${
              vm.activeTab === "menu"
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold"
                : "text-stone-400 dark:text-zinc-500 hover:text-stone-600"
            }`}
          >
            <FaUtensils className="w-3.5 h-3.5" />
          </div>
          <span
            className={`text-[11px] font-medium leading-none ${
              vm.activeTab === "menu"
                ? "text-stone-900 dark:text-white font-bold"
                : "text-stone-500 dark:text-zinc-400"
            }`}
          >
            {t.menu || "Menu"}
          </span>
        </button>

        {/* Destination 2: Active Kitchen */}
        <button
          type="button"
          onClick={() => {
            playTapSound();
            vm.setActiveTab("active");
          }}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition-colors relative"
        >
          <div
            className={`w-12 h-7 rounded-full flex items-center justify-center transition-all relative ${
              vm.activeTab === "active"
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold"
                : "text-stone-400 dark:text-zinc-500 hover:text-stone-600"
            }`}
          >
            <FaFire className="w-3.5 h-3.5" />
            {vm.activeItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 text-[10px] font-black font-mono w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {vm.activeItemsCount}
              </span>
            )}
          </div>
          <span
            className={`text-[11px] font-medium leading-none ${
              vm.activeTab === "active"
                ? "text-stone-900 dark:text-white font-bold"
                : "text-stone-500 dark:text-zinc-400"
            }`}
          >
            {t.activeKitchen || "Active"}
          </span>
        </button>

        {/* Destination 3: Orders History */}
        <button
          type="button"
          onClick={() => {
            if (vm.hasOrders) {
              playTapSound();
              vm.setActiveTab("history");
            }
          }}
          disabled={!vm.hasOrders}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
            !vm.hasOrders ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          <div
            className={`w-12 h-7 rounded-full flex items-center justify-center transition-all relative ${
              vm.activeTab === "history"
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold"
                : "text-stone-400 dark:text-zinc-500 hover:text-stone-600"
            }`}
          >
            <FaReceipt className="w-3.5 h-3.5" />
            {vm.hasOrders && (
              <span className="absolute -top-1 -right-1 bg-stone-700 text-white text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {vm.myOrders!.length}
              </span>
            )}
          </div>
          <span
            className={`text-[11px] font-medium leading-none ${
              vm.activeTab === "history"
                ? "text-stone-900 dark:text-white font-bold"
                : "text-stone-500 dark:text-zinc-400"
            }`}
          >
            {t.myOrders || "History"}
          </span>
        </button>
      </nav>

      {/* Place Order Confirmation Modal */}
      <ConfirmPlaceModal
        open={vm.confirmPlace}
        cart={vm.cart}
        cartTotal={vm.cartTotal}
        onClose={() => vm.setConfirmPlace(false)}
        onConfirm={vm.handlePlaceOrder}
        onRemoveItem={vm.handleRemoveFromCart}
        onAdd={vm.handleAddToCart}
        onDec={vm.handleDecFromCart}
      />

      {/* Celebration & Ticket Success Modal */}
      <OrderSuccessModal
        open={vm.showSuccessModal}
        ticketNo={vm.ticketNo}
        guestName={vm.guestName}
        orderTotal={vm.lastOrderTotal}
        onClose={() => vm.setShowSuccessModal(false)}
        onViewOrders={() => {
          vm.setShowSuccessModal(false);
          vm.setActiveTab("active");
        }}
      />
    </div>
  );
}

export default CustomerPortalView;

