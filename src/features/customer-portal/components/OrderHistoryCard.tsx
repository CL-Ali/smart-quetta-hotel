"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Flame,
  Sparkles,
  Hourglass,
  Utensils,
  Receipt,
} from "lucide-react";
import { fmtDateTime } from "@/lib/time";
import { useLang } from "@/contexts/LangContext";
import { OrderWithDetails } from "@/types/hotel";

const ORDER_STATUS_STYLE: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    icon: Hourglass,
  },
  preparing: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    icon: Flame,
  },
  ready: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    icon: Sparkles,
  },
  served: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
    icon: CheckCircle2,
  },
  paid: {
    bg: "bg-emerald-100",
    text: "text-emerald-900",
    border: "border-emerald-300",
    icon: CheckCircle2,
  },
  cancelled: {
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-200",
    icon: Hourglass,
  },
};

interface OrderHistoryCardProps {
  order: OrderWithDetails | any;
  defaultOpen?: boolean;
}

export function OrderHistoryCard({ order, defaultOpen = true }: OrderHistoryCardProps) {
  const { t } = useLang();
  const [open, setOpen] = useState(defaultOpen);

  const orderStyle = ORDER_STATUS_STYLE[order.status] ?? {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
    icon: Clock,
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
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
          <Flame className="w-2.5 h-2.5 text-blue-600 animate-pulse" />
          <span>{t.itemCooking}</span>
        </span>
      );
    }

    if (status === "ready") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 shrink-0 animate-bounce">
          <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
          <span>{t.itemReady}</span>
        </span>
      );
    }

    if (status === "served") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
          <span>{t.itemServed}</span>
        </span>
      );
    }

    if (servedQty > 0 && servedQty < totalQty) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
          <Utensils className="w-2.5 h-2.5" />
          <span>
            {servedQty}/{totalQty} {t.itemServed}
          </span>
        </span>
      );
    }

    if (status === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 shrink-0">
          <span>{t.status.cancelled}</span>
        </span>
      );
    }

    // Default: pending / queued
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50/80 text-amber-700 border border-amber-200/80 shrink-0">
        <Hourglass className="w-2.5 h-2.5 text-amber-600" />
        <span>{t.itemPending}</span>
      </span>
    );
  };

  return (
    <div className="border border-gray-200/90 rounded-2xl overflow-hidden bg-white shadow-xs transition-all hover:shadow-md">
      {/* ── Order Header Bar ────────────────────────────────────────────── */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-3.5 sm:px-4 py-3 bg-white hover:bg-gray-50/80 transition text-left cursor-pointer gap-2"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-mono font-black text-xs sm:text-sm text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg border border-gray-200 shrink-0">
            {order.orderNo ? `🎫 ${order.orderNo}` : `#${order.id}`}
          </span>

          {(order.seatingNo || (order as any).tableNo) && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded-md shrink-0">
              {order.seatingNo
                ? order.seatingType === "seat"
                  ? `🪑 ${order.seatingNo}`
                  : `🍽️ ${order.seatingNo}`
                : (order as any).tableNo}
            </span>
          )}

          <span
            className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border inline-flex items-center gap-1 ${orderStyle.bg} ${orderStyle.text} ${orderStyle.border}`}
          >
            <OrderIcon className="w-3 h-3" />
            {(t.status as any)[order.status] ?? order.status}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="text-right">
            <span className="font-mono font-black text-orange-600 text-sm sm:text-base">
              Rs. {totalAmount.toFixed(0)}
            </span>
            <span className="hidden sm:block text-[9px] text-gray-400 font-medium">
              {order.items?.length || 0} {t.menu || "Items"}
            </span>
          </div>
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
      </button>

      {/* ── Order Body & Product Level Status ──────────────────────────── */}
      {open && (
        <div className="border-t border-gray-100 px-3.5 sm:px-4 py-3 bg-gray-50/50 space-y-3">
          {/* Order Placement Time */}
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {fmtDateTime(order.createdAt)}
            </span>
            <span className="font-medium text-gray-500">{t.trackOrderRealtime}</span>
          </div>

          {/* Individual Products with Live Status */}
          <div className="divide-y divide-gray-200/60 bg-white rounded-xl border border-gray-200/80 p-1.5 shadow-2xs space-y-1">
            {order.items?.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 hover:bg-orange-50/40 rounded-lg transition gap-2"
              >
                {/* Product Name & Qty */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-xs text-gray-900">
                      {item.name || item.nameSnapshot || "Item"}
                    </span>
                    <span className="font-mono text-[10px] font-black bg-orange-100 text-orange-800 px-1.5 py-0.2 rounded-md">
                      ×{item.quantity}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                    Rs. {item.unitPrice} {t.each}
                  </div>
                </div>

                {/* Individual Product Status Badge */}
                <div className="flex items-center gap-2 shrink-0">
                  {renderItemStatusBadge(item)}
                  <span className="font-mono font-bold text-xs text-gray-800 min-w-[55px] text-right">
                    Rs. {(item.unitPrice * item.quantity).toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Order Bill Breakdown */}
          <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between text-xs sm:text-sm">
            <span className="font-bold text-gray-700 flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-orange-500" />
              {t.totalBillLabel || t.total}
            </span>
            <span className="font-mono font-black text-orange-600 text-sm sm:text-base">
              Rs. {totalAmount.toFixed(0)}
            </span>
          </div>

          {/* Payment Status Bar */}
          <div className="flex items-center justify-between text-xs pt-1">
            {order.paymentStatus === "paid" ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {t.payStatus.paid} {order.paymentMethod ? `(${order.paymentMethod})` : ""}
              </span>
            ) : order.paymentStatus === "partial" ? (
              <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {t.payStatus.partial}: Rs. {paidAmount.toFixed(0)} / Rs. {totalAmount.toFixed(0)}
              </span>
            ) : (
              <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                {t.payStatus.unpaid} (Rs. {(totalAmount - paidAmount).toFixed(0)})
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
