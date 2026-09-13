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
  const { t } = useLang();

  if (cart.length === 0) return null;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleClick = () => {
    playOrderSuccessSound();
    onCheckout();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 p-3 pb-safe bg-gradient-to-t from-black/40 via-black/20 to-transparent pointer-events-none animate-in slide-in-from-bottom-5">
      <div className="max-w-md mx-auto pointer-events-auto">
        <button
          type="button"
          onClick={handleClick}
          disabled={placing}
          className="w-full bg-stone-900/95 dark:bg-zinc-900/95 backdrop-blur-xl hover:bg-black active:scale-[0.98] text-white p-3 sm:p-3.5 rounded-3xl shadow-2xl transition-all flex items-center justify-between gap-3 border border-white/15 cursor-pointer ring-1 ring-black/5"
        >
          {/* Left: Cart Icon Badge & Total Amount */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center font-black text-sm text-amber-400 shrink-0">
              <ShoppingBag className="w-5 h-5 fill-amber-400/20" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-extrabold text-stone-300 uppercase tracking-wider">
                {totalItems} {t.orderSummary || "Items"}
              </p>
              <p className="text-base sm:text-lg font-black leading-tight text-white font-mono">
                Rs. {cartTotal.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Right: High-Impact Material CTA Action */}
          <div className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-transform active:scale-95">
            {placing ? (
              <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
            ) : (
              <>
                <Zap className="w-4 h-4 fill-stone-950 text-stone-950" />
                <span>{t.confirmOrder || t.placeOrder}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
