"use client";

import React, { useState } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaCircleCheck,
  FaFire,
  FaWandMagicSparkles,
  FaHourglassHalf,
  FaUtensils,
  FaReceipt,
  FaTicket,
  FaChair,
  FaCheck,
  FaXmark,
} from "react-icons/fa6";
import { fmtDateTime } from "@/lib/time";
import { useLang } from "@/contexts/LangContext";
import { OrderWithDetails } from "@/types/hotel";
import { getAccurateItemImageByName } from "../utils/itemImage";
import { getItemDisplayName } from "../utils/itemTranslation";

const ORDER_STATUS_STYLE: Record<
  string,
  { bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    bg: "bg-amber-500/15",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-400/40",
    icon: FaHourglassHalf,
  },
  preparing: {
    bg: "bg-blue-500/15",
    text: "text-blue-800 dark:text-blue-300",
    border: "border-blue-400/40",
    icon: FaFire,
  },
  ready: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-800 dark:text-emerald-300",
    border: "border-emerald-400/50",
    icon: FaWandMagicSparkles,
  },
  served: {
    bg: "bg-stone-100 dark:bg-zinc-800",
    text: "text-stone-700 dark:text-zinc-300",
    border: "border-stone-200 dark:border-zinc-700",
    icon: FaCircleCheck,
  },
  paid: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-800 dark:text-emerald-300",
    border: "border-emerald-400/50",
    icon: FaCircleCheck,
  },
  cancelled: {
    bg: "bg-red-500/15",
    text: "text-red-800 dark:text-red-300",
    border: "border-red-400/40",
    icon: FaXmark,
  },
};

interface OrderHistoryCardProps {
  order: OrderWithDetails | any;
  defaultOpen?: boolean;
}

