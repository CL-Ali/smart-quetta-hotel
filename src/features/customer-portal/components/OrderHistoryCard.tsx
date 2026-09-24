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
  FaSpinner,
} from "react-icons/fa6";
import { fmtDateTime, fmtTime } from "@/lib/time";
import { useLang } from "@/contexts/LangContext";
import { OrderWithDetails } from "@/types/hotel";
import { getAccurateItemImageByName } from "../utils/itemImage";
import { getItemDisplayName } from "../utils/itemTranslation";

const PendingDot = ({ className }: { className?: string }) => (
  <span className="w-2 h-2 rounded-full bg-stone-500 dark:bg-zinc-400 shrink-0" />
);

const ORDER_STATUS_STYLE: Record<
  string,
  { bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    bg: "bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300",
    text: "text-stone-700 dark:text-zinc-300",
    border: "border-stone-200/80 dark:border-zinc-700/80",
    icon: PendingDot,
  },
  preparing: {
    bg: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-300 dark:border-amber-700/80",
    icon: FaFire,
  },
  ready: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/60",
    icon: FaWandMagicSparkles,
  },
  served: {
    bg: "bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400",
    text: "text-stone-600 dark:text-zinc-400",
    border: "border-stone-200/80 dark:border-zinc-700/80",
    icon: FaCircleCheck,
  },
  paid: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/60",
    icon: FaCircleCheck,
  },
  cancelled: {
    bg: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800/60",
    icon: FaXmark,
  },
};

interface OrderHistoryCardProps {
  order: OrderWithDetails | any;
  defaultOpen?: boolean;
  onCancelItem?: (itemId: number, orderId: number) => Promise<void>;
  cancellingItemId?: number | null;
}

