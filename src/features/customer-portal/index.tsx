"use client";

import React from "react";
import { Loader2, ChefHat, Armchair, UtensilsCrossed, Edit2 } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";

// ViewModel
import { useCustomerViewModel } from "./viewmodel/useCustomerViewModel";

// Sub-components
import { LangSelectScreen } from "./components/LangSelectScreen";
import { NameEntryStep } from "./components/NameEntryStep";
import { SeatingStep } from "./components/SeatingStep";
import { MenuSection } from "./components/MenuSection";
import { OrderHistoryCard } from "./components/OrderHistoryCard";
import { CartBottomBar } from "./components/CartBottomBar";
import { DesktopCartSidebar } from "./components/DesktopCartSidebar";
import { ConfirmPlaceModal } from "./components/ConfirmPlaceModal";
import { OrderSuccessModal } from "./components/OrderSuccessModal";
import { OrdersOverviewBanner } from "./components/OrdersOverviewBanner";

/**
 * Customer Portal View (MVVM)
 * Ultra-Fast Single-Screen 100vh Tablet & Desktop POS Experience with Seating Setup
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin h-10 w-10 text-orange-500" />
          <p className="text-sm text-gray-500 font-medium">Setting up your table & session…</p>
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
    <div className="h-screen w-full flex flex-col overflow-hidden bg-gray-50/80">
      {/* ── Compact Streamlined Top Header (Responsive Single Row) ──────────────── */}
      <header className="h-14 bg-white border-b border-gray-200 px-2.5 sm:px-4 lg:px-6 flex items-center justify-between shrink-0 shadow-2xs z-20 gap-2">
        {/* Left: Brand & Guest Badge */}
        <div className="flex items-center gap-2 min-w-0 shrink">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-sm sm:text-base shadow-2xs shrink-0">
            Q
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-xs sm:text-sm font-black text-gray-900 leading-none whitespace-nowrap">
                {t.hotelName}
              </h1>
              {displayToken && (
                <span className="font-mono text-[9px] sm:text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.2 rounded-md font-black border border-orange-200 shrink-0">
                  🎫 {displayToken}
                </span>
              )}
            </div>
            <div className="text-[10px] sm:text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5 truncate font-medium">
              <span>
                {t.welcome},{" "}
                <strong className="text-gray-900 font-bold">{vm.guestName || "Guest"}</strong>
              </span>

              {/* Dynamic Seating Badge */}
              <button
                type="button"
                onClick={() => vm.setStep("seating")}
                className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 px-1.5 py-0.2 rounded-md font-extrabold text-[9px] sm:text-[10px] cursor-pointer transition active:scale-95"
                title="Change Seating / Party Size"
              >
                {vm.peopleCount === 1 ? (
                  <Armchair className="w-2.5 h-2.5 text-amber-700" />
                ) : (
                  <UtensilsCrossed className="w-2.5 h-2.5 text-amber-700" />
                )}
                <span>{vm.formattedSeatingLabel}</span>
                <Edit2 className="w-2 h-2 opacity-50" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Quick Menu / History Switcher & Lang */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 sm:p-1 rounded-xl border border-gray-200/60">
            <button
              type="button"
              onClick={() => vm.setActiveTab("menu")}
              className={`px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-black rounded-lg transition cursor-pointer ${
                vm.activeTab === "menu"
                  ? "bg-white text-gray-900 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.menu || "Menu"}
            </button>
            <button
              type="button"
              onClick={() => vm.hasOrders && vm.setActiveTab("history")}
              className={`px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-black rounded-lg transition flex items-center gap-1 cursor-pointer ${
                !vm.hasOrders
                  ? "text-gray-400 cursor-not-allowed opacity-50"
                  : vm.activeTab === "history"
                  ? "bg-white text-gray-900 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>{t.myOrders || "Orders"}</span>
              {vm.hasOrders && (
                <span className="bg-orange-500 text-white text-[9px] sm:text-[10px] rounded-full px-1.5 py-0.2 font-black">
                  {vm.myOrders!.length}
                </span>
              )}
            </button>
          </div>

          <LangSwitcher />
          <button
            type="button"
            onClick={vm.handleChangeName}
            className="hidden md:inline-flex text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 font-bold transition cursor-pointer active:scale-95"
          >
            {t.changeName}
          </button>
        </div>
      </header>

      {/* ── Main Viewport (100% Height Filled, Zero Window Scroll) ──── */}
      <main className="flex-1 min-h-0 w-full px-3 sm:px-4 lg:px-6 py-2.5 overflow-hidden">
        {vm.activeTab === "menu" && (
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch overflow-hidden">
            {/* Left Area: High-Density Food Matrix (Scrolls internally) */}
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
        )}

        {/* Order History Tab */}
        {vm.activeTab === "history" && (
          <div className="h-full max-w-4xl mx-auto overflow-y-auto pr-1 py-2 space-y-3 no-scrollbar">
            {vm.ordersLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
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
              <div className="text-center py-24 bg-white rounded-2xl border border-gray-200 text-gray-400">
                <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30 text-orange-400" />
                <p className="text-sm font-extrabold text-gray-700">{t.noPastOrders}</p>
                <p className="text-xs text-gray-400 mt-1">
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
          vm.setActiveTab("history");
        }}
      />
    </div>
  );
}

export default CustomerPortalView;
