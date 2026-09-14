"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  FaFire,
  FaWandMagicSparkles,
  FaHourglassHalf,
  FaCircleCheck,
  FaClock,
  FaTicket,
  FaLayerGroup,
  FaPlus,
  FaReceipt,
  FaStar,
  FaXmark,
  FaSpinner,
  FaCheck,
} from "react-icons/fa6";
import { useLang } from "@/contexts/LangContext";
import { OrderWithDetails } from "@/types/hotel";
import { fmtTime, isRecentOrToday } from "@/lib/time";
import { playTapSound } from "@/lib/sound";
import { getAccurateItemImageByName } from "../utils/itemImage";
import { getItemDisplayName } from "../utils/itemTranslation";

interface QueueItemDetail {
  id: number;
  menuItemId: number;
  name: string;
  quantity: number;
  kitchenStatus: "pending" | "preparing" | "ready" | "served" | "cancelled";
  orderId: number;
  orderNo?: string | null;
  ticketNo?: string | null;
  customerName?: string | null;
  seatingNo?: string | null;
  seatingType?: string | null;
  createdAt: string;
  imageUrl?: string;
  isMyOrder: boolean;
  unitPrice?: number;
}

interface ActiveOrdersTabProps {
  orders: (OrderWithDetails | any)[];
  kitchenQueue?: any[];
  guestName: string;
  seatingLabel: string;
  ticketNo?: string | null;
  activeTickets?: string[];
  onCancelItem?: (itemId: number, orderId: number) => Promise<void>;
  cancellingItemId?: number | null;
  onOrderMore: () => void;
  onViewAllOrders: () => void;
}

