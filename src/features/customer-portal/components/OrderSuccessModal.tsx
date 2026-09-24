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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in-50">
      <div className="bg-white dark:bg-[#121824] rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 max-w-sm w-full border-0 shadow-none flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Clean Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center my-2 border-0">
          <FaCircleCheck className="w-8 h-8" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-black text-[#24180A] dark:text-white mt-2">
          {t.orderPlacedSuccess || "Order Sent to Kitchen"}
        </h2>

        <p className="text-xs text-[#786B5D] dark:text-zinc-400 font-medium mt-1">
          {guestName ? `${guestName} • ` : ""}
          {t.dearGuestPrep || "Your food is now being prepared"}
        </p>

        {/* Clean Ticket Box */}
        <div className="my-5 w-full bg-[#F8F3EC] dark:bg-[#1A2232] rounded-2xl p-4 flex flex-col items-center border-0">
          <div className="flex items-center justify-between w-full mb-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#786B5D] dark:text-zinc-400">
              <FaTicket className="w-3.5 h-3.5 text-[#D98A3C]" />
              <span>{t.yourTokenNumber || "Order Token"}</span>
            </div>

            <button
              type="button"
              onClick={() => playOrderSuccessSound()}
              title="Play Tune"
              className="p-1 rounded-full text-[#786B5D] hover:text-[#24180A] dark:hover:text-white text-[10px] flex items-center gap-1 cursor-pointer transition"
            >
              <FaVolumeHigh className="w-3.5 h-3.5 text-[#D98A3C]" />
            </button>
          </div>

          <p className="text-3xl font-black font-mono text-[#D98A3C] tracking-wider my-1.5">
            {ticketNo || "TKT-001"}
          </p>

          <p className="text-xs font-mono font-bold text-[#4A3E31] dark:text-zinc-300">
            Bill Total: Rs. {orderTotal.toLocaleString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onViewOrders();
            }}
            className="w-full h-12 bg-[#D98A3C] hover:bg-[#C27930] text-white text-xs font-black rounded-full flex items-center justify-center gap-2 transition cursor-pointer shadow-none active:scale-[0.98]"
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
            className="w-full h-11 bg-[#F8F3EC] dark:bg-[#1A2232] hover:bg-[#EFE6DC] dark:hover:bg-[#222C40] text-[#4A3E31] dark:text-zinc-200 text-xs font-bold rounded-full transition cursor-pointer border-0 active:scale-[0.98]"
          >
            {"Order More Items"}
          </button>
        </div>
      </div>
    </div>
  );
}
