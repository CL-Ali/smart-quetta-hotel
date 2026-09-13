"use client";

import React from "react";
import { ShoppingBag, Loader2, ArrowRight } from "lucide-react";
import { CartItem } from "@/types/hotel";
import { useLang } from "@/contexts/LangContext";
import { playTapSound, unlockAudio } from "@/lib/sound";

interface CartBottomBarProps {
  cart: CartItem[];
  cartTotal: number;
  placing: boolean;
  onRemoveItem: (id: number) => void;
  onCheckout: () => void;
}

export function CartBottomBar({
  cart,
  cartTotal,
  placing,
  onCheckout,
}: CartBottomBarProps) {
  const { t } = useLang();

  if (cart.length === 0) return null;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleClick = () => {
    unlockAudio();
    playTapSound();
    onCheckout();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 p-3 pb-safe pointer-events-none animate-in slide-in-from-bottom-4">
      <div className="max-w-md mx-auto pointer-events-auto">
        <button
          type="button"
          onClick={handleClick}
          disabled={placing}
          className="w-full bg-stone-950/95 dark:bg-zinc-900/95 backdrop-blur-xl hover:bg-black active:scale-[0.98] text-white p-2.5 sm:p-3 rounded-2xl shadow-2xl transition-all flex items-center justify-between gap-3 border border-stone-800/90 cursor-pointer group"
        >
          {/* Left: Cart Icon Badge & Total Amount */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 shrink-0 shadow-2xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-bold text-stone-400 leading-tight">
                {totalItems} {totalItems === 1 ? "Item" : "Items"}
              </p>
              <p className="text-sm sm:text-base font-black text-white font-mono leading-tight mt-0.5">
                Rs. {cartTotal.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Right: Primary CTA Action (Warm Amber Gold) */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 shrink-0">
            {placing ? (
              <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
            ) : (
              <>
                <span>{t.placeOrder || "Place Order"}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-0.5 transition-transform stroke-[2.5]" />
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

