"use client";

import React, { useEffect } from "react";
import {
  CheckCircle2,
  Ticket,
  ChefHat,
  ArrowRight,
  Sparkles,
  Volume2,
  Flame,
  Clock,
} from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { playOrderSuccessSound, playTapSound } from "@/lib/sound";

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
  const { t, lang } = useLang();

  // Play triumphant fanfare upon opening modal
  useEffect(() => {
    if (open) {
      playOrderSuccessSound();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in-50">
      {/* ── Confetti Particle Burst ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <span className="absolute top-1/4 left-1/6 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping opacity-75" />
        <span className="absolute top-1/3 right-1/5 w-3 h-3 bg-emerald-400 rounded-full animate-bounce opacity-80" />
        <span className="absolute top-1/2 left-1/10 w-2 h-4 bg-orange-500 rotate-45 animate-pulse opacity-70" />
        <span className="absolute top-2/5 right-1/10 w-2.5 h-2.5 bg-yellow-300 rounded-sm animate-spin opacity-80" />
        <span className="absolute top-1/6 right-1/3 w-3 h-1.5 bg-red-400 rounded-full animate-pulse opacity-70" />
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-stone-200/90 dark:border-zinc-800 flex flex-col items-center text-center relative overflow-hidden animate-in zoom-in-95">
        {/* Top Celebration Glow */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-500" />

        {/* Animated Celebration Icon with Pulsing Halo */}
        <div className="relative my-2">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30 animate-ping scale-110" />
          <div className="w-18 h-18 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center relative shadow-lg shadow-emerald-500/20 border-2 border-emerald-300/60 dark:border-emerald-700/60">
            <CheckCircle2 className="w-11 h-11 stroke-[2.5] animate-in zoom-in-50" />
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center gap-1.5 mt-2">
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white leading-tight">
            {t.orderPlacedSuccess || "Order Placed Successfully!"}
          </h2>
          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
        </div>

        <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
          {guestName ? `${guestName} — ` : ""}
          {t.dearGuestPrep || "Your fresh order is on its way to the kitchen!"}
        </p>

        {/* Golden Ticket Token Box */}
        <div className="my-4 w-full bg-gradient-to-br from-amber-50 via-amber-50/60 to-orange-50/40 dark:from-amber-950/40 dark:via-zinc-900 dark:to-orange-950/20 border-2 border-dashed border-amber-300 dark:border-amber-700/80 rounded-2xl p-4 flex flex-col items-center relative shadow-xs">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              <Ticket className="w-4 h-4 text-amber-600" />
              <span>{t.yourTokenNumber || "Order Token"}</span>
            </div>

            {/* Replay Sound Button */}
            <button
              type="button"
              onClick={() => {
                playOrderSuccessSound();
              }}
              title="Play Tune"
              className="p-1 rounded-lg bg-amber-200/50 dark:bg-amber-900/50 hover:bg-amber-300/50 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer active:scale-90"
            >
              <Volume2 className="w-3 h-3" />
              <span>Tune 🎵</span>
            </button>
          </div>

          <p className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-wider my-1.5 drop-shadow-xs">
            {ticketNo || "ORD-" + Math.floor(100 + Math.random() * 900)}
          </p>

          <div className="flex items-center justify-between w-full pt-2.5 mt-1 border-t border-amber-200/80 dark:border-amber-800/60 text-xs font-extrabold text-stone-800 dark:text-zinc-200">
            <span>{t.totalBillLabel || "Total Bill"}:</span>
            <span className="text-amber-700 dark:text-amber-400 text-sm sm:text-base font-mono font-black">
              Rs. {orderTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Live Kitchen Preparation Status Indicator */}
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/40 px-3.5 py-2.5 rounded-xl mb-4 w-full justify-center border border-emerald-200/80 dark:border-emerald-800/50 shadow-xs">
          <Flame className="w-4 h-4 text-orange-500 animate-pulse fill-orange-500" />
          <span>{t.cookingStarted || "Cooking started in kitchen"}</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
            (5-10m)
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onViewOrders();
            }}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t.trackOrderBtn || "Track Order Live"}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="w-full h-11 border border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800 active:scale-95 text-stone-700 dark:text-zinc-300 font-bold rounded-2xl text-xs transition cursor-pointer"
          >
            {t.orderMoreItems || "+ Add More Items"}
          </button>
        </div>
      </div>
    </div>
  );
}

