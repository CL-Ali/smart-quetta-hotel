"use client";

import React from "react";
import { Receipt, Clock, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { OrderWithDetails } from "@/types/hotel";

interface OrdersOverviewBannerProps {
  orders: (OrderWithDetails | any)[];
  guestName: string;
  seatingLabel: string;
  ticketNo?: string | null;
}

export function OrdersOverviewBanner({
  orders,
  guestName,
  seatingLabel,
  ticketNo,
}: OrdersOverviewBannerProps) {
  const { t } = useLang();

  // Compute summary totals across all orders for this customer session
  const totalAmount = orders.reduce((sum, o) => sum + (o.totalAmount ?? o.total ?? 0), 0);
  const paidAmount = orders.reduce((sum, o) => sum + (o.paidAmount ?? 0), 0);
  const unpaidAmount = Math.max(0, totalAmount - paidAmount);

  // Count item preparation states
  let totalItems = 0;
  let cookingItems = 0;
  let readyItems = 0;
  let servedItems = 0;

  orders.forEach((o) => {
    o.items?.forEach((item: any) => {
      const q = item.quantity || 1;
      totalItems += q;
      const st = item.kitchenStatus || item.status || o.status || "pending";
      if (st === "preparing") cookingItems += q;
      else if (st === "ready") readyItems += q;
      else if (st === "served") servedItems += q;
    });
  });

  const allServed = totalItems > 0 && servedItems === totalItems;

  return (
    <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 rounded-3xl p-4 sm:p-5 text-white shadow-xl relative overflow-hidden mb-4 border border-orange-400/40">
      {/* Background Decorative Pattern */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-36 h-36 rounded-full bg-black/10 blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Customer & Ticket Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-white border border-white/20">
              {seatingLabel}
            </span>
            {ticketNo && (
              <span className="px-2 py-0.5 rounded-full bg-amber-900/40 text-[11px] font-mono font-bold text-amber-100 border border-amber-300/30">
                🎫 {ticketNo}
              </span>
            )}
            <span className="text-[11px] font-medium text-orange-100 flex items-center gap-1">
              <Clock className="w-3 h-3 inline" /> {orders.length} {t.orders || "Orders"}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black tracking-tight drop-shadow-xs">
            {guestName || "Guest"}
          </h2>

          {/* Cooking / Serving Live Status Badges */}
          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
            {cookingItems > 0 && (
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-lg font-bold text-amber-100 border border-white/20 animate-pulse">
                🔥 {cookingItems} {t.itemCooking}
              </span>
            )}
            {readyItems > 0 && (
              <span className="inline-flex items-center gap-1 bg-emerald-500/80 backdrop-blur-md px-2 py-0.5 rounded-lg font-bold text-white border border-emerald-300/40">
                <Sparkles className="w-3 h-3" /> {readyItems} {t.itemReady}
              </span>
            )}
            {servedItems > 0 && (
              <span className="inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-lg font-medium text-orange-100">
                <CheckCircle2 className="w-3 h-3 text-emerald-300" /> {servedItems} {t.itemServed}
              </span>
            )}
            {allServed && (
              <span className="inline-flex items-center gap-1 bg-emerald-600/90 px-2.5 py-0.5 rounded-lg font-extrabold text-white text-[11px] shadow-xs">
                ✨ {t.status.served}
              </span>
            )}
          </div>
        </div>

        {/* Right: Prominent Total Running Bill Card */}
        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/25 flex flex-col items-start md:items-end justify-center shrink-0 min-w-[200px]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-100 uppercase tracking-wider">
            <Receipt className="w-4 h-4 text-amber-200" />
            <span>{t.totalBillSoFar}</span>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mt-0.5 drop-shadow-xs">
            Rs. {totalAmount.toLocaleString()}
          </div>

          {/* Payment Status Pill */}
          <div className="flex items-center gap-2 mt-1.5 text-[11px] font-bold">
            {unpaidAmount > 0 ? (
              <span className="bg-red-500/80 text-white px-2 py-0.5 rounded-md border border-red-300/30 flex items-center gap-1">
                <AlertCircle className="w-2.5 h-2.5" />
                {t.unpaidAmountLabel}: Rs. {unpaidAmount.toLocaleString()}
              </span>
            ) : (
              <span className="bg-emerald-600/90 text-white px-2 py-0.5 rounded-md border border-emerald-300/30 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                {t.payStatus.paid}
              </span>
            )}
            {paidAmount > 0 && unpaidAmount > 0 && (
              <span className="text-orange-100 text-[10px]">
                ({t.paidAmountLabel}: Rs. {paidAmount.toLocaleString()})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
