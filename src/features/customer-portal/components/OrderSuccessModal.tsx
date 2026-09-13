"use client";

import React, { useEffect } from "react";
import { FaCircleCheck, FaTicket, FaArrowRight, FaVolumeHigh } from "react-icons/fa6";
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
  const { t } = useLang();

  useEffect(() => {
    if (open) {
      playOrderSuccessSound();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-sm w-full shadow-xl border border-stone-200 dark:border-zinc-800 flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Clean Success Icon */}
        <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center my-2 border border-emerald-200 dark:border-emerald-800">
          <FaCircleCheck className="w-7 h-7" />
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-stone-900 dark:text-white mt-1">
          {t.orderPlacedSuccess || "Order Sent to Kitchen"}
        </h2>

        <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
          {guestName ? `${guestName} • ` : ""}
          {t.dearGuestPrep || "Your food is now being prepared"}
        </p>

        {/* Clean Ticket Box */}
        <div className="my-4 w-full bg-stone-50 dark:bg-zinc-800/70 border border-stone-200 dark:border-zinc-700 rounded-xl p-3.5 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-zinc-400">
              <FaTicket className="w-3 h-3 text-stone-400" />
              <span>{t.yourTokenNumber || "Order Token"}</span>
            </div>

            <button
              type="button"
              onClick={() => playOrderSuccessSound()}
              title="Play Tune"
              className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-[10px] flex items-center gap-1 cursor-pointer"
            >
              <FaVolumeHigh className="w-3 h-3" />
            </button>
          </div>

          <p className="text-2xl font-black font-mono text-stone-900 dark:text-white tracking-wider my-1">
            {ticketNo || "TKT-001"}
          </p>

          <p className="text-xs font-mono font-medium text-stone-500 dark:text-zinc-400">
            Bill Total: Rs. {orderTotal.toLocaleString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onViewOrders();
            }}
            className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <span>{t.myOrders || "Track Kitchen Progress"}</span>
            <FaArrowRight className="w-3 h-3 rtl:rotate-180" />
          </button>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="w-full h-10 border border-stone-200 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            {"Order More Items"}
          </button>
        </div>
      </div>
    </div>
  );
}
