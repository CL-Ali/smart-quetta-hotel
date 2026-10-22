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
    <div className="flex flex-col space-y-2 mb-3">
      {/* ── 1. Floating Squircle Header Banner ── */}
      <div className="bg-white dark:bg-[#121824] rounded-[24px] sm:rounded-[26px] p-4 border-0 shadow-none flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-2xl bg-[#D98A3C]/15 text-[#D98A3C] flex items-center justify-center shrink-0">
            <FaReceipt className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-xs font-black truncate flex items-center gap-1.5 flex-wrap text-[#24180A] dark:text-white">
              <span>{t.totalBillLabel || t.total || "Total"}: <span className="text-[#D98A3C]">Rs. {totalAmount.toLocaleString()}</span></span>
              {unpaidAmount > 0 && (
                <span className="text-[#D98A3C] font-bold text-[11px]">
                  • To Pay: Rs. {unpaidAmount.toLocaleString()}
                </span>
              )}
            </div>

            <div className="text-[11px] text-[#786B5D] dark:text-zinc-400 font-medium truncate flex items-center gap-1.5 mt-0.5">
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
            <span className="h-8 px-3.5 rounded-full bg-[#D98A3C] text-white font-extrabold text-xs flex items-center gap-1 shrink-0 shadow-none">
              <span>Rs. {unpaidAmount.toLocaleString()}</span>
            </span>
          ) : (
            <span className="h-8 px-3.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 shrink-0 border-0">
              <FaCheck className="w-3 h-3" />
              <span>Bill Paid</span>
            </span>
          )}
        </div>
      </div>

      {/* ── 2. Clean Filter Chips for Orders History ───────── */}
      {onSelectFilter && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
          {/* 1. Active / In Kitchen Filter */}
          {cookingItems + pendingItems > 0 && (
            <button
              type="button"
              onClick={() => {
                playTapSound();
                onSelectFilter("active");
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border-0 ${
                selectedFilter === "active"
                  ? "bg-[#D98A3C] text-white shadow-none"
                  : "bg-white dark:bg-[#121824] text-[#4A3E31] dark:text-zinc-300 hover:bg-[#F8F3EC] dark:hover:bg-[#1A2232]"
              }`}
            >
              <FaFire className={`w-3 h-3 ${selectedFilter === "active" ? "text-white" : "text-[#D98A3C]"}`} />
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border-0 ${
              selectedFilter === "all"
                ? "bg-[#D98A3C] text-white shadow-none"
                : "bg-white dark:bg-[#121824] text-[#4A3E31] dark:text-zinc-300 hover:bg-[#F8F3EC] dark:hover:bg-[#1A2232]"
            }`}
          >
            <FaLayerGroup className="w-3 h-3 opacity-70" />
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border-0 ${
                selectedFilter === "ready"
                  ? "bg-emerald-600 text-white shadow-none"
                  : "bg-white dark:bg-[#121824] text-emerald-600 dark:text-emerald-400 hover:bg-[#F8F3EC] dark:hover:bg-[#1A2232]"
              }`}
            >
              <FaWandMagicSparkles className="w-3 h-3 text-emerald-500" />
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border-0 ${
                selectedFilter === "served"
                  ? "bg-[#24180A] dark:bg-white text-white dark:text-[#24180A] shadow-none"
                  : "bg-white dark:bg-[#121824] text-[#4A3E31] dark:text-zinc-300 hover:bg-[#F8F3EC] dark:hover:bg-[#1A2232]"
              }`}
            >
              <FaCircleCheck className="w-3 h-3 text-emerald-500" />
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
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border-0 ${
                    isSelected
                      ? "bg-[#D98A3C] text-white shadow-none font-black"
                      : "bg-white dark:bg-[#121824] text-[#4A3E31] dark:text-zinc-300 hover:bg-[#F8F3EC] dark:hover:bg-[#1A2232]"
                  }`}
                >
                  <FaTicket className="w-3 h-3 text-[#D98A3C]" />
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