export function ActiveOrdersTab({
  orders = [],
  kitchenQueue = [],
  guestName,
  ticketNo,
  activeTickets = [],
  onCancelItem,
  cancellingItemId,
  onOrderMore,
  onViewAllOrders,
}: ActiveOrdersTabProps) {
  const { t, lang } = useLang();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);

  // Set of all active ticket identifiers belonging to THIS user
  const myTicketSet = useMemo(() => {
    const set = new Set<string>();
    if (ticketNo) set.add(ticketNo.trim().toUpperCase());
    activeTickets.forEach((tkt) => {
      if (tkt) set.add(tkt.trim().toUpperCase());
    });
    orders.forEach((o) => {
      if (o.ticketNo) set.add(o.ticketNo.trim().toUpperCase());
      if (o.orderNo) set.add(o.orderNo.trim().toUpperCase());
      if (o.id) set.add(`TKT-${o.id}`.toUpperCase());
    });
    return set;
  }, [ticketNo, activeTickets, orders]);

  const myOrderIdSet = useMemo(() => {
    return new Set<number>(orders.map((o) => o.id));
  }, [orders]);

  // 1. Build unified LIVE KITCHEN QUEUE (Ascending sequential order)
  const fullQueue = useMemo(() => {
    const list: QueueItemDetail[] = [];

    // Merge kitchen queue with user's orders
    const orderMap = new Map<number, any>();
    (kitchenQueue || []).forEach((o) => {
      if (o && o.id) orderMap.set(o.id, o);
    });
    (orders || []).forEach((o) => {
      if (o && o.id) {
        const existing = orderMap.get(o.id);
        orderMap.set(o.id, { ...existing, ...o, isUserOrder: true });
      }
    });

    const sourceOrders =
      orderMap.size > 0
        ? Array.from(orderMap.values())
        : orders.length > 0
        ? orders
        : kitchenQueue;

    sourceOrders.forEach((order) => {
      if (!isRecentOrToday(order.createdAt)) return;
      if (order.status === "served" || order.status === "cancelled") return;

      const orderTkt = (
        order.ticketNo ||
        order.orderNo ||
        `TKT-${order.id || ""}`
      )
        .trim()
        .toUpperCase();
      const isMine =
        Boolean(order.isUserOrder) ||
        myTicketSet.has(orderTkt) ||
        myOrderIdSet.has(order.id) ||
        (order.customerName &&
          guestName &&
          order.customerName.trim().toLowerCase() ===
            guestName.trim().toLowerCase()) ||
        orders.some((o) => o.id === order.id);

      order.items?.forEach((item: any) => {
        const itemStatus =
          item.kitchenStatus || item.status || order.status || "pending";
        if (itemStatus !== "served" && itemStatus !== "cancelled") {
          list.push({
            id: item.id,
            menuItemId: item.menuItemId || item.id,
            name: item.name || item.nameSnapshot || "Item",
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            kitchenStatus: itemStatus,
            orderId: order.id,
            orderNo: order.orderNo,
            ticketNo: order.ticketNo || (isMine ? ticketNo : `TKT-${order.id}`),
            customerName: order.customerName,
            seatingNo: order.seatingNo || (order as any).tableNo,
            seatingType: order.seatingType,
            createdAt: order.createdAt,
            imageUrl: item.imageUrl,
            isMyOrder: Boolean(isMine),
          });
        }
      });
    });

    // Sort in strict ASCENDING order (earliest ordered first)
    const sortedList = list.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return a.id - b.id;
    });

    // Cut off the queue at the user's latest active ticket
    let lastMyIndex = -1;
    for (let i = sortedList.length - 1; i >= 0; i--) {
      if (sortedList[i].isMyOrder) {
        lastMyIndex = i;
        break;
      }
    }

    if (lastMyIndex !== -1) {
      return sortedList.slice(0, lastMyIndex + 1);
    }

    return sortedList;
  }, [kitchenQueue, orders, myTicketSet, myOrderIdSet, guestName, ticketNo]);

  // Extract only MY items
  const myActiveItems = useMemo(() => {
    return fullQueue.filter((i) => i.isMyOrder);
  }, [fullQueue]);

  const myActiveTicketsList = useMemo(() => {
    const set = new Set<string>();
    myActiveItems.forEach((i) => {
      if (i.ticketNo) set.add(i.ticketNo);
      else if (i.orderNo) set.add(i.orderNo);
    });
    if (set.size === 0 && ticketNo) set.add(ticketNo);
    return Array.from(set);
  }, [myActiveItems, ticketNo]);

  // 2. Product tabs ONLY for products ordered by THIS customer that are currently active (non-served)
  // As items get served or cancelled, their tabs automatically disappear
  const myOrderedProductGroups = useMemo(() => {
    const map = new Map<
      string,
      { name: string; totalCount: number; myCount: number }
    >();
    myActiveItems.forEach((item) => {
      if (item.kitchenStatus === "served" || item.kitchenStatus === "cancelled") return;
      const ex = map.get(item.name);
      if (ex) {
        ex.myCount += item.quantity;
      } else {
        const totalInQueue = fullQueue
          .filter((i) => i.name === item.name)
          .reduce((sum, i) => sum + i.quantity, 0);
        map.set(item.name, {
          name: item.name,
          totalCount: totalInQueue,
          myCount: item.quantity,
        });
      }
    });
    return Array.from(map.values());
  }, [myActiveItems, fullQueue]);

  // If a selected product tab gets served, automatically fallback to "all"
  useEffect(() => {
    if (
      selectedFilter !== "all" &&
      selectedFilter !== "my_orders" &&
      !myOrderedProductGroups.some((p) => p.name === selectedFilter)
    ) {
      setSelectedFilter("all");
    }
  }, [myOrderedProductGroups, selectedFilter]);

  // 3. Filter items based on selected chip
  const displayedItems = useMemo(() => {
    if (selectedFilter === "all") return fullQueue;
    if (selectedFilter === "my_orders") return myActiveItems;
    return fullQueue.filter((item) => item.name === selectedFilter);
  }, [fullQueue, myActiveItems, selectedFilter]);

  // 4. Dynamic Context-Aware Queue Notice (updates per selected tab / product)
  const activeNoticeInfo = useMemo(() => {
    if (myActiveItems.length === 0 && fullQueue.length === 0) return null;

    // Case A: Specific Product Selected
    if (selectedFilter !== "all" && selectedFilter !== "my_orders") {
      const dishQueue = fullQueue.filter((i) => i.name === selectedFilter);
      const dishDisplayName = getItemDisplayName(selectedFilter, lang);
      const myDishItems = dishQueue.filter((i) => i.isMyOrder);
      const hasMyDish = myDishItems.length > 0;

      if (hasMyDish) {
        const firstMyDishIdx = dishQueue.findIndex((i) => i.isMyOrder);
        if (firstMyDishIdx === 0) {
          return {
            type: "next",
            isNext: true,
            dishName: dishDisplayName,
            text:
              lang === "ur"
                ? `${dishDisplayName} کے لیے اگلی باری آپ کی ہے!`
                : `You're next in line for ${dishDisplayName}!`,
            subtext:
              lang === "ur" ? "(کوئی ٹکٹ آگے نہیں ہے)" : "(No tickets ahead)",
          };
        }

        const precedingDishItems = dishQueue.slice(0, firstMyDishIdx);
        const precedingTicketsSet = new Set<string>();
        precedingDishItems.forEach((i) => {
          const tkt = (
            i.ticketNo ||
            i.orderNo ||
            `TKT-${i.orderId}`
          )
            .trim()
            .toUpperCase();
          if (tkt) precedingTicketsSet.add(tkt);
        });

        const aheadTicketsList = Array.from(precedingTicketsSet);
        const dishAheadQty = precedingDishItems.reduce(
          (s, i) => s + i.quantity,
          0
        );

        return {
          type: "ahead",
          isNext: false,
          ticketsCount: precedingTicketsSet.size,
          ticketsList: aheadTicketsList,
          itemQty: dishAheadQty,
          dishName: dishDisplayName,
          text:
            lang === "ur"
              ? `${dishDisplayName} کے لیے ${precedingTicketsSet.size} ٹکٹ آگے ہیں`
              : `${precedingTicketsSet.size} ${
                  precedingTicketsSet.size === 1 ? "ticket" : "tickets"
                } ahead for ${dishDisplayName}`,
          ticketsText:
            aheadTicketsList.length > 0
              ? `(${aheadTicketsList.join(", ")})`
              : "",
          subtext:
            lang === "ur"
              ? `آپ سے پہلے ${dishAheadQty} عدد زیرِ تیاری ہیں`
              : `${dishAheadQty} ${dishDisplayName} before yours`,
        };
      } else {
        const totalDishQty = dishQueue.reduce((s, i) => s + i.quantity, 0);
        const totalDishTickets = Array.from(
          new Set(
            dishQueue.map((i) =>
              (i.ticketNo || `TKT-${i.orderId}`).toUpperCase()
            )
          )
        );
        return {
          type: "info",
          isNext: false,
          dishName: dishDisplayName,
          text:
            lang === "ur"
              ? `کچن میں ${dishDisplayName} کے کل ${totalDishQty} آرڈرز ہیں`
              : `Kitchen Queue for ${dishDisplayName}: ${totalDishQty} items`,
          ticketsText:
            totalDishTickets.length > 0
              ? `(${totalDishTickets.join(", ")})`
              : "",
        };
      }
    }

    // Case B: "My Orders Only" Selected
    if (selectedFilter === "my_orders") {
      if (myActiveItems.length === 0) return null;
      return {
        type: "my_orders",
        isNext: false,
        text:
          lang === "ur"
            ? `آپ کے ${myActiveItems.length} آئٹمز کچن میں فعال ہیں`
            : `${myActiveItems.length} items cooking for your order`,
        ticketsText:
          myActiveTicketsList.length > 0
            ? `(${myActiveTicketsList.join(", ")})`
            : "",
      };
    }

    // Case C: Global "All Queue" Selected
    if (myActiveItems.length === 0) {
      return {
        type: "info",
        isNext: false,
        text:
          lang === "ur"
            ? `کچن کی قطار میں کل ${fullQueue.length} فعال آئٹمز ہیں`
            : `Total ${fullQueue.length} items in kitchen queue`,
      };
    }

    const firstMyGlobalIdx = fullQueue.findIndex((i) => i.isMyOrder);
    if (firstMyGlobalIdx <= 0) {
      return {
        type: "next",
        isNext: true,
        text:
          t.yourTurnNext ||
          (lang === "ur"
            ? "اگلی باری آپ کے آرڈر کی ہے!"
            : "You're next in line!"),
        subtext:
          lang === "ur" ? "(کوئی ٹکٹ آگے نہیں ہے)" : "(No tickets ahead)",
      };
    }

    const itemsAhead = fullQueue.slice(0, firstMyGlobalIdx);
    const aheadTicketsSet = new Set<string>();
    itemsAhead.forEach((i) => {
      const tkt = (
        i.ticketNo ||
        i.orderNo ||
        `TKT-${i.orderId}`
      )
        .trim()
        .toUpperCase();
      if (tkt) aheadTicketsSet.add(tkt);
    });

    const aheadTicketsList = Array.from(aheadTicketsSet);
    const totalItemsAheadCount = itemsAhead.reduce(
      (sum, i) => sum + i.quantity,
      0
    );

    return {
      type: "ahead",
      isNext: false,
      ticketsCount: aheadTicketsSet.size,
      ticketsList: aheadTicketsList,
      totalItemsCount: totalItemsAheadCount,
      text:
        lang === "ur"
          ? `آپ سے پہلے قطار میں ${aheadTicketsSet.size} ٹکٹس ہیں`
          : `${aheadTicketsSet.size} ${
              aheadTicketsSet.size === 1 ? "ticket ahead" : "tickets ahead"
            } in queue`,
      ticketsText:
        aheadTicketsList.length > 0 ? `(${aheadTicketsList.join(", ")})` : "",
      subtext:
        lang === "ur"
          ? `کل ${totalItemsAheadCount} اشیاء پہلے ہیں`
          : `${totalItemsAheadCount} items ahead`,
    };
  }, [selectedFilter, fullQueue, myActiveItems, myActiveTicketsList, lang, t]);

  // Minimal Colored Dot Status Indicator
  const renderLiveStatus = (status: string) => {
    switch (status) {
      case "preparing":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800/60 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>{t.itemCooking || "Cooking"}</span>
          </span>
        );
      case "ready":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800/60 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>{t.itemReady || "Ready"}</span>
          </span>
        );
      case "served":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-zinc-300 bg-stone-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-zinc-700">
            <span className="w-2 h-2 rounded-full bg-stone-400 dark:bg-zinc-500 shrink-0" />
            <span>{t.itemServed || "Served"}</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-300/60">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span>{t.status.cancelled}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-zinc-300 bg-stone-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-stone-200/80 dark:border-zinc-700/80">
            <span className="w-2 h-2 rounded-full bg-stone-500 dark:bg-zinc-400 shrink-0" />
            <span>{t.itemPending || "Queued"}</span>
          </span>
        );
    }
  };

  // ── EMPTY STATE ──────────────────────────────────────────────────────
  if (myActiveItems.length === 0 && fullQueue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full max-w-sm mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
          <FaCircleCheck className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-stone-900 dark:text-white">
            {t.allServedCelebration || "All Orders Served"}
          </h3>
          <p className="text-xs text-stone-500 dark:text-zinc-400">
            {t.noActiveKitchenOrders ||
              "No pending kitchen orders right now. Everything has been served fresh."}
          </p>
        </div>

        <div className="flex gap-2 w-full pt-2">
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onOrderMore();
            }}
            className="flex-1 h-9 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <FaPlus className="w-3 h-3" />
            <span>{t.orderMoreItems || "Order Food"}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onViewAllOrders();
            }}
            className="h-9 px-3 border border-stone-200 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-800 active:scale-95 text-stone-700 dark:text-zinc-300 font-medium rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <FaReceipt className="w-3 h-3 text-stone-400" />
            <span>{t.myOrders || "History"}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2.5">
      {/* ── 1. Minimalist Material 3 Queue Notice Banner ─────────────── */}
      {activeNoticeInfo ? (
        <div
          className={`rounded-2xl p-3 flex items-center justify-between gap-3 shrink-0 shadow-2xs transition-all ${
            activeNoticeInfo.isNext
              ? "bg-emerald-50/90 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border border-emerald-200/70 dark:border-emerald-800/50"
              : "bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 border border-stone-200/70 dark:border-zinc-800"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {activeNoticeInfo.isNext ? (
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FaWandMagicSparkles className="w-4 h-4 animate-pulse" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <FaClock className="w-4 h-4" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold truncate flex items-center gap-1.5 flex-wrap">
                <span>{activeNoticeInfo.text}</span>
                {activeNoticeInfo.ticketsText && (
                  <span className="text-stone-400 dark:text-zinc-500 font-mono text-[11px] font-normal">
                    {activeNoticeInfo.ticketsText}
                  </span>
                )}
              </div>
              {activeNoticeInfo.subtext && (
                <div className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">
                  {activeNoticeInfo.subtext}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              onOrderMore();
            }}
            className="h-8 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs active:scale-95"
          >
            <FaPlus className="w-2.5 h-2.5" />
            <span>
              {t.orderMoreItems || (lang === "ur" ? "مزید اشیاء" : "Add Items")}
            </span>
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 border border-stone-200/70 dark:border-zinc-800 shadow-2xs flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
            {t.fullKitchenQueue || "Kitchen Queue"}
          </div>
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onOrderMore();
            }}
            className="h-8 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs active:scale-95"
          >
            <FaPlus className="w-2.5 h-2.5" />
            <span>
              {t.orderMoreItems || (lang === "ur" ? "مزید اشیاء" : "Add Items")}
            </span>
          </button>
        </div>
      )}

      {/* ── 2. Clean Material 3 Filter Chips ────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0">
        {/* "All" Chip */}
        <button
          type="button"
          onClick={() => {
            playTapSound();
            setSelectedFilter("all");
          }}
          className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedFilter === "all"
              ? "bg-stone-900 text-white dark:bg-white dark:text-stone-950 font-bold shadow-2xs"
              : "bg-stone-100 dark:bg-zinc-800/90 text-stone-600 dark:text-zinc-300 hover:bg-stone-200/80"
          }`}
        >
          <FaLayerGroup className="w-2.5 h-2.5 opacity-70" />
          <span>{t.fullKitchenQueue || "All Queue"}</span>
          <span dir="ltr" className="text-[10px] font-mono opacity-80">
            {fullQueue.length}
          </span>
        </button>

        {/* "My Orders" Chip */}
        {myActiveItems.length > 0 && (
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setSelectedFilter("my_orders");
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === "my_orders"
                ? "bg-amber-500 text-stone-950 font-bold shadow-2xs"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50"
            }`}
          >
            <FaStar className="w-2.5 h-2.5 text-amber-500" />
            <span>{t.onlyMyOrders || "My Orders"}</span>
            <span dir="ltr" className="text-[10px] font-mono font-bold">
              ({myActiveItems.length})
            </span>
          </button>
        )}

        {/* Product Chips (Only active products ordered by this customer) */}
        {myOrderedProductGroups.map((prod) => {
          const isSelected = selectedFilter === prod.name;
          const displayProdName = getItemDisplayName(prod.name, lang);
          return (
            <button
              key={prod.name}
              type="button"
              onClick={() => {
                playTapSound();
                setSelectedFilter(isSelected ? "all" : prod.name);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                isSelected
                  ? "bg-amber-500 text-stone-950 font-bold shadow-2xs"
                  : "bg-stone-100 dark:bg-zinc-800/90 text-stone-700 dark:text-zinc-300 hover:bg-stone-200/80 border border-stone-200/70 dark:border-zinc-700/70"
              }`}
            >
              <span className="truncate max-w-[120px]">{displayProdName}</span>
              <span dir="ltr" className="text-[10px] font-mono font-bold opacity-75">
                ×{prod.myCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 3. Clean Material 3 Attached Active Orders Container ─────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 pb-20 lg:pb-4">
        <div className="divide-y divide-stone-100 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900">
          {displayedItems.map((item, idx) => {
            const itemImg = getAccurateItemImageByName(item.name, item.imageUrl);
            const itemTicket =
              item.ticketNo || item.orderNo || `#${item.orderId}`;
            const isMine = item.isMyOrder;
            const itemDisplayName = getItemDisplayName(item.name, lang);
            const isPending = item.kitchenStatus === "pending";
            const isCancelling = cancellingItemId === item.id;
            const isConfirmingCancel = confirmCancelId === item.id;

            const statusLeftBorder = isMine
              ? item.kitchenStatus === "preparing"
                ? "border-l-4 border-l-amber-500 bg-amber-500/[0.02]"
                : item.kitchenStatus === "ready"
                ? "border-l-4 border-l-emerald-500 bg-emerald-500/[0.02]"
                : item.kitchenStatus === "served"
                ? "border-l-4 border-l-stone-300 dark:border-l-zinc-700 opacity-80"
                : item.kitchenStatus === "cancelled"
                ? "border-l-4 border-l-red-500 opacity-60"
                : "border-l-4 border-l-amber-400"
              : "border-l-0 opacity-85";

            return (
              <div
                key={`${item.orderId}-${item.id}-${idx}`}
                className={`px-2.5 py-1.5 sm:py-2 transition-all duration-200 flex items-center justify-between gap-2.5 ${statusLeftBorder} ${
                  isMine
                    ? "hover:bg-amber-50/25 dark:hover:bg-amber-950/15"
                    : "hover:bg-stone-50/60 dark:hover:bg-zinc-800/40"
                }`}
              >
              {/* Left: Product Thumbnail with Queue Badge */}
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-stone-100 dark:bg-zinc-800 shrink-0 border border-stone-200/80 dark:border-zinc-700/80">
                <img
                  src={itemImg}
                  alt={itemDisplayName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <span
                  dir="ltr"
                  className="absolute bottom-0 right-0 bg-stone-900/85 text-white text-[7px] font-mono font-bold px-0.5 rounded-tl"
                >
                  #{idx + 1}
                </span>
              </div>

              {/* Center: Dish Name, Ticket Badge & Info */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white truncate">
                    {itemDisplayName}
                  </h4>

                  {isMine ? (
                    <span
                      dir="ltr"
                      className="font-mono font-bold text-[10px] bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-md flex items-center gap-1"
                    >
                      <FaTicket className="w-2 h-2 text-amber-500" />
                      <span>{itemTicket}</span>
                      <span className="font-normal text-[9px] opacity-75">
                        {lang === "ur" ? "(آپ)" : "(You)"}
                      </span>
                    </span>
                  ) : (
                    <span
                      dir="ltr"
                      className="font-mono text-[10px] text-stone-500 dark:text-zinc-400 bg-stone-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded-md border border-stone-200/60 dark:border-zinc-700/60"
                    >
                      {itemTicket}
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-stone-400 dark:text-zinc-500 flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold font-mono text-stone-700 dark:text-zinc-300">
                    ×{item.quantity}
                  </span>
                  {item.unitPrice && (
                    <span>
                      • Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                    </span>
                  )}
                  {item.seatingNo && (
                    <>
                      <span>•</span>
                      <span>{item.seatingNo}</span>
                    </>
                  )}
                  <span>•</span>
                  <span dir="ltr" className="font-mono">
                    {fmtTime(item.createdAt)}
                  </span>
                </div>
              </div>

              {/* Right: Live Status Pill & Single-Item Cancel Action (Before Cooking) */}
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                {renderLiveStatus(item.kitchenStatus)}

                {/* Single Product Cancel Button: ONLY available before cooking (status === "pending") */}
                {isMine && isPending && onCancelItem && (
                  <div>
                    {isConfirmingCancel ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isCancelling}
                          onClick={async () => {
                            setConfirmCancelId(null);
                            await onCancelItem(item.id, item.orderId);
                          }}
                          className="h-7 px-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[10px] transition cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                        >
                          {isCancelling ? (
                            <FaSpinner className="animate-spin w-2.5 h-2.5" />
                          ) : (
                            <FaCheck className="w-2.5 h-2.5" />
                          )}
                          <span>
                            {lang === "ur" ? "ہاں، منسوخ" : "Confirm"}
                          </span>
                        </button>
                        <button
                          type="button"
                          disabled={isCancelling}
                          onClick={() => setConfirmCancelId(null)}
                          className="h-7 px-1.5 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 rounded-lg text-[10px] hover:bg-stone-200 transition cursor-pointer"
                        >
                          <FaXmark className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isCancelling}
                        onClick={() => setConfirmCancelId(item.id)}
                        className="h-7 px-2 rounded-lg bg-stone-100 hover:bg-red-50 dark:bg-zinc-800/80 dark:hover:bg-red-950/30 text-stone-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 text-[11px] font-medium border border-stone-200/80 hover:border-red-200 dark:border-zinc-700 transition cursor-pointer flex items-center gap-1 active:scale-95"
                        title="Cancel this item before cooking starts"
                      >
                        <FaXmark className="w-2.5 h-2.5" />
                        <span>
                          {t.cancel || (lang === "ur" ? "منسوخ" : "Cancel")}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
