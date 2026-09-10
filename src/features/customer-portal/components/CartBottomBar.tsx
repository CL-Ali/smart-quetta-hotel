"use client";

import React from "react";
import { ShoppingCart, Loader2, X } from "lucide-react";
import { CartItem } from "@/types/hotel";
import { useLang } from "@/contexts/LangContext";

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
  onRemoveItem,
  onCheckout,
}: CartBottomBarProps) {
  const { t } = useLang();

  if (cart.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
      <div className="max-w-lg mx-auto space-y-2">
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center text-xs bg-gray-50 px-3 py-1.5 rounded-lg"
            >
              <span className="font-medium">
                {item.name} <span className="text-gray-400">×{item.quantity}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-orange-600 font-semibold">
                  Rs. {(item.price * item.quantity).toFixed(0)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="text-gray-300 hover:text-red-400 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onCheckout}
          disabled={placing}
          className="w-full h-14 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] transition text-white rounded-2xl font-bold text-base flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer shadow-md"
        >
          {placing ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              <span>{t.placeOrder}</span>
              <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm">
                Rs. {cartTotal.toFixed(0)}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
