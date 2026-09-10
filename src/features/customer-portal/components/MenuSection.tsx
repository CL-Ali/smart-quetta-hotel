"use client";

import React from "react";
import { Loader2, Utensils, Plus, Minus } from "lucide-react";
import { MenuItem, CartItem } from "@/types/hotel";
import { useLang } from "@/contexts/LangContext";

interface MenuSectionProps {
  menu?: MenuItem[];
  isLoading: boolean;
  cart: CartItem[];
  onAdd: (item: MenuItem) => void;
  onDec: (id: number) => void;
}

export function MenuSection({
  menu,
  isLoading,
  cart,
  onAdd,
  onDec,
}: MenuSectionProps) {
  const { t } = useLang();

  const getQty = (id: number) => cart.find((c) => c.id === id)?.quantity ?? 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin h-7 w-7 text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 space-y-2">
      {menu?.map((item) => {
        const qty = getQty(item.id);
        return (
          <div
            key={item.id}
            className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-xs"
          >
            <div className="flex items-stretch">
              {item.imageUrl ? (
                <div className="w-24 h-24 shrink-0 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 shrink-0 bg-gray-100 flex items-center justify-center text-gray-400">
                  <Utensils className="w-8 h-8" />
                </div>
              )}

              <div className="flex-1 px-3 py-3 flex flex-col justify-between min-w-0">
                <div>
                  <p className="font-semibold text-sm">{item.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-base font-bold text-orange-600">Rs. {item.price}</span>

                  {qty === 0 ? (
                    <button
                      type="button"
                      onClick={() => onAdd(item)}
                      className="flex items-center gap-1 bg-black hover:bg-black/90 active:scale-95 transition text-white text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> {t.addToCart}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onDec(item.id)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5 text-gray-700" />
                      </button>
                      <span className="w-5 text-center font-bold text-sm">{qty}</span>
                      <button
                        type="button"
                        onClick={() => onAdd(item)}
                        className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 active:scale-95 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
