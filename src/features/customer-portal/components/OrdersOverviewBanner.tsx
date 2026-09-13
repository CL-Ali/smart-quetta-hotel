"use client";

import React from "react";
import { FaReceipt, FaClock, FaCheck, FaFire, FaTicket } from "react-icons/fa6";
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
    <div className="bg-stone-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl p-4 sm:p-5 shadow-sm mb-4 border border-stone-800 dark:border-stone-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Customer & Ticket Info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-white/10 dark:bg-zinc-900/10 text-xs font-semibold">
              {seatingLabel}
            </span>
            {ticketNo && (
              <span className="px-2 py-0.5 rounded-md bg-white/10 dark:bg-zinc-900/10 text-xs font-mono font-bold">
                {ticketNo}
              </span>
            )}
            <span className="text-xs opacity-75 flex items-center gap-1">
              <FaClock className="w-3 h-3 inline" /> {orders.length} {orders.length === 1 ? "Order" : "Orders"}
            </span>
          </div>

          <h2 className="text-lg font-bold tracking-tight">
            {guestName || "Guest"}
          </h2>

          {/* Kitchen status indicators */}
          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
            {cookingItems > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 dark:text-amber-700 px-2 py-0.5 rounded-md font-medium border border-amber-500/30">
                <FaFire className="w-2.5 h-2.5" />
                <span>{cookingItems} {t.itemCooking || "Cooking"}</span>
              </span>
            )}
            {readyItems > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 dark:text-emerald-700 px-2 py-0.5 rounded-md font-medium border border-emerald-500/30">
                <FaCheck className="w-2.5 h-2.5" />
                <span>{readyItems} {t.itemReady || "Ready"}</span>
              </span>
            )}
            {servedItems > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-white/10 dark:bg-zinc-900/10 px-2 py-0.5 rounded-md opacity-80">
                <FaCheck className="w-2.5 h-2.5" />
                <span>{servedItems} {t.itemServed || "Served"}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Bill Summary */}
        <div className="bg-white/5 dark:bg-zinc-900/5 rounded-xl p-3 border border-white/10 dark:border-zinc-900/10 flex flex-col items-start md:items-end justify-center shrink-0 min-w-[180px]">
          <span className="text-xs opacity-75 font-medium">Session Total</span>
          <span className="text-xl font-bold font-mono tracking-tight my-0.5">
            Rs. {totalAmount.toLocaleString()}
          </span>

          <div className="text-[11px] flex items-center gap-2 font-mono">
            {unpaidAmount > 0 ? (
              <span className="text-amber-400 dark:text-amber-700 font-bold">
                Unpaid: Rs. {unpaidAmount.toLocaleString()}
              </span>
            ) : (
              <span className="text-emerald-400 dark:text-emerald-700 font-bold flex items-center gap-1">
                <FaCheck className="w-2.5 h-2.5" />
                <span>Bill Paid</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