export function OrderHistoryCard({ order, defaultOpen = true }: OrderHistoryCardProps) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(defaultOpen);

  const orderStyle = ORDER_STATUS_STYLE[order.status] ?? {
    bg: "bg-stone-100 dark:bg-zinc-800",
    text: "text-stone-700 dark:text-zinc-300",
    border: "border-stone-200 dark:border-zinc-700",
    icon: FaClock,
  };
  const OrderIcon = orderStyle.icon;

  const totalAmount = order.totalAmount ?? order.total ?? 0;
  const paidAmount = order.paidAmount ?? 0;

  // Render individual product status badge
  const renderItemStatusBadge = (item: any) => {
    const status = item.kitchenStatus || item.status || "pending";
    const servedQty = item.servedQty || 0;
    const totalQty = item.quantity || 1;

    if (status === "preparing") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-0.5 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-300/60 dark:border-blue-700/60 shrink-0">
          <FaFire className="w-3 h-3 text-blue-600 animate-pulse" />
          <span>{t.itemCooking || "Cooking"}</span>
        </span>
      );
    }

    if (status === "ready") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-0.5 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-400/60 shrink-0 animate-bounce">
          <FaWandMagicSparkles className="w-3 h-3 text-emerald-600" />
          <span>{t.itemReady || "Ready"}</span>
        </span>
      );
    }

    if (status === "served") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700 shrink-0">
          <FaCircleCheck className="w-3 h-3 text-emerald-600" />
          <span>{t.itemServed || "Served"}</span>
        </span>
      );
    }

    if (servedQty > 0 && servedQty < totalQty) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300/60 shrink-0">
          <FaUtensils className="w-3 h-3 text-amber-600" />
          <span>
            {servedQty}/{totalQty} {t.itemServed || "Served"}
          </span>
        </span>
      );
    }

    if (status === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-xl bg-red-500/15 text-red-800 dark:text-red-300 border border-red-300/60 shrink-0">
          <FaXmark className="w-3 h-3" />
          <span>{t.status.cancelled}</span>
        </span>
      );
    }

    // Default: pending / queued
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 border border-stone-200 dark:border-zinc-700 shrink-0">
        <FaHourglassHalf className="w-2.5 h-2.5 text-stone-400" />
        <span>{t.itemPending || "Queued"}</span>
      </span>
    );
  };

  return (
    <div className="border border-stone-200/90 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs transition-all hover:border-amber-400/60">
      {/* ── Order Header Bar ────────────────────────────────────────────── */}
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:hover:bg-zinc-800/60 transition text-left cursor-pointer gap-2"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-mono font-black text-xs sm:text-sm text-stone-900 dark:text-white bg-stone-100 dark:bg-zinc-800 px-2.5 py-1 rounded-xl border border-stone-200 dark:border-zinc-700 shrink-0 flex items-center gap-1.5">
            <FaTicket className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>{order.orderNo || `#${order.id}`}</span>
          </span>

          {(order.seatingNo || (order as any).tableNo) && (
            <span className="text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1.5">
              {order.seatingType === "seat" ? (
                <FaChair className="w-3 h-3" />
              ) : (
                <FaUtensils className="w-3 h-3" />
              )}
              <span>{order.seatingNo || (order as any).tableNo}</span>
            </span>
          )}

          <span
            className={`text-xs px-2.5 py-0.5 rounded-xl font-black border inline-flex items-center gap-1.5 ${orderStyle.bg} ${orderStyle.text} ${orderStyle.border}`}
          >
            <OrderIcon className="w-3 h-3" />
            {(t.status as any)[order.status] ?? order.status}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm sm:text-base">
              Rs. {totalAmount.toFixed(0)}
            </span>
            <span className="hidden sm:block text-[10px] text-stone-400 font-medium">
              {order.items?.length || 0} {t.menu || "Items"}
            </span>
          </div>
          <div className="w-7 h-7 rounded-xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-stone-500 dark:text-zinc-400">
            {open ? <FaChevronUp className="w-3.5 h-3.5" /> : <FaChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
      </button>

      {/* ── Order Body & Product Level Status ──────────────────────────── */}
      {open && (
        <div className="border-t border-stone-100 dark:border-zinc-800 p-4 bg-stone-50/50 dark:bg-zinc-900/50 space-y-3">
          {/* Order Placement Time */}
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="flex items-center gap-1.5">
              <FaClock className="w-3 h-3" />
              {fmtDateTime(order.createdAt)}
            </span>
            <span className="font-bold text-stone-600 dark:text-zinc-400">{t.trackOrderRealtime || "Live Kitchen Status"}</span>
          </div>

          {/* Individual Products with Live Status and Dish Images */}
          <div className="divide-y divide-stone-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 p-2 shadow-2xs space-y-2">
            {order.items?.map((item: any) => {
              const itemImg = getAccurateItemImageByName(item.name || item.nameSnapshot, item.imageUrl);
              const displayName = getItemDisplayName(item.name || item.nameSnapshot, lang);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 hover:bg-stone-50 dark:hover:bg-zinc-800/40 rounded-xl transition gap-3"
                >
                  {/* Left: Dish Thumbnail */}
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-stone-100 dark:bg-zinc-800 shrink-0 border border-stone-200 dark:border-zinc-700">
                    <img
                      src={itemImg}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Middle: Product Name & Pricing */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-xs sm:text-sm text-stone-900 dark:text-white">
                        {displayName}
                      </span>
                      <span className="font-mono text-xs font-black bg-amber-500/15 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        ×{item.quantity}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400 font-mono">
                      Rs. {item.unitPrice} {t.each || "each"}
                    </div>
                  </div>

                  {/* Right: Individual Product Status Badge & Subtotal */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-2.5 shrink-0">
                    {renderItemStatusBadge(item)}
                    <span className="font-mono font-black text-xs sm:text-sm text-amber-600 dark:text-amber-400 min-w-[65px] text-right">
                      Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Bill Breakdown */}
          <div className="pt-2 border-t border-stone-200/80 dark:border-zinc-800 flex items-center justify-between text-xs sm:text-sm">
            <span className="font-black text-stone-800 dark:text-zinc-200 flex items-center gap-1.5">
              <FaReceipt className="w-3.5 h-3.5 text-amber-500" />
              {t.totalBillLabel || t.total}
            </span>
            <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm sm:text-base">
              Rs. {totalAmount.toLocaleString()}
            </span>
          </div>

          {/* Payment Status Bar */}
          <div className="flex items-center justify-between text-xs pt-1">
            {order.paymentStatus === "paid" ? (
              <span className="text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1.5 bg-emerald-500/15 px-2.5 py-1 rounded-xl border border-emerald-400/40">
                <FaCircleCheck className="w-3 h-3 text-emerald-600" />
                {t.payStatus.paid} {order.paymentMethod ? `(${order.paymentMethod})` : ""}
              </span>
            ) : order.paymentStatus === "partial" ? (
              <span className="text-amber-800 dark:text-amber-300 font-bold bg-amber-500/15 px-2.5 py-1 rounded-xl border border-amber-400/40">
                {t.payStatus.partial}: Rs. {paidAmount.toLocaleString()} / Rs. {totalAmount.toLocaleString()}
              </span>
            ) : (
              <span className="text-red-800 dark:text-red-300 font-bold bg-red-500/15 px-2.5 py-1 rounded-xl border border-red-400/40">
                {t.payStatus.unpaid} (Rs. {(totalAmount - paidAmount).toLocaleString()})
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
