"use client";

import React, { useMemo } from "react";
import {
  FaReceipt,
  FaCheck,
  FaFire,
  FaTicket,
  FaWandMagicSparkles,
  FaLayerGroup,
  FaHourglassHalf,
  FaCircleCheck,
} from "react-icons/fa6";
import { useLang } from "@/contexts/LangContext";
import { OrderWithDetails } from "@/types/hotel";
import { playTapSound } from "@/lib/sound";
import { isOrderOpenByDefault } from "@/lib/time";

interface OrdersOverviewBannerProps {
  orders: (OrderWithDetails | any)[];
  selectedFilter?: string;
  onSelectFilter?: (filter: string) => void;
  guestName?: string;
  seatingLabel?: string;
  ticketNo?: string | null;
}

export function OrdersOverviewBanner({
  orders,
  selectedFilter = "active",
  onSelectFilter,
}: OrdersOverviewBannerProps) {
  const { t, lang } = useLang();

  // Compute metrics ONLY according to uncollapsed (active / unpaid session from last 24h) orders
  const activeSessionOrders = useMemo(() => {
    return orders.filter((o) => isOrderOpenByDefault(o));
  }, [orders]);

  // Compute summary totals for uncollapsed session
  const totalAmount = activeSessionOrders.reduce(
    (sum, o) => sum + (o.totalAmount ?? o.total ?? 0),
    0
  );
  const paidAmount = activeSessionOrders.reduce((sum, o) => sum + (o.paidAmount ?? 0), 0);
  const unpaidAmount = Math.max(0, totalAmount - paidAmount);

  // Count item preparation states for uncollapsed session
  let totalItems = 0;
  let cookingItems = 0;
  let readyItems = 0;
  let servedItems = 0;
  let pendingItems = 0;

  activeSessionOrders.forEach((o) => {
    o.items?.forEach((item: any) => {
      const q = item.quantity || 1;
      totalItems += q;
      const st = item.kitchenStatus || item.status || o.status || "pending";
      if (st === "preparing") cookingItems += q;
      else if (st === "ready") readyItems += q;
      else if (st === "served") servedItems += q;
      else if (st === "pending") pendingItems += q;
    });
  });

  // Extract distinct active tickets with item counts
  const ticketGroups = useMemo(() => {
    const map = new Map<string, { ticketNo: string; count: number }>();
    activeSessionOrders.forEach((o) => {
      const tkt = o.ticketNo || o.orderNo || `TKT-${o.id}`;
      const count = (o.items || []).reduce(
        (sum: number, i: any) => sum + (i.quantity || 1),
        0
      );
      const ex = map.get(tkt);
      if (ex) ex.count += count;
      else map.set(tkt, { ticketNo: tkt, count });
    });
    return Array.from(map.values());
  }, [activeSessionOrders]);

  return (
    <div className="flex flex-col space-y-2 mb-2.5">
      {/* ── 1. Minimalist Material 3 Header Banner (Matching ActiveOrdersTab) ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 border border-stone-200/70 dark:border-zinc-800 shadow-2xs flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <FaReceipt className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold truncate flex items-center gap-1.5 flex-wrap text-stone-900 dark:text-white">
              <span>{t.totalBillLabel || t.total || "Total"}: Rs. {totalAmount.toLocaleString()}</span>
              {unpaidAmount > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                  • To Pay: Rs. {unpaidAmount.toLocaleString()}
                </span>
              )}
            </div>

            <div className="text-[11px] text-stone-500 dark:text-zinc-400 truncate flex items-center gap-1.5">
              {pendingItems > 0 && <span>{pendingItems} {t.itemPending || (lang === "ur" ? "قطار میں" : "Queued")}</span>}
              {cookingItems > 0 && <span>• {cookingItems} {t.itemCooking || (lang === "ur" ? "پک رہا ہے" : "Cooking")}</span>}
              {readyItems > 0 && <span>• {readyItems} {t.itemReady || (lang === "ur" ? "تیار" : "Ready")}</span>}
              {servedItems > 0 && <span>• {servedItems} {t.itemServed || (lang === "ur" ? "سروڈ" : "Served")}</span>}
              {pendingItems === 0 && cookingItems === 0 && readyItems === 0 && servedItems === 0 && (
                <span>{activeSessionOrders.length} {lang === "ur" ? "آرڈرز" : "Orders"}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Status Badge */}
        <div>
          {unpaidAmount > 0 ? (
            <span className="h-8 px-3 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1 shrink-0 shadow-2xs">
              <span>Rs. {unpaidAmount.toLocaleString()}</span>
            </span>
          ) : (
            <span className="h-8 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-bold text-xs flex items-center gap-1 shrink-0">
              <FaCheck className="w-2.5 h-2.5" />
              <span>Bill Paid</span>
            </span>
          )}
        </div>
      </div>

      {/* ── 2. Clean Material 3 Filter Chips for Orders History ───────── */}
      {onSelectFilter && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          {/* 1. Active / In Kitchen Filter (First in arrangement) */}
          {cookingItems + pendingItems > 0 && (
            <button
              type="button"
              onClick={() => {
                playTapSound();
                onSelectFilter("active");
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedFilter === "active"
                  ? "bg-amber-500 text-stone-950 font-bold shadow-2xs"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50"
              }`}
            >
              <FaFire className="w-2.5 h-2.5 text-amber-500" />
              <span>{t.activeKitchen || "In Kitchen"}</span>
              <span dir="ltr" className="text-[10px] font-mono font-bold">
                ({cookingItems + pendingItems})
              </span>
            </button>
          )}

          {/* 2. All Filter */}
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onSelectFilter("all");
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === "all"
                ? "bg-stone-900 text-white dark:bg-white dark:text-stone-950 font-bold shadow-2xs"
                : "bg-stone-100 dark:bg-zinc-800/90 text-stone-600 dark:text-zinc-300 hover:bg-stone-200/80"
            }`}
          >
            <FaLayerGroup className="w-2.5 h-2.5 opacity-70" />
            <span>{t.all || "All Orders"}</span>
            <span dir="ltr" className="text-[10px] font-mono opacity-80">
              {orders.length}
            </span>
          </button>

          {/* Ready Filter */}
          {readyItems > 0 && (
            <button
              type="button"
              onClick={() => {
                playTapSound();
                onSelectFilter("ready");
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedFilter === "ready"
                  ? "bg-emerald-600 text-white font-bold shadow-2xs"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
              }`}
            >
              <FaWandMagicSparkles className="w-2.5 h-2.5 text-emerald-500" />
              <span>{t.itemReady || "Ready"}</span>
              <span dir="ltr" className="text-[10px] font-mono font-bold">
                ({readyItems})
              </span>
            </button>
          )}

          {/* Served Filter */}
          {servedItems > 0 && (
            <button
              type="button"
              onClick={() => {
                playTapSound();
                onSelectFilter("served");
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedFilter === "served"
                  ? "bg-stone-900 text-white dark:bg-white dark:text-stone-950 font-bold shadow-2xs"
                  : "bg-stone-100 dark:bg-zinc-800/90 text-stone-600 dark:text-zinc-300 hover:bg-stone-200/80"
              }`}
            >
              <FaCircleCheck className="w-2.5 h-2.5 text-emerald-500" />
              <span>{t.itemServed || "Served"}</span>
              <span dir="ltr" className="text-[10px] font-mono opacity-80">
                ({servedItems})
              </span>
            </button>
          )}

          {/* Ticket Chips */}
          {ticketGroups.length > 1 &&
            ticketGroups.map((tg) => {
              const isSelected = selectedFilter === `ticket:${tg.ticketNo}`;
              return (
                <button
                  key={tg.ticketNo}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    onSelectFilter(isSelected ? "all" : `ticket:${tg.ticketNo}`);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-amber-500 text-stone-950 font-bold shadow-2xs"
                      : "bg-stone-100 dark:bg-zinc-800/90 text-stone-700 dark:text-zinc-300 hover:bg-stone-200/80 border border-stone-200 dark:border-zinc-700"
                  }`}
                >
                  <FaTicket className="w-2.5 h-2.5 text-amber-500" />
                  <span>{tg.ticketNo}</span>
                  <span
                    dir="ltr"
                    className="text-[10px] font-mono font-bold opacity-75"
                  >
                    ×{tg.count}
                  </span>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
