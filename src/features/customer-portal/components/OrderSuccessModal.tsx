"use client";

import React from "react";
import { CheckCircle2, Ticket, ChefHat, ArrowRight, Sparkles, Utensils } from "lucide-react";
import { useLang } from "@/contexts/LangContext";

interface OrderSuccessModalProps {
  open: boolean;
  ticketNo?: string | null;
  guestName: string;
  orderTotal: number;
  onClose: () => void;
  onViewOrders: () => void;
}

export function OrderSuccessModal({
  open,
  ticketNo,
  guestName,
  orderTotal,
  onClose,
  onViewOrders,
}: OrderSuccessModalProps) {
  const { t } = useLang();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 dark:border-zinc-800 flex flex-col items-center text-center animate-in zoom-in-95">
        {/* Animated Celebration Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-inner">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
          {t.orderPlacedSuccess}
        </h2>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          {guestName ? `${guestName} — ` : ""}
          {t.dearGuestPrep}
        </p>

        {/* Material Ticket Token Box */}
        <div className="my-4 w-full bg-amber-50/80 dark:bg-amber-950/30 border-2 border-dashed border-amber-300 dark:border-amber-700/60 rounded-2xl p-4 flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
            <Ticket className="w-4 h-4" />
            <span>{t.yourTokenNumber}</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-wider mt-1">
            {ticketNo || "ORD-" + Math.floor(100 + Math.random() * 900)}
          </p>
          <div className="flex items-center justify-between w-full pt-2.5 mt-2.5 border-t border-amber-200/80 dark:border-amber-800/60 text-xs font-extrabold text-gray-800 dark:text-zinc-200">
            <span>{t.totalBillLabel}:</span>
            <span className="text-amber-700 dark:text-amber-400 text-sm font-black">
              Rs. {orderTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Cooking Status Notice */}
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2.5 rounded-xl mb-4 w-full justify-center border border-emerald-200/60 dark:border-emerald-800/40">
          <ChefHat className="w-4 h-4 text-emerald-600 animate-bounce" />
          <span>{t.cookingStarted}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 w-full">
          <button
            type="button"
            onClick={onViewOrders}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold rounded-2xl text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t.trackOrderBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-95 text-gray-700 dark:text-zinc-300 font-bold rounded-2xl text-xs transition cursor-pointer"
          >
            {t.orderMoreItems}
          </button>
        </div>
      </div>
    </div>
  );
}
