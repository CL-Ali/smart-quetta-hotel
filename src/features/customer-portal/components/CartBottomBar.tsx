"use client";

import React from "react";
import { ShoppingBag, Loader2, ArrowRight, Zap } from "lucide-react";
import { CartItem } from "@/types/hotel";
import { useLang } from "@/contexts/LangContext";
import { playOrderSuccessSound } from "@/lib/sound";

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
  const { t, lang } = useLang();

  if (cart.length === 0) return null;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleClick = () => {
    playOrderSuccessSound();
    onCheckout();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-gradient-to-t from-black/20 to-transparent pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <button
          type="button"
          onClick={handleClick}
          disabled={placing}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white p-3.5 sm:p-4 rounded-2xl shadow-xl transition flex items-center justify-between gap-3 border-2 border-emerald-400/30 cursor-pointer"
        >
          {/* Left: Cart Badge & Total Amount */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
              <ShoppingBag className="w-5 h-5 fill-white/20" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">
                {totalItems} {totalItems === 1 ? "Item" : "Items"}
              </p>
              <p className="text-base sm:text-lg font-black leading-tight text-white">
                Rs. {cartTotal}
              </p>
            </div>
          </div>

          {/* Right: Lightning Fast Order Action */}
          <div className="flex items-center gap-2 bg-white text-emerald-800 font-black px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md">
            {placing ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
            ) : (
              <>
                <Zap className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                <span>{lang === "ur" ? "آرڈر بھیجیں" : "Place Order"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
