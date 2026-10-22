"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Utensils,
  Flame,
  Receipt,
  Pencil,
  Armchair,
  Loader2,
  ArrowRight,
  Ticket,
  User,
  Globe,
  Check,
  X,
  Settings,
} from "lucide-react";
import { useLang, LANG_OPTIONS } from "@/contexts/LangContext";
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
  const { t, lang, setLang } = useLang();
  const vm = useCustomerViewModel();

  const [historyFilter, setHistoryFilter] = useState<string>("active");
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

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
        const orderTkt = ((o as any).ticketNo || o.orderNo || `TKT-${o.id}`).trim().toUpperCase();
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
      <div className="min-h-screen bg-[#F8F3EC] dark:bg-[#0B0F17] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="animate-spin h-7 w-7 text-[#D98A3C]" />
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

  // 5. Active Single-Screen Viewport with Monolithic Floating Luxe Aesthetic
  return (
    <div className="min-h-screen bg-[#F8F3EC] dark:bg-[#0B0F17] text-[#24180A] dark:text-[#F8FAFC] flex flex-col select-none">
      {/* ── Monolithic Floating Luxe Top App Bar (Unified layout matching other workspaces) ── */}
      <header className="bg-white dark:bg-[#121824] rounded-2xl sm:rounded-[28px] border-0 shadow-none px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shrink-0 gap-2 sm:gap-4 static sm:sticky top-0 sm:top-3 z-30 mx-2 sm:mx-4 my-2 select-none transition-all">
        {/* Left: Brand + Seating Context + View Child Tabs */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          {/* Logo and Station/View Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#D98A3C] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-none">
              <Utensils className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            
            <div className="hidden sm:flex flex-col min-w-0">
              <h1 className="text-sm sm:text-base font-black text-[#24180A] dark:text-white leading-none truncate">
                {t.hotelName || "Smart Hotel"}
              </h1>
              
              {/* Context chip (Guest & Table) */}
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  vm.setStep("seating");
                }}
                className="flex items-center gap-1.5 text-[10px] text-[#D98A3C] dark:text-amber-400 font-extrabold uppercase tracking-widest leading-none mt-1 hover:underline transition group text-left cursor-pointer truncate"
                title="Change table or name"
              >
                <span className="truncate">
                  {vm.formattedSeatingLabel} • {vm.guestName || "Guest"}
                </span>
                <Pencil className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            </div>
          </div>

          {/* Subtle Vertical Divider */}
          <div className="hidden md:block w-px h-6 bg-stone-200 dark:bg-stone-800 shrink-0 mx-0.5" />

          {/* View Child Tabs (Aligned right next to Logo & Title, matching Admin / Kitchen / Waiter design) */}
          <div className="hidden md:flex items-center min-w-0 overflow-x-auto no-scrollbar">
            <div className="inline-flex items-center bg-[#F4EFEA] dark:bg-[#1A2234] p-1 rounded-full overflow-x-auto no-scrollbar max-w-full border-0 shadow-none relative">
              {/* 1. Menu Tab */}
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  vm.setActiveTab("menu");
                }}
                className={`relative px-3.5 h-8 text-xs font-extrabold rounded-full inline-flex items-center gap-1.5 transition-colors duration-200 select-none cursor-pointer border-0 ${
                  vm.activeTab === "menu"
                    ? "text-white"
                    : "text-stone-600 dark:text-stone-400 hover:text-[#24180A] dark:hover:text-white"
                }`}
              >
                {vm.activeTab === "menu" && (
                  <motion.div
                    layoutId="customerTabIndicator"
                    className="absolute inset-0 bg-[#D98A3C] rounded-full shadow-xs -z-0"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <Utensils className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">{t.menu || "Menu"}</span>
              </button>

              {/* 2. Today Orders / My Orders Tab */}
              <button
                type="button"
                onClick={() => {
                  if (vm.hasOrders) {
                    playTapSound();
                    vm.setActiveTab("history");
                  }
                }}
                className={`relative px-3.5 h-8 text-xs font-extrabold rounded-full inline-flex items-center gap-1.5 transition-colors duration-200 select-none border-0 ${
                  !vm.hasOrders
                    ? "text-stone-400 dark:text-zinc-600 cursor-not-allowed opacity-50"
                    : vm.activeTab === "history"
                    ? "text-white cursor-pointer"
                    : "text-stone-600 dark:text-stone-400 hover:text-[#24180A] dark:hover:text-white cursor-pointer"
                }`}
              >
                {vm.activeTab === "history" && (
                  <motion.div
                    layoutId="customerTabIndicator"
                    className="absolute inset-0 bg-[#D98A3C] rounded-full shadow-xs -z-0"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <Receipt className="w-3.5 h-3.5 relative z-10 opacity-90" />
                <span className="relative z-10">{lang === "ur" ? "میرے آرڈرز و بل" : "My Orders & Bill"}</span>
                {vm.hasOrders && (
                  <span className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                    vm.activeTab === "history" ? "bg-white/25 text-white" : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
                  }`}>
                    {vm.myOrders!.length}
                  </span>
                )}
              </button>

              {/* 3. Live Kitchen Queue Tab (Admin Configurable) */}
              {vm.showCustomerQueue && (
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    vm.setActiveTab("active");
                  }}
                  className={`relative px-3.5 h-8 text-xs font-extrabold rounded-full inline-flex items-center gap-1.5 transition-colors duration-200 select-none cursor-pointer border-0 ${
                    vm.activeTab === "active"
                      ? "text-white"
                      : "text-stone-600 dark:text-stone-400 hover:text-[#24180A] dark:hover:text-white"
                  }`}
                >
                  {vm.activeTab === "active" && (
                    <motion.div
                      layoutId="customerTabIndicator"
                      className="absolute inset-0 bg-[#D98A3C] rounded-full shadow-xs -z-0"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <Flame className={`w-3.5 h-3.5 relative z-10 ${vm.activeTab === "active" ? "text-white" : vm.hasActiveOrders ? "text-[#D98A3C]" : "text-stone-400"}`} />
                  <span className="relative z-10">{lang === "ur" ? "کچن قطار" : "Kitchen Queue"}</span>
                  {vm.activeItemsCount > 0 && (
                    <span className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                      vm.activeTab === "active" ? "bg-white/25 text-white" : "bg-[#D98A3C] text-white"
                    }`}>
                      {vm.activeItemsCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Guest Badge + Language Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setShowProfileModal(true);
            }}
            className="flex items-center gap-1.5 bg-[#F4EFEA] dark:bg-[#1A2234] hover:bg-stone-200/70 dark:hover:bg-zinc-800 px-3 h-8 sm:h-9 rounded-full text-xs font-bold border-0 text-[#24180A] dark:text-stone-200 transition cursor-pointer"
            title="View Preferences / Change Table"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-[#24180A] dark:text-white truncate max-w-[90px] sm:max-w-[130px]">
              {vm.guestName || "Guest"}
            </span>
            <span className="text-[10px] font-extrabold text-[#D98A3C] uppercase bg-amber-500/15 px-2 py-0.5 rounded-full">
              {vm.formattedSeatingLabel}
            </span>
          </button>

          <LangSwitcher variant="compact" />
        </div>
      </header>

      {/* ── Main Viewport ────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 w-full px-3 sm:px-4 lg:px-6 py-2.5 overflow-hidden pb-16 lg:pb-3">
        {/* 1. Menu Tab */}
        {vm.activeTab === "menu" && (
          <div className="h-full flex flex-col overflow-hidden space-y-2.5">
            {/* Tonal Floating Notice for Active Non-Served Orders (Hidden on mobile) */}
            {vm.hasActiveOrders && (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  vm.setActiveTab(vm.showCustomerQueue ? "active" : "history");
                }}
                className="hidden sm:flex w-full bg-white dark:bg-[#121824] hover:bg-[#F8F3EC] dark:hover:bg-[#1A2232] rounded-[24px] sm:rounded-[26px] p-3.5 sm:p-4 items-center justify-between gap-3 transition cursor-pointer text-left shrink-0 border-0 shadow-none group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-[#D98A3C]/15 text-[#D98A3C] flex items-center justify-center shrink-0">
                    <Flame className="w-5 h-5 text-[#D98A3C] animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-[#24180A] dark:text-white truncate">
                      <span>{vm.activeItemsCount} {t.nonServedItems || "items being cooked in kitchen"}</span>
                    </div>
                    <div className="text-[11px] text-[#786B5D] dark:text-zinc-400 truncate mt-0.5">
                      {vm.showCustomerQueue
                        ? (t.trackOrderRealtime || (lang === "ur" ? "لائیو کچن تفصیلات دیکھیں" : "Live Kitchen Tracking"))
                        : (lang === "ur" ? "میرے آرڈرز اور بل کی رسید دیکھیں" : "View My Orders & Bill")}
                    </div>
                  </div>
                </div>
                <span className="h-9 px-4 rounded-full bg-[#D98A3C] text-white font-extrabold text-xs flex items-center gap-1.5 shrink-0 shadow-none group-hover:scale-[0.98] transition-transform">
                  <span>{vm.showCustomerQueue ? (t.trackOrderBtn || "Track") : (lang === "ur" ? "آرڈرز" : "View Bill")}</span>
                  <ArrowRight className="w-3 h-3 rtl:rotate-180" />
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
        {vm.showCustomerQueue && vm.activeTab === "active" && (
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
          <div className="h-full max-w-2xl mx-auto overflow-y-auto pr-1 py-1.5 space-y-2.5 no-scrollbar">
            {vm.ordersLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin h-8 w-8 text-[#D98A3C]" />
              </div>
            ) : vm.myOrders && vm.myOrders.length > 0 ? (
              <>
                <OrdersOverviewBanner
                  orders={vm.myOrders}
                  selectedFilter={historyFilter}
                  onSelectFilter={setHistoryFilter}
                />
                <div className="space-y-2 sm:space-y-2.5">
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
                    <div className="text-center py-12 bg-white dark:bg-[#121824] rounded-[24px] border-0 text-[#786B5D] dark:text-zinc-400">
                      <p className="text-xs font-bold">No orders matching this filter</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-24 bg-white dark:bg-[#121824] rounded-[28px] border-0 text-[#786B5D] dark:text-zinc-400">
                <Utensils className="w-10 h-10 mx-auto mb-3 opacity-30 text-[#D98A3C]" />
                <p className="text-sm font-black text-[#24180A] dark:text-white">{t.noPastOrders}</p>
                <p className="text-xs text-[#786B5D] dark:text-zinc-400 mt-1 font-medium">
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

      {/* ── Monolithic Luxe Mobile Bottom Navigation Bar ────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-[#121824] border-0 shadow-none z-20 flex items-center justify-around px-3 pb-safe">
        {/* Destination 1: Menu */}
        <button
          type="button"
          onClick={() => {
            playTapSound();
            vm.setActiveTab("menu");
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition-all ${
            vm.activeTab === "menu" ? "text-[#D98A3C]" : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
          }`}
        >
          <div
            className={`w-10 h-6 rounded-full flex items-center justify-center transition-all ${
              vm.activeTab === "menu"
                ? "bg-[#D98A3C] text-white"
                : "bg-transparent text-current"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold leading-none">
            {t.menu || "Menu"}
          </span>
        </button>

        {/* Destination 2: Today Orders / Bill (Comes before Queue) */}
        <button
          type="button"
          onClick={() => {
            if (vm.hasOrders) {
              playTapSound();
              vm.setActiveTab("history");
            }
          }}
          disabled={!vm.hasOrders}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all ${
            !vm.hasOrders ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
          } ${
            vm.activeTab === "history" ? "text-[#D98A3C]" : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
          }`}
        >
          <div
            className={`w-10 h-6 rounded-full flex items-center justify-center transition-all relative ${
              vm.activeTab === "history"
                ? "bg-[#D98A3C] text-white"
                : "bg-transparent text-current"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            {vm.hasOrders && (
              <span className="absolute -top-1.5 -right-2 bg-stone-700 text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white dark:ring-[#121824]">
                {vm.myOrders!.length}
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold leading-none">
            {lang === "ur" ? "میرے آرڈرز" : "Today Orders"}
          </span>
        </button>

        {/* Destination 3: Live Kitchen Queue (Admin Configurable) */}
        {vm.showCustomerQueue && (
          <button
            type="button"
            onClick={() => {
              playTapSound();
              vm.setActiveTab("active");
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition-all relative ${
              vm.activeTab === "active" ? "text-[#D98A3C]" : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            <div
              className={`w-10 h-6 rounded-full flex items-center justify-center transition-all relative ${
                vm.activeTab === "active"
                  ? "bg-[#D98A3C] text-white"
                  : "bg-transparent text-current"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              {vm.activeItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#D98A3C] text-white text-[9px] font-black font-mono px-1.5 py-0.2 rounded-full ring-2 ring-white dark:ring-[#121824]">
                  {vm.activeItemsCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold leading-none">
              {lang === "ur" ? "کچن قطار" : "Queue"}
            </span>
          </button>
        )}

        {/* Destination 4: Settings / Preferences */}
        <button
          type="button"
          onClick={() => {
            playTapSound();
            setShowProfileModal(true);
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 cursor-pointer transition-all ${
            showProfileModal
              ? "text-[#D98A3C]"
              : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
          }`}
        >
          <div
            className={`w-10 h-6 rounded-full flex items-center justify-center transition-all ${
              showProfileModal
                ? "bg-[#D98A3C] text-white"
                : "bg-transparent text-current"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold leading-none truncate max-w-[65px]">
            {lang === "ur" ? "ترتیبات" : "Settings"}
          </span>
        </button>
      </nav>

      {/* ── Table, Guest Profile & Language Modal (Interactive Dynamic Bottom Sheet) ─────────────── */}
      {showProfileModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowProfileModal(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#121824] rounded-t-[32px] sm:rounded-[28px] p-5 sm:p-6 space-y-4 border-0 shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-2 duration-200 cursor-default max-h-[90vh] overflow-y-auto no-scrollbar pb-safe"
          >
            {/* Top Sheet Drag Handle on mobile */}
            <div className="w-12 h-1.5 rounded-full bg-stone-300 dark:bg-zinc-700 mx-auto -mt-1 mb-2 sm:hidden shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#D98A3C]/15 text-[#D98A3C] flex items-center justify-center font-bold shrink-0">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#24180A] dark:text-white leading-tight">
                    {lang === "ur" ? "ترتیبات و معلومات" : "Settings & Preferences"}
                  </h3>
                  <p className="text-[11px] font-bold text-stone-500 dark:text-zinc-400">
                    {t.hotelName || "Smart Hotel"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setShowProfileModal(false);
                }}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-[#1A2234] hover:bg-stone-200 dark:hover:bg-[#222C42] text-stone-500 dark:text-zinc-300 flex items-center justify-center transition cursor-pointer active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Table & Guest */}
            <div className="bg-[#F8F3EC] dark:bg-[#1A2232] rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#786B5D] dark:text-zinc-400">
                    {lang === "ur" ? "منتخب نشست" : "Seating / Table"}
                  </div>
                  <div className="text-sm font-black text-[#D98A3C] mt-0.5">
                    {vm.formattedSeatingLabel} • {vm.guestName || "Guest"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setShowProfileModal(false);
                    vm.setStep("seating");
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#D98A3C] hover:bg-[#C27930] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-none active:scale-95"
                >
                  <Pencil className="w-2.5 h-2.5" />
                  <span>{lang === "ur" ? "تبدیل کریں" : "Change"}</span>
                </button>
              </div>
            </div>

            {/* Language Selector (All 8 Languages) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-zinc-300">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-[#D98A3C]" />
                  <span>{lang === "ur" ? "زبان منتخب کریں" : "Select Language"}</span>
                </div>
                <span className="text-[10px] font-mono text-stone-400 font-bold">
                  {LANG_OPTIONS.length} Languages
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto no-scrollbar pr-0.5">
                {LANG_OPTIONS.map((opt) => {
                  const isSelected = opt.value === lang;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setLang(opt.value);
                      }}
                      className={`p-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between cursor-pointer border-0 select-none ${
                        isSelected
                          ? "bg-[#D98A3C] text-white font-black shadow-2xs"
                          : "bg-[#F8F3EC] dark:bg-[#1A2232] text-stone-700 dark:text-zinc-300 hover:bg-stone-200/60 dark:hover:bg-[#222C42]"
                      }`}
                    >
                      <div className="flex flex-col text-left rtl:text-right min-w-0">
                        <span className="text-xs font-bold leading-tight truncate">
                          {opt.nativeName}
                        </span>
                        <span
                          className={`text-[10px] ${
                            isSelected ? "text-white/80 font-bold" : "text-stone-400 dark:text-zinc-500"
                          }`}
                        >
                          {opt.englishName}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3 h-3 shrink-0 ml-1 rtl:mr-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Done CTA */}
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setShowProfileModal(false);
              }}
              className="w-full h-11 bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-black text-xs rounded-full transition cursor-pointer active:scale-95 shadow-sm"
            >
              {lang === "ur" ? "مکمل" : "Done"}
            </button>
          </div>
        </div>
      )}

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
        showCustomerQueue={vm.showCustomerQueue}
        onClose={() => vm.setShowSuccessModal(false)}
        onViewOrders={() => {
          vm.setShowSuccessModal(false);
          vm.setActiveTab(vm.showCustomerQueue ? "active" : "history");
        }}
      />
    </div>
  );
}

export default CustomerPortalView;

