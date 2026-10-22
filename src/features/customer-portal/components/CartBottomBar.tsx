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
    <div className="fixed bottom-[68px] left-0 right-0 z-30 px-4 pointer-events-none animate-in slide-in-from-bottom-3 duration-200">
      <div className="max-w-md mx-auto pointer-events-auto">
        <button
          type="button"
          onClick={handleClick}
          disabled={placing}
          className="w-full bg-[#121824] text-white p-2.5 sm:p-3 rounded-full border border-stone-800 shadow-2xl shadow-black/40 ring-1 ring-white/10 transition-all flex items-center justify-between gap-3 cursor-pointer active:scale-[0.98]"
        >
          {/* Left: Cart Count & Total Price */}
          <div className="flex items-center gap-2.5 pl-2">
            <div className="w-10 h-10 rounded-full bg-[#D98A3C]/20 text-[#D98A3C] flex items-center justify-center font-bold shrink-0">
              <FaBagShopping className="w-4 h-4" />
            </div>
            <div className="text-left rtl:text-right">
              <p className="text-[11px] font-medium text-stone-300 leading-tight">
                {totalItems} {totalItems === 1 ? "item" : "items"} selected
              </p>
              <p className="text-base font-black font-mono text-[#D98A3C] leading-tight mt-0.5">
                Rs. {cartTotal.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Right: Checkout CTA */}
          <div className="flex items-center gap-1.5 bg-[#D98A3C] hover:bg-[#C27930] text-stone-950 font-black px-5 py-2.5 rounded-full text-xs shrink-0 active:scale-95 transition-transform shadow-md shadow-amber-500/20">
            {placing ? (
              <FaSpinner className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>{t.placeOrder || "Place Order"}</span>
                <FaArrowRight className="w-3 h-3 rtl:rotate-180" />
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}


