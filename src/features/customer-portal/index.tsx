"use client";

import React from "react";
import { Loader2, ChefHat, Armchair, UtensilsCrossed, Edit2, Flame } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import { playTapSound } from "@/lib/sound";

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
 * Ultra-Fast Mobile-First POS Experience with Seating Setup & Live Active Kitchen Tracking
 */
export function CustomerPortalView() {
  const { t } = useLang();
  const vm = useCustomerViewModel();

  // 1. Initial Language Selection Step
  if (vm.step === "lang") {
    return <LangSelectScreen onDone={() => vm.setStep(vm.guestName ? "seating" : "name")} />;
  }

  // 2. Opening fresh visit / loading
  if (vm.isOpeningVisit) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin h-10 w-10 text-amber-500" />
          <p className="text-sm text-stone-500 font-medium">Setting up your table & session…</p>
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

  // Format ticket/token number cleanly
  const displayToken = vm.ticketNo
    ? vm.ticketNo.startsWith("VIS-")
      ? `Token #${vm.ticketNo.split("-")[1] || vm.ticketNo}`
      : vm.ticketNo.startsWith("TKT-") || vm.ticketNo.startsWith("ORD-")
      ? vm.ticketNo
      : `Token #${vm.ticketNo}`
    : null;

  // 5. Active Single-Screen Viewport (Zero Window Scroll on Desktop/Tablet)
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-stone-50 dark:bg-zinc-950">
      {/* ── Tier 1: Main Brand, Segmented Navigation Tabs & Lang Switcher ────────── */}
      <header className="h-12 sm:h-13 bg-white dark:bg-zinc-900 border-b border-stone-200/80 dark:border-zinc-800 px-3 sm:px-4 lg:px-6 flex items-center justify-between shrink-0 shadow-2xs z-20 gap-2">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-xs sm:text-sm shadow-2xs">
            Q
          </div>
          <span className="hidden sm:inline text-xs sm:text-sm font-black text-stone-900 dark:text-white">
            {t.hotelName}
          </span>
        </div>

        {/* Center: 3-Tier Segmented Tabs */}
        <div className="flex items-center bg-stone-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-stone-200/80 dark:border-zinc-700">
          {/* 1. Menu Tab */}
          <button
            type="button"
            onClick={() => {
              playTapSound();
              vm.setActiveTab("menu");
            }}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
              vm.activeTab === "menu"
                ? "bg-white dark:bg-zinc-900 text-stone-900 dark:text-white shadow-xs font-black"
                : "text-stone-600 dark:text-zinc-400 hover:text-stone-900"
            }`}
          >
            {t.menu || "Menu"}
          </button>

          {/* 2. Live Active Orders (Non-Served) Tab */}
          <button
            type="button"
            onClick={() => {
              playTapSound();
              vm.setActiveTab("active");
            }}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer ${
              vm.activeTab === "active"
                ? "bg-white dark:bg-zinc-900 text-stone-900 dark:text-white shadow-xs font-black"
                : "text-stone-600 dark:text-zinc-400 hover:text-stone-900"
            }`}
          >
            <Flame
              className={`w-3.5 h-3.5 ${
                vm.hasActiveOrders
                  ? "text-amber-500 fill-amber-500 animate-pulse"
                  : "text-stone-400"
              }`}
            />
            <span>{t.activeKitchen || "Active"}</span>
            {vm.activeItemsCount > 0 && (
              <span className="bg-stone-900 text-amber-400 dark:bg-amber-500 dark:text-stone-950 text-[10px] rounded-full px-1.5 font-bold font-mono">
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
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer ${
              !vm.hasOrders
                ? "text-stone-400 dark:text-zinc-600 cursor-not-allowed opacity-50"
                : vm.activeTab === "history"
                ? "bg-white dark:bg-zinc-900 text-stone-900 dark:text-white shadow-xs font-black"
                : "text-stone-600 dark:text-zinc-400 hover:text-stone-900"
            }`}
          >
            <span>{t.myOrders || "Orders"}</span>
            {vm.hasOrders && (
              <span className="bg-stone-200 dark:bg-zinc-700 text-stone-800 dark:text-zinc-200 text-[10px] rounded-full px-1.5 font-bold font-mono">
                {vm.myOrders!.length}
              </span>
            )}
          </button>
        </div>

        {/* Right: Language Switcher */}
        <div className="shrink-0">
          <LangSwitcher />
        </div>
      </header>

      {/* ── Tier 2: User Context & Seating Sub-Bar (Next Line on All Screens) ─────── */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs border-b border-stone-200/70 dark:border-zinc-800/70 px-3 sm:px-4 lg:px-6 py-1.5 flex items-center justify-between gap-2 shrink-0">
        {/* Left: Guest Name & Clear Ticket ID */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-xs font-bold text-stone-800 dark:text-zinc-200 truncate">
            {vm.guestName || "Guest"}
          </span>
          {displayToken && (
            <span className="bg-stone-100 dark:bg-zinc-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-zinc-700 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md shrink-0">
              🎫 {displayToken}
            </span>
          )}
        </div>

        {/* Right: Seating Pill & Change Seating Action */}
        <button
          type="button"
          onClick={() => {
            playTapSound();
            vm.setStep("seating");
          }}
          className="inline-flex items-center gap-1.5 bg-stone-50 hover:bg-stone-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-800 dark:text-zinc-200 px-2.5 py-0.8 rounded-xl text-[11px] font-bold border border-stone-200 dark:border-zinc-700 shadow-2xs cursor-pointer transition active:scale-95 shrink-0"
          title="Change Seating"
        >
          {vm.peopleCount === 1 ? (
            <Armchair className="w-3 h-3 text-amber-600" />
          ) : (
            <UtensilsCrossed className="w-3 h-3 text-amber-600" />
          )}
          <span>{vm.formattedSeatingLabel}</span>
          <Edit2 className="w-2.5 h-2.5 opacity-50 ml-0.5" />
        </button>
      </div>

      {/* ── Main Viewport ────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 w-full px-3 sm:px-4 lg:px-6 py-2 overflow-hidden">
        {/* 1. Menu Tab */}
        {vm.activeTab === "menu" && (
          <div className="h-full flex flex-col overflow-hidden space-y-1.5">
            {/* Sleek Minimal Kitchen Notification Pill (if active non-served items exist) */}
            {vm.hasActiveOrders && (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  vm.setActiveTab("active");
                }}
                className="w-full bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:hover:bg-zinc-800 border border-stone-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 transition cursor-pointer text-left shrink-0 shadow-2xs group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                    <Flame className="w-3 h-3 fill-current animate-pulse" />
                  </div>
                  <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">
                    {displayToken ? `${displayToken}: ` : ""}{vm.activeItemsCount} {t.nonServedItems || "items being cooked in kitchen"}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                  {t.trackOrderBtn || "Track Live"} →
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

        {/* 2. Active Orders (Non-Served Items with Sub-Tabs) */}
        {vm.activeTab === "active" && (
          <div className="h-full max-w-2xl mx-auto overflow-hidden">
            <ActiveOrdersTab
              orders={vm.myOrders || []}
              guestName={vm.guestName}
              seatingLabel={vm.formattedSeatingLabel}
              ticketNo={vm.ticketNo}
              onOrderMore={() => vm.setActiveTab("menu")}
              onViewAllOrders={() => vm.setActiveTab("history")}
            />
          </div>
        )}

        {/* 3. All Orders History Tab */}
        {vm.activeTab === "history" && (
          <div className="h-full max-w-4xl mx-auto overflow-y-auto pr-1 py-2 space-y-3 no-scrollbar">
            {vm.ordersLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin h-8 w-8 text-amber-500" />
              </div>
            ) : vm.myOrders && vm.myOrders.length > 0 ? (
              <>
                <OrdersOverviewBanner
                  orders={vm.myOrders}
                  guestName={vm.guestName}
                  seatingLabel={vm.formattedSeatingLabel}
                  ticketNo={vm.ticketNo}
                />
                <div className="space-y-3">
                  {vm.myOrders.map((order, idx) => (
                    <OrderHistoryCard key={order.id} order={order} defaultOpen={idx === 0 || order.status !== "served"} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200 dark:border-zinc-800 text-stone-400">
                <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-500" />
                <p className="text-sm font-extrabold text-stone-700 dark:text-stone-300">{t.noPastOrders}</p>
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