export function OrderHistoryCard({
  order,
  defaultOpen = true,
  onCancelItem,
  cancellingItemId,
}: OrderHistoryCardProps) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(defaultOpen);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);

  const orderStyle = ORDER_STATUS_STYLE[order.status] ?? {
    bg: "bg-stone-100 dark:bg-zinc-800",
    text: "text-stone-700 dark:text-zinc-300",
    border: "border-stone-200 dark:border-zinc-700",
    icon: FaClock,
  };
  const OrderIcon = orderStyle.icon;

  const totalAmount = order.totalAmount ?? order.total ?? 0;
  const paidAmount = order.paidAmount ?? 0;
  const unpaidAmount = Math.max(0, totalAmount - paidAmount);

  // Render individual product status badge with consistent colored dot indicator
  const renderItemStatusBadge = (item: any) => {
    const status = item.kitchenStatus || item.status || "pending";
    const servedQty = item.servedQty || 0;
    const totalQty = item.quantity || 1;

    if (status === "preparing") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.2 rounded-full border-0 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <span>{t.itemCooking || (lang === "ur" ? "زیرِ تیاری" : "Cooking")}</span>
        </span>
      );
    }

    if (status === "ready") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.2 rounded-full border-0 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{t.itemReady || (lang === "ur" ? "تیار" : "Ready")}</span>
        </span>
      );
    }

    if (status === "served") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-600 dark:text-zinc-300 bg-stone-100 dark:bg-zinc-800 px-2 py-0.2 rounded-full border-0 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-zinc-500 shrink-0" />
          <span>{t.itemServed || (lang === "ur" ? "سروڈ" : "Served")}</span>
        </span>
      );
    }

    if (servedQty > 0 && servedQty < totalQty) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2 py-0.2 rounded-full border-0 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>
            {servedQty}/{totalQty} {t.itemServed || "Served"}
          </span>
        </span>
      );
    }

    if (status === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-0 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
          <span>{t.status.cancelled}</span>
        </span>
      );
    }

    // Default: pending / in queue
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-700 dark:text-zinc-300 bg-stone-100 dark:bg-zinc-800 px-2 py-0.2 rounded-full border-0 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-stone-500 dark:bg-zinc-400 shrink-0" />
        <span>{t.itemPending || (lang === "ur" ? "قطار میں" : "In Queue")}</span>
      </span>
    );
  };

  return (
    <div className="rounded-2xl overflow-hidden bg-white dark:bg-[#121824] border-0 shadow-none transition-all p-3 sm:p-3.5 mb-2">
      {/* ── Outer Ticket Header Bar (Compact) ─────── */}
      <button
        type="button"
        className="w-full flex items-center justify-between transition-colors text-left cursor-pointer gap-2 select-none"
        onClick={() => setOpen((v) => !v)}
      >
        {/* Left: Compact Ticket Pill + Payment Status + Timestamp */}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {/* Ticket Number */}
          <span className="font-mono font-bold text-[11px] text-[#D98A3C] bg-amber-500/15 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1">
            <FaTicket className="w-2.5 h-2.5 text-[#D98A3C]" />
            <span>{order.orderNo || `#${order.id}`}</span>
          </span>

          {/* Payment Status */}
          {order.paymentStatus === "paid" ? (
            <span className="text-[11px] px-2 py-0.2 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 shrink-0">
              <FaCircleCheck className="w-2 h-2 text-emerald-500" />
              <span>{t.payStatus.paid}</span>
            </span>
          ) : order.paymentStatus === "partial" ? (
            <span className="text-[11px] px-2 py-0.2 rounded-full font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 inline-flex items-center gap-1 shrink-0">
              <span>{t.payStatus.partial}</span>
            </span>
          ) : (
            <span className="text-[11px] px-2 py-0.2 rounded-full font-bold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 inline-flex items-center gap-1 shrink-0">
              <span>{t.payStatus.unpaid}</span>
            </span>
          )}

          <span className="hidden sm:inline-flex items-center gap-1 text-[10.5px] text-stone-400 dark:text-stone-500 font-mono ml-0.5">
            <FaClock className="w-2 h-2" />
            {fmtTime(order.createdAt)}
          </span>
        </div>

        {/* Right: Order Total & Minimal Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right flex items-center gap-1">
            <span className="font-mono font-black text-[#24180A] dark:text-white text-xs sm:text-sm">
              Rs. {totalAmount.toFixed(0)}
            </span>
            <span className="hidden sm:inline text-[10.5px] text-stone-400 dark:text-stone-500 font-medium">
              ({order.items?.length || 0})
            </span>
          </div>

          <div
            className={`w-5 h-5 rounded-full bg-[#F8F3EC] dark:bg-stone-800 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          >
            <FaChevronDown className="w-2 h-2" />
          </div>
        </div>
      </button>

      {/* ── Order Body: Attached Product Items List Container (Compact Rows) ─── */}
      {open && (
        <div className="mt-2.5 pt-2 border-t border-[#F8F3EC] dark:border-white/5 space-y-1.5">
          {order.items?.map((item: any, itemIdx: number) => {
            const rawItemName =
              item.name || item.nameSnapshot || (item.menuItem && item.menuItem.name) || "Item";
            const itemImg = getAccurateItemImageByName(
              rawItemName,
              item.imageUrl || (item.menuItem && item.menuItem.imageUrl)
            );
            const displayName = getItemDisplayName(rawItemName, lang);
            const itemStatus = item.kitchenStatus || item.status || "pending";
            const isPending = itemStatus === "pending";
            const isCancelling = cancellingItemId === item.id;
            const isConfirmingCancel = confirmCancelId === item.id;

            return (
              <div
                key={item.id}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#F8F3EC] dark:bg-[#1A2232] flex items-center gap-2.5 transition-all border-0"
              >
                {/* Left: Product Thumbnail */}
                <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden bg-white dark:bg-zinc-800 shrink-0">
                  <img
                    src={itemImg}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Center + Right Stack */}
                <div className="min-w-0 flex-1 flex flex-col justify-center gap-0.5">
                  {/* Row 1: Full Dish Name & Live Status Badge */}
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <h4 className="text-xs sm:text-[13px] font-extrabold text-stone-900 dark:text-white truncate">
                      {displayName}
                    </h4>
                    <div className="shrink-0">
                      {renderItemStatusBadge(item)}
                    </div>
                  </div>

                  {/* Row 2: Quantity, Price, Unit Rate & Single-Item Cancel Action */}
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <div className="text-[10.5px] text-stone-500 dark:text-zinc-400 flex items-center gap-1.5 font-medium truncate">
                      <span className="font-bold font-mono text-stone-800 dark:text-zinc-200">
                        ×{item.quantity}
                      </span>
                      <span>•</span>
                      <span className="font-bold font-mono text-[#E65100] dark:text-[#FB8C00]">
                        Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[9.5px] text-stone-400 font-mono">
                          (Rs. {item.unitPrice} ea)
                        </span>
                      )}
                    </div>

                    {/* Single product cancellation until served */}
                    {item.kitchenStatus !== "served" &&
                      item.kitchenStatus !== "cancelled" &&
                      order.status !== "cancelled" &&
                      order.status !== "served" &&
                      onCancelItem && (
                        <div className="shrink-0">
                          {isConfirmingCancel ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={isCancelling}
                                onClick={async () => {
                                  setConfirmCancelId(null);
                                  await onCancelItem(item.id, order.id);
                                }}
                                className="h-5.5 px-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full text-[9.5px] transition cursor-pointer flex items-center gap-1 shadow-none active:scale-95"
                              >
                                {isCancelling ? (
                                  <FaSpinner className="animate-spin w-2 h-2" />
                                ) : (
                                  <FaCheck className="w-2 h-2" />
                                )}
                                <span>{lang === "ur" ? "ہاں" : "Yes"}</span>
                              </button>
                              <button
                                type="button"
                                disabled={isCancelling}
                                onClick={() => setConfirmCancelId(null)}
                                className="h-5.5 px-1.5 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 rounded-full text-[9.5px] hover:bg-stone-200 transition cursor-pointer"
                              >
                                <FaXmark className="w-2 h-2" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isCancelling}
                              onClick={() => setConfirmCancelId(item.id)}
                              className="h-5.5 px-2 rounded-full bg-red-50 dark:bg-red-950/40 hover:bg-red-500 hover:text-white text-red-600 dark:text-red-400 text-[9.5px] font-bold border-0 transition cursor-pointer flex items-center gap-0.5 active:scale-95"
                              title="Cancel item"
                            >
                              <FaXmark className="w-2 h-2" />
                              <span>
                                {t.cancel || (lang === "ur" ? "منسوخ" : "Cancel")}
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
