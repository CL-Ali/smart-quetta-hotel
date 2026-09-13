"use client";

import React from "react";
import { FaBagShopping, FaArrowRight, FaSpinner } from "react-icons/fa6";
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
    <div className="fixed bottom-[68px] left-0 right-0 z-30 px-3 pointer-events-none animate-in slide-in-from-bottom-3 duration-200">
      <div className="max-w-md mx-auto pointer-events-auto">
        <button
          type="button"
          onClick={handleClick}
          disabled={placing}
          className="w-full bg-stone-900/95 dark:bg-zinc-800/95 backdrop-blur-md text-white p-2.5 sm:p-3 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-between gap-3 border border-white/10 dark:border-zinc-700 cursor-pointer active:scale-[0.99]"
        >
          {/* Left: Cart Count & Total Price */}
          <div className="flex items-center gap-2.5 pl-1.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0 border border-amber-500/30">
              <FaBagShopping className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-medium text-stone-300 leading-tight">
                {totalItems} {totalItems === 1 ? "item" : "items"} selected
              </p>
              <p className="text-base font-black font-mono text-white leading-tight mt-0.5">
                Rs. {cartTotal.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Right: Checkout CTA */}
          <div className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm shrink-0 active:scale-95 transition-transform">
            {placing ? (
              <FaSpinner className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>{t.placeOrder || "Review & Order"}</span>
                <FaArrowRight className="w-3 h-3 rtl:rotate-180" />
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}


