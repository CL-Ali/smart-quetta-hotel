"use client";

import React, { useState, useMemo } from "react";
import {
  Flame,
  Sparkles,
  Hourglass,
  CheckCircle2,
  Clock,
  Receipt,
  Ticket,
  Utensils,
  ArrowRight,
  AlertCircle,
  Armchair,
  UtensilsCrossed,
  ChefHat,
} from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { OrderWithDetails } from "@/types/hotel";
import { fmtDateTime } from "@/lib/time";
import { playTapSound } from "@/lib/sound";

interface ActiveItemDetail {
  id: number;
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  kitchenStatus: "pending" | "preparing" | "ready" | "served" | "cancelled";
  orderId: number;
  orderNo?: string | null;
  ticketNo?: string | null;
  seatingNo?: string | null;
  seatingType?: string | null;
  createdAt: string;
  paymentStatus: string;
}

interface ActiveOrdersTabProps {
  orders: (OrderWithDetails | any)[];
  guestName: string;
  seatingLabel: string;
  ticketNo?: string | null;
  onOrderMore: () => void;
  onViewAllOrders: () => void;
}

export function ActiveOrdersTab({
  orders,
  guestName,
  seatingLabel,
  ticketNo,
  onOrderMore,
  onViewAllOrders,
}: ActiveOrdersTabProps) {
  const { t, lang } = useLang();
  const [selectedSubTab, setSelectedSubTab] = useState<string>("all");

  // 1. Extract only non-served, non-cancelled active items across all orders
  const activeItems = useMemo(() => {
    const list: ActiveItemDetail[] = [];
    orders.forEach((order) => {
      // If the overall order is marked served or cancelled, skip
      if (order.status === "served" || order.status === "cancelled") return;

      order.items?.forEach((item: any) => {
        const itemStatus = item.kitchenStatus || item.status || order.status || "pending";
        if (itemStatus !== "served" && itemStatus !== "cancelled") {
          list.push({
            id: item.id,
            menuItemId: item.menuItemId || item.id,
            name: item.name || item.nameSnapshot || "Item",
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || item.price || 0,
            subtotal: (item.unitPrice || item.price || 0) * (item.quantity || 1),
            kitchenStatus: itemStatus,
            orderId: order.id,
            orderNo: order.orderNo,
            ticketNo: order.ticketNo || ticketNo,
            seatingNo: order.seatingNo || (order as any).tableNo,
            seatingType: order.seatingType,
            createdAt: order.createdAt,
            paymentStatus: order.paymentStatus || "unpaid",
          });
        }
      });
    });
    return list;
  }, [orders, ticketNo]);

  // 2. Group active items by Product Name for sub-tabs
  const productSubTabs = useMemo(() => {
    const map = new Map<string, { name: string; count: number; total: number }>();
    activeItems.forEach((item) => {
      const ex = map.get(item.name);
      if (ex) {
        ex.count += item.quantity;
        ex.total += item.subtotal;
      } else {
        map.set(item.name, {
          name: item.name,
          count: item.quantity,
          total: item.subtotal,
        });
      }
    });
    return Array.from(map.values());
  }, [activeItems]);

  // 3. Filter items by selected sub-tab
  const displayedItems = useMemo(() => {
    if (selectedSubTab === "all") return activeItems;
    return activeItems.filter((item) => item.name === selectedSubTab);
  }, [activeItems, selectedSubTab]);

  // 4. Calculate total non-served active bill & status counts
  const totalActiveBill = useMemo(
    () => activeItems.reduce((sum, item) => sum + item.subtotal, 0),
    [activeItems]
  );
  const totalActiveCount = useMemo(
    () => activeItems.reduce((sum, item) => sum + item.quantity, 0),
    [activeItems]
  );

  const cookingCount = activeItems.filter((i) => i.kitchenStatus === "preparing").length;
  const readyCount = activeItems.filter((i) => i.kitchenStatus === "ready").length;
  const pendingCount = activeItems.filter((i) => i.kitchenStatus === "pending").length;

  // Status renderer with rich animations
  const renderLiveStatusPill = (status: string) => {
    switch (status) {
      case "preparing":
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-300/40 dark:border-blue-700/50 px-2.5 py-1 rounded-xl text-xs font-black shrink-0 animate-pulse shadow-2xs">
            <Flame className="w-3.5 h-3.5 text-blue-500 fill-blue-500 animate-bounce" />
            <span>{t.itemCooking || "Cooking on Fire"}</span>
          </span>
        );
      case "ready":
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/60 dark:border-emerald-600/60 px-2.5 py-1 rounded-xl text-xs font-black shrink-0 animate-pulse shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600 animate-spin" />
            <span>{t.itemReady || "Ready for Pickup!"}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300/50 dark:border-amber-700/50 px-2.5 py-1 rounded-xl text-xs font-extrabold shrink-0 shadow-2xs">
            <Hourglass className="w-3.5 h-3.5 text-amber-600" />
            <span>{t.itemPending || "In Queue"}</span>
          </span>
        );
    }
  };

  // If no active non-served orders
  if (activeItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center h-full max-w-md mx-auto space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-md">
          <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white">
            {t.allServedCelebration || "All Orders Served!"}
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400">
            {t.noActiveKitchenOrders || "No active non-served items right now. Everything has been delivered fresh!"}
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full pt-2">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onOrderMore();
            }}
            className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold rounded-2xl text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <Utensils className="w-4 h-4" />
            <span>{t.orderMoreItems || "+ Order More Food"}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onViewAllOrders();
            }}
            className="w-full h-11 border border-stone-200 dark:border-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-800 active:scale-95 text-stone-700 dark:text-zinc-300 font-bold rounded-2xl text-xs transition cursor-pointer"
          >
            {t.myOrders || "View All Past Receipts"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-3">
      {/* ── 1. Live Running Kitchen Banner ────────────────────────────── */}
      <div className="bg-stone-950 rounded-2xl p-3.5 sm:p-4 text-white shadow-md border border-stone-800 shrink-0 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-stone-950 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                {seatingLabel}
              </span>
              {ticketNo && (
                <span className="px-2 py-0.5 rounded-lg bg-white/10 text-amber-300 text-[10px] sm:text-[11px] font-mono font-bold border border-white/10 flex items-center gap-1">
                  <span>🎫 Ticket:</span>
                  <span className="font-black text-white">{ticketNo}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 pt-0.5 text-xs flex-wrap">
              <span className="font-bold text-white text-xs sm:text-sm">
                {totalActiveCount} {t.nonServedItems || "Active Items"}
              </span>
              <span className="text-stone-500 text-[11px]">•</span>
              {cookingCount > 0 && (
                <span className="text-blue-400 font-bold text-[11px] flex items-center gap-1">
                  🔥 {cookingCount} Cooking
                </span>
              )}
              {readyCount > 0 && (
                <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                  ✨ {readyCount} Ready
                </span>
              )}
              {pendingCount > 0 && (
                <span className="text-amber-400 font-bold text-[11px] flex items-center gap-1">
                  ⏳ {pendingCount} In Queue
                </span>
              )}
            </div>
          </div>

          {/* Right: Live Non-Served Amount */}
          <div className="text-right shrink-0 bg-white/10 px-3 py-2 rounded-xl border border-white/10">
            <p className="text-[10px] font-bold text-stone-300 uppercase tracking-wider">
              {t.unservedSummary || "Active Bill"}
            </p>
            <p className="text-base sm:text-xl font-bold font-mono text-amber-400 leading-tight">
              Rs. {totalActiveBill.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Item-Based Sub-Tabs Bar (Product Filter Chips) ─────────── */}
      <div className="bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-stone-200/90 dark:border-zinc-800 shadow-2xs shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {/* "All Active Items" Chip */}
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setSelectedSubTab("all");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
              selectedSubTab === "all"
                ? "bg-stone-900 text-white dark:bg-amber-500 dark:text-stone-950 shadow-xs"
                : "bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700"
            }`}
          >
            <span>{t.allActiveItems || "All Active"}</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                selectedSubTab === "all"
                  ? "bg-white/20 text-white dark:bg-black/20 dark:text-black font-black"
                  : "bg-stone-200 dark:bg-zinc-700 text-stone-800 dark:text-zinc-200"
              }`}
            >
              {totalActiveCount}
            </span>
          </button>

          {/* Individual Product Sub-Tabs */}
          {productSubTabs.map((prod) => {
            const isSelected = selectedSubTab === prod.name;
            return (
              <button
                key={prod.name}
                type="button"
                onClick={() => {
                  playTapSound();
                  setSelectedSubTab(prod.name);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                  isSelected
                    ? "bg-amber-500 text-stone-950 shadow-xs font-black border border-amber-400"
                    : "bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 border border-transparent"
                }`}
              >
                <span className="truncate max-w-[130px]">{prod.name}</span>
                <span className="text-[10px] font-mono bg-black/10 dark:bg-white/10 px-1.5 py-0.2 rounded-md font-black">
                  ×{prod.count}
                </span>
                <span className="text-[10px] font-mono opacity-80">
                  Rs. {prod.total.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Scrollable List of Active Non-Served Order Cards ────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pr-0.5 pb-20 lg:pb-4 min-h-0">
        {displayedItems.map((item, idx) => (
          <div
            key={`${item.orderId}-${item.id}-${idx}`}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/90 dark:border-zinc-800 p-3.5 shadow-xs hover:border-amber-400/80 transition-all space-y-2.5 animate-in fade-in-50"
          >
            {/* Top Row: Ticket & Seating & Live Status */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono font-black text-xs text-stone-900 dark:text-white bg-stone-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-zinc-700 flex items-center gap-1">
                  <Ticket className="w-3 h-3 text-amber-600" />
                  <span>{item.orderNo || item.ticketNo || `#${item.orderId}`}</span>
                </span>

                {item.seatingNo && (
                  <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    {item.seatingType === "seat" ? (
                      <Armchair className="w-2.5 h-2.5" />
                    ) : (
                      <UtensilsCrossed className="w-2.5 h-2.5" />
                    )}
                    <span>{item.seatingNo}</span>
                  </span>
                )}

                <span className="text-[10px] text-stone-400 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {fmtDateTime(item.createdAt)}
                </span>
              </div>

              {/* Status Pill */}
              {renderLiveStatusPill(item.kitchenStatus)}
            </div>

            {/* Middle Row: Product Name & Quantity & Price */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-100 dark:border-zinc-800/80">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-xs sm:text-sm text-stone-900 dark:text-white truncate">
                    {item.name}
                  </h4>
                  <span className="font-mono font-black text-[11px] bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 px-2 py-0.2 rounded-lg border border-amber-300/60 dark:border-amber-800/60">
                    ×{item.quantity}
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                  Rs. {item.unitPrice} {t.each || "each"}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-mono font-black text-sm sm:text-base text-amber-600 dark:text-amber-400">
                  Rs. {item.subtotal.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
