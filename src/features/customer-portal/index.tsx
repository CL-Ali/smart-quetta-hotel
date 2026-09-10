"use client";

import React from "react";
import { Loader2, ChefHat } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";

// ViewModel
import { useCustomerViewModel } from "./viewmodel/useCustomerViewModel";

// Sub-components
import { LangSelectScreen } from "./components/LangSelectScreen";
import { NameEntryStep } from "./components/NameEntryStep";
import { MenuSection } from "./components/MenuSection";
import { OrderHistoryCard } from "./components/OrderHistoryCard";
import { CartBottomBar } from "./components/CartBottomBar";
import { ConfirmPlaceModal } from "./components/ConfirmPlaceModal";

/**
 * Customer Portal View (MVVM)
 * Pure UI Layer consuming useCustomerViewModel
 */
export function CustomerPortalView() {
  const { t } = useLang();
  const vm = useCustomerViewModel();

  // 1. Initial Language Selection Step
  if (vm.step === "lang") {
    return <LangSelectScreen onDone={() => vm.setStep("name")} />;
  }

  // 2. Checking stored session
  if (vm.isVerifyingSession) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin h-10 w-10 text-orange-500" />
          <p className="text-sm text-gray-500">Checking your session…</p>
        </div>
      </div>
    );
  }

  // 3. Opening fresh visit
  if (vm.isOpeningVisit) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin h-10 w-10 text-orange-500" />
          <p className="text-sm text-gray-500">Starting your visit…</p>
        </div>
      </div>
    );
  }

  // 4. Name entry onboarding step
  if (vm.step === "name") {
    return (
      <NameEntryStep
        guestName={vm.guestName}
        guestPhone={vm.guestPhone}
        previousName={vm.previousName}
        isBusy={vm.isNameBusy}
        isResuming={vm.isResuming}
        setGuestName={vm.setGuestName}
        setGuestPhone={vm.setGuestPhone}
        onSubmit={vm.handleNameSubmit}
      />
    );
  }

  // 5. Active Menu & History Screen
  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ paddingBottom: vm.cartCount > 0 ? "9rem" : "1.5rem" }}
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-2xs">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-lg font-bold">{t.hotelName}</h1>
              <p className="text-xs text-gray-500">
                {t.welcome}, {vm.guestName}
              </p>
              {vm.ticketNo && (
                <p className="text-[10px] text-gray-400 mt-0.5 font-mono tracking-wide">
                  🎫 {vm.ticketNo}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <LangSwitcher />
              <button
                type="button"
                onClick={vm.handleChangeName}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                {t.changeName}
              </button>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => vm.setActiveTab("menu")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition cursor-pointer ${
                vm.activeTab === "menu" ? "bg-white shadow-xs text-black" : "text-gray-500"
              }`}
            >
              {t.menu}
            </button>
            <button
              type="button"
              onClick={() => vm.hasOrders && vm.setActiveTab("history")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                !vm.hasOrders
                  ? "text-gray-300 cursor-not-allowed"
                  : vm.activeTab === "history"
                  ? "bg-white shadow-xs text-black"
                  : "text-gray-500"
              }`}
            >
              {t.myOrders}
              {vm.hasOrders && (
                <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {vm.myOrders!.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Tab */}
      {vm.activeTab === "menu" && (
        <MenuSection
          menu={vm.menu}
          isLoading={vm.menuLoading}
          cart={vm.cart}
          onAdd={vm.handleAddToCart}
          onDec={vm.handleDecFromCart}
        />
      )}

      {/* Order History Tab */}
      {vm.activeTab === "history" && (
        <div className="max-w-lg mx-auto px-4 pt-4 space-y-2">
          {vm.ordersLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin h-7 w-7 text-orange-500" />
            </div>
          ) : vm.myOrders && vm.myOrders.length > 0 ? (
            vm.myOrders.map((order) => <OrderHistoryCard key={order.id} order={order} />)
          ) : (
            <div className="text-center py-20 text-gray-400">
              <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No orders yet</p>
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Cart Summary */}
      {vm.cartCount > 0 && vm.activeTab === "menu" && (
        <CartBottomBar
          cart={vm.cart}
          cartTotal={vm.cartTotal}
          placing={vm.placing}
          onRemoveItem={vm.handleRemoveFromCart}
          onCheckout={() => vm.setConfirmPlace(true)}
        />
      )}

      {/* Place Order Confirmation Modal */}
      <ConfirmPlaceModal
        open={vm.confirmPlace}
        cart={vm.cart}
        cartTotal={vm.cartTotal}
        onClose={() => vm.setConfirmPlace(false)}
        onConfirm={vm.handlePlaceOrder}
      />
    </div>
  );
}

export default CustomerPortalView;
