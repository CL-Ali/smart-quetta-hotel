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
import { trpc } from "@/lib/trpc";

interface QueueItemDetail {
  id: number;
  menuItemId: number;
  name: string;
  category?: string | null;
  departmentId?: number | null;
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

// Map live department name to clean localized display text
function getLiveDeptDisplayName(deptName: string, lang: string = "en"): string {
  if (!deptName) return "";
  const n = deptName.toLowerCase().trim();
  if (lang === "ur") {
    if (n === "tea") return "چائے و قہوہ";
    if (n === "drinks") return "مشروبات و لسی";
    if (n === "paratha") return "پراٹھا و نان";
    if (n === "kitchen") return "کچن و سالن";
    return deptName;
  }
  return deptName;
}

// Match any ordered item strictly to the Live Departments configured in the database
function resolveItemDepartment(
  item: {
    name: string;
    departmentId?: number | null;
  },
  liveDepts: any[],
  lang: string = "en"
): { key: string; name: string; label: string } {
  // Direct departmentId match with Live Departments from DB
  if (item.departmentId && liveDepts.length > 0) {
    const matched = liveDepts.find((d) => d.id === item.departmentId);
    if (matched) {
      return {
        key: `dept-${matched.id}`,
        name: matched.name,
        label: getLiveDeptDisplayName(matched.name, lang),
      };
    }
  }

  // Fallback to item name
  return {
    key: `dept-all`,
    name: item.name,
    label: getItemDisplayName(item.name, lang) || item.name,
  };
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
  const departmentsQuery = trpc.hotel.getDepartments.useQuery();
  const liveDepartments = departmentsQuery.data || [];
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const firstMyItemRef = React.useRef<HTMLDivElement | null>(null);

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
            name: item.name || item.nameSnapshot || (item.menuItem && item.menuItem.name) || "Item",
            departmentId: item.departmentId || (item.menuItem && item.menuItem.departmentId) || null,
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
            imageUrl: item.imageUrl || (item.menuItem && item.menuItem.imageUrl),
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

    const myItems = sortedList.filter((i) => i.isMyOrder);

    // If user has active orders, filter queue to ONLY show departments user actually ordered from
    if (myItems.length > 0) {
      const myDeptKeys = new Set(myItems.map((i) => resolveItemDepartment(i, liveDepartments, lang).key));

      // Find the last index of user's item per department
      const lastIndexPerDept = new Map<string, number>();
      sortedList.forEach((item, idx) => {
        if (item.isMyOrder) {
          const deptKey = resolveItemDepartment(item, liveDepartments, lang).key;
          lastIndexPerDept.set(deptKey, idx);
        }
      });

      return sortedList.filter((item, idx) => {
        if (item.isMyOrder) return true;
        const deptKey = resolveItemDepartment(item, liveDepartments, lang).key;
        if (!myDeptKeys.has(deptKey)) return false;
        const maxIdx = lastIndexPerDept.get(deptKey) ?? -1;
        return idx <= maxIdx;
      });
    }

    return sortedList;
  }, [kitchenQueue, orders, myTicketSet, myOrderIdSet, guestName, ticketNo, liveDepartments, lang]);

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

  // 2. Department tabs ONLY for live departments ordered by THIS customer that are currently active
  const myOrderedDepartments = useMemo(() => {
    const map = new Map<
      string,
      { deptKey: string; label: string; totalInQueue: number; myCount: number }
    >();
    myActiveItems.forEach((item) => {
      if (item.kitchenStatus === "served" || item.kitchenStatus === "cancelled") return;
      const deptInfo = resolveItemDepartment(item, liveDepartments, lang);
      const ex = map.get(deptInfo.key);
      if (ex) {
        ex.myCount += item.quantity;
      } else {
        const totalInQueue = fullQueue
          .filter((i) => resolveItemDepartment(i, liveDepartments, lang).key === deptInfo.key)
          .reduce((sum, i) => sum + i.quantity, 0);
        map.set(deptInfo.key, {
          deptKey: deptInfo.key,
          label: deptInfo.label,
          totalInQueue,
          myCount: item.quantity,
        });
      }
    });
    return Array.from(map.values());
  }, [myActiveItems, fullQueue, liveDepartments, lang]);

  // If a selected department tab gets served, automatically fallback to "all"
  useEffect(() => {
    if (
      selectedFilter !== "all" &&
      selectedFilter !== "my_orders" &&
      !myOrderedDepartments.some((d) => d.deptKey === selectedFilter)
    ) {
      setSelectedFilter("all");
    }
  }, [myOrderedDepartments, selectedFilter]);

  // 3. Filter items based on selected chip (all / my_orders / specific department key)
  const displayedItems = useMemo(() => {
    if (selectedFilter === "all") return fullQueue;
    if (selectedFilter === "my_orders") return myActiveItems;
    return fullQueue.filter((item) => resolveItemDepartment(item, liveDepartments, lang).key === selectedFilter);
  }, [fullQueue, myActiveItems, selectedFilter, liveDepartments, lang]);

  // Index of user's first product in the displayed queue
  const firstMyItemIndex = useMemo(() => {
    return displayedItems.findIndex((item) => item.isMyOrder);
  }, [displayedItems]);

  // Auto-scroll smoothly to customer's first product in queue when opened or filtered
  useEffect(() => {
    if (firstMyItemRef.current) {
      const timer = setTimeout(() => {
        firstMyItemRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedFilter, firstMyItemIndex]);

  // 4. Dynamic Context-Aware Queue Notice (updates per selected tab / department)
  const activeNoticeInfo = useMemo(() => {
    if (myActiveItems.length === 0 && fullQueue.length === 0) return null;

    // Case A: Specific Department Selected
    if (selectedFilter !== "all" && selectedFilter !== "my_orders") {
      const deptQueue = fullQueue.filter((i) => resolveItemDepartment(i, liveDepartments, lang).key === selectedFilter);
      const selectedDeptObj = myOrderedDepartments.find((d) => d.deptKey === selectedFilter);
      const deptDisplayName = selectedDeptObj?.label || (lang === "ur" ? "شعبہ کچن" : "Station");
      const myDeptItems = deptQueue.filter((i) => i.isMyOrder);
      const hasMyDept = myDeptItems.length > 0;

      if (hasMyDept) {
        const firstMyDeptIdx = deptQueue.findIndex((i) => i.isMyOrder);
        if (firstMyDeptIdx === 0) {
          return {
            type: "next",
            isNext: true,
            dishName: deptDisplayName,
            text:
              lang === "ur"
                ? `${deptDisplayName} میں اگلی باری آپ کی ہے!`
                : `You're next in line in ${deptDisplayName}!`,
            subtext:
              lang === "ur" ? "(اس سیکشن میں کوئی آرڈر آگے نہیں ہے)" : "(No tickets ahead in this station)",
          };
        }

        const precedingDeptItems = deptQueue.slice(0, firstMyDeptIdx);
        const precedingTicketsSet = new Set<string>();
        precedingDeptItems.forEach((i) => {
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
        const deptAheadQty = precedingDeptItems.reduce(
          (s, i) => s + i.quantity,
          0
        );

        return {
          type: "ahead",
          isNext: false,
          ticketsCount: precedingTicketsSet.size,
          ticketsList: aheadTicketsList,
          itemQty: deptAheadQty,
          dishName: deptDisplayName,
          text:
            lang === "ur"
              ? `${deptDisplayName} میں ${precedingTicketsSet.size} آرڈر آپ سے آگے ہیں`
              : `${precedingTicketsSet.size} ${
                  precedingTicketsSet.size === 1 ? "order" : "orders"
                } ahead in ${deptDisplayName}`,
          ticketsText:
            aheadTicketsList.length > 0
              ? `(${aheadTicketsList.join(", ")})`
              : "",
          subtext:
            lang === "ur"
              ? `آپ سے پہلے ${deptAheadQty} عدد زیرِ تیاری ہیں`
              : `${deptAheadQty} items ahead in ${deptDisplayName}`,
        };
      } else {
        const totalDeptQty = deptQueue.reduce((s, i) => s + i.quantity, 0);
        const totalDeptTickets = Array.from(
          new Set(
            deptQueue.map((i) =>
              (i.ticketNo || `TKT-${i.orderId}`).toUpperCase()
            )
          )
        );
        return {
          type: "info",
          isNext: false,
          dishName: deptDisplayName,
          text:
            lang === "ur"
              ? `${deptDisplayName} میں کل ${totalDeptQty} آرڈرز ہیں`
              : `${deptDisplayName} Queue: ${totalDeptQty} items`,
          ticketsText:
            totalDeptTickets.length > 0
              ? `(${totalDeptTickets.join(", ")})`
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
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border-0 shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>{t.itemCooking || "Cooking"}</span>
          </span>
        );
      case "ready":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border-0 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>{t.itemReady || "Ready"}</span>
          </span>
        );
      case "served":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-zinc-300 bg-stone-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full border-0 shrink-0">
            <span className="w-2 h-2 rounded-full bg-stone-400 dark:bg-zinc-500 shrink-0" />
            <span>{t.itemServed || "Served"}</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-0 shrink-0">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span>{t.status.cancelled}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-zinc-300 bg-stone-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full border-0 shrink-0">
            <span className="w-2 h-2 rounded-full bg-stone-500 dark:bg-zinc-400 shrink-0" />
            <span>{t.itemPending || "In Queue"}</span>
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
    <div className="flex flex-col h-full overflow-hidden space-y-2">
      {/* ── 1. Floating Queue Notice Banner (Compact) ─────────────── */}
      {activeNoticeInfo ? (
        <div
          className={`rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 shrink-0 border-0 shadow-none transition-all ${
            activeNoticeInfo.isNext
              ? "bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200"
              : "bg-white dark:bg-[#121824] text-[#24180A] dark:text-white"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {activeNoticeInfo.isNext ? (
              <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FaWandMagicSparkles className="w-3.5 h-3.5 animate-pulse" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-amber-500/15 text-[#D98A3C] flex items-center justify-center shrink-0">
                <FaClock className="w-3.5 h-3.5" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold leading-snug">
                {activeNoticeInfo.text}
              </div>
              {activeNoticeInfo.ticketsText && (
                <div className="text-stone-400 dark:text-stone-500 font-mono text-[10px] font-normal truncate">
                  {activeNoticeInfo.ticketsText}
                </div>
              )}
              {activeNoticeInfo.subtext && (
                <div className="text-[10px] text-stone-500 dark:text-zinc-400 font-medium">
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
            className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-full bg-[#D98A3C] hover:bg-[#c27931] text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shrink-0 shadow-none active:scale-95"
          >
            <FaPlus className="w-2 h-2" />
            <span>
              {t.orderMoreItems || (lang === "ur" ? "مزید اشیاء" : "Order More")}
            </span>
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#121824] rounded-2xl p-2.5 sm:p-3 border-0 shadow-none flex items-center justify-between gap-2.5 shrink-0">
          <div className="text-xs font-bold text-[#24180A] dark:text-white">
            {t.fullKitchenQueue || "Kitchen Queue"}
          </div>
          <button
            type="button"
            onClick={() => {
              playTapSound();
              onOrderMore();
            }}
            className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-full bg-[#D98A3C] hover:bg-[#c27931] text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shrink-0 shadow-none active:scale-95"
          >
            <FaPlus className="w-2 h-2" />
            <span>
              {t.orderMoreItems || (lang === "ur" ? "مزید اشیاء" : "Order More")}
            </span>
          </button>
        </div>
      )}

      {/* ── 2. Floating Pill Filter Chips (Compact) ────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0">
        {/* "All" Chip */}
        <button
          type="button"
          onClick={() => {
            playTapSound();
            setSelectedFilter("all");
          }}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 border-0 shadow-none ${
            selectedFilter === "all"
              ? "bg-[#D98A3C] text-white font-black"
              : "bg-white dark:bg-[#121824] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
          }`}
        >
          <FaLayerGroup className="w-2.5 h-2.5 opacity-70" />
          <span>{t.fullKitchenQueue || "All Queue"}</span>
          <span dir="ltr" className="text-[9.5px] font-mono opacity-80">
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
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 border-0 shadow-none ${
              selectedFilter === "my_orders"
                ? "bg-[#D98A3C] text-white font-black"
                : "bg-white dark:bg-[#121824] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            <FaStar className="w-2.5 h-2.5 text-amber-500" />
            <span>{t.onlyMyOrders || "My Orders"}</span>
            <span dir="ltr" className="text-[9.5px] font-mono font-bold">
              ({myActiveItems.length})
            </span>
          </button>
        )}

        {/* Department Chips (Only active departments ordered by this customer) */}
        {myOrderedDepartments.map((dept) => {
          const isSelected = selectedFilter === dept.deptKey;
          return (
            <button
              key={dept.deptKey}
              type="button"
              onClick={() => {
                playTapSound();
                setSelectedFilter(isSelected ? "all" : dept.deptKey);
              }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 border-0 shadow-none ${
                isSelected
                  ? "bg-[#D98A3C] text-white font-black"
                  : "bg-white dark:bg-[#121824] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <span className="truncate max-w-[120px]">{dept.label}</span>
              <span dir="ltr" className="text-[9.5px] font-mono font-bold opacity-75">
                ({dept.totalInQueue})
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 3. Floating Active Orders Container (Compact Pill-Shaped Rows) ─────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 pb-20 lg:pb-4 space-y-1.5 p-0.5">
        {displayedItems.map((item, idx) => {
          const itemImg = getAccurateItemImageByName(item.name, item.imageUrl);
          const itemTicket =
            item.ticketNo || item.orderNo || `#${item.orderId}`;
          const isMine = item.isMyOrder;
          const isMyOrdersFilter = selectedFilter === "my_orders";
          const isFirstMine = !isMyOrdersFilter && idx === firstMyItemIndex;
          const isOtherQueued = !isMine;
          const itemDisplayName = getItemDisplayName(item.name, lang);
          const isPending = item.kitchenStatus === "pending";
          const isCancelling = cancellingItemId === item.id;
          const isConfirmingCancel = confirmCancelId === item.id;

          return (
            <div
              key={`${item.orderId}-${item.id}-${idx}`}
              ref={isFirstMine ? firstMyItemRef : undefined}
              className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-white dark:bg-[#121824] transition-all flex items-center gap-2.5 shadow-none hover:bg-stone-50/80 dark:hover:bg-[#182030] ${
                isFirstMine
                  ? "border-2 border-[#D98A3C] shadow-sm shadow-amber-500/10 bg-amber-50/40 dark:bg-amber-950/20"
                  : isMine
                  ? "border-2 border-[#D98A3C]"
                  : "border-2 border-transparent"
              } ${isOtherQueued ? "opacity-50 hover:opacity-90" : "opacity-100"}`}
            >
              {/* Left: Product Thumbnail with Queue Number */}
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-[#F8F3EC] dark:bg-[#1A2232] shrink-0">
                <img
                  src={itemImg}
                  alt={itemDisplayName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <span
                  dir="ltr"
                  className="absolute bottom-0 right-0 text-[7.5px] font-mono font-bold px-1 rounded-tl-md bg-[#24180A]/90 text-white"
                >
                  #{idx + 1}
                </span>
              </div>

              {/* Center + Right Stack */}
              <div className="min-w-0 flex-1 flex flex-col justify-center gap-0.5">
                {/* Row 1: Dish Full Name & Live Status Badge */}
                <div className="flex items-center justify-between gap-1.5 min-w-0">
                  <h4 className="text-xs sm:text-[13px] font-extrabold text-[#24180A] dark:text-white truncate">
                    {itemDisplayName}
                  </h4>
                  <div className="shrink-0">
                    {renderLiveStatus(item.kitchenStatus)}
                  </div>
                </div>

                {/* Row 2: Ticket Badge, Quantity, Time & Single-Item Cancel Action */}
                <div className="flex items-center justify-between gap-1.5 min-w-0">
                  {/* Meta Details: Ticket badge, Qty, Time (No Price in Queue) */}
                  <div className="flex items-center gap-1.5 text-[10.5px] text-stone-500 dark:text-zinc-400 font-medium min-w-0 truncate">
                    {/* Ticket Badge */}
                    <span
                      dir="ltr"
                      className={`font-mono text-[8.5px] sm:text-[9.5px] px-1.5 py-0.2 rounded-md font-bold shrink-0 flex items-center gap-0.5 ${
                        isFirstMine
                          ? "bg-[#D98A3C] text-stone-950 font-black"
                          : isMine
                          ? "bg-[#D98A3C]/15 text-[#D98A3C]"
                          : "bg-[#F8F3EC] dark:bg-[#1A2232] text-stone-500 dark:text-zinc-400 font-medium"
                      }`}
                    >
                      <span>{itemTicket}</span>
                      {isMine && (
                        <span className="text-[8px]">
                          {isFirstMine
                            ? lang === "ur"
                              ? "(اگلا)"
                              : "(Next)"
                            : lang === "ur"
                            ? "(آپ)"
                            : "(You)"}
                        </span>
                      )}
                    </span>

                    <span className="font-bold font-mono text-[#24180A] dark:text-zinc-200">
                      ×{item.quantity}
                    </span>
                    <span>•</span>
                    <span dir="ltr" className="font-mono text-stone-400 text-[9.5px]">
                      {fmtTime(item.createdAt)}
                    </span>
                  </div>

                  {/* Single Product Cancel Button (Available until served) */}
                  {isMine && item.kitchenStatus !== "served" && item.kitchenStatus !== "cancelled" && onCancelItem && (
                    <div className="shrink-0">
                      {isConfirmingCancel ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={isCancelling}
                            onClick={async () => {
                              setConfirmCancelId(null);
                              await onCancelItem(item.id, item.orderId);
                            }}
                            className="h-5.5 px-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full text-[9.5px] transition cursor-pointer flex items-center gap-1 shadow-none active:scale-95"
                          >
                            {isCancelling ? (
                              <FaSpinner className="animate-spin w-2 h-2" />
                            ) : (
                              <FaCheck className="w-2 h-2" />
                            )}
                            <span>
                              {lang === "ur" ? "ہاں" : "Yes"}
                            </span>
                          </button>
                          <button
                            type="button"
                            disabled={isCancelling}
                            onClick={() => setConfirmCancelId(null)}
                            className="h-5.5 px-1.5 bg-black/10 dark:bg-white/10 text-[#24180A] dark:text-zinc-300 rounded-full text-[9.5px] hover:bg-black/20 transition cursor-pointer"
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
    </div>
  );
}
