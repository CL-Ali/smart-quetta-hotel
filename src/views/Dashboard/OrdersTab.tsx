"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  ChefHat,
  Clock,
  CheckCircle2,
  UserCheck,
  Banknote,
  Ban,
  Wallet,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { fmtTime } from "@/lib/time";
import { useLang } from "@/contexts/LangContext";
import { OrderWithDetails } from "@/types/hotel";

type FilterKey = "all" | "unpaid" | "pending" | "ready" | "paid";

const STATUS_BG: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50",
  preparing: "border-blue-200 bg-blue-50",
  ready: "border-green-200 bg-green-50",
  served: "border-gray-200 bg-gray-50",
  paid: "border-emerald-200 bg-emerald-50",
  cancelled: "border-red-200 bg-red-50",
};

const PAY_PILL: Record<string, string> = {
  unpaid: "bg-red-100 text-red-700",
  partial: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
};

function getStatusIcon(status: string, className = "w-4 h-4") {
  switch (status) {
    case "pending":
      return <Clock className={`${className} text-amber-500`} />;
    case "preparing":
      return <ChefHat className={`${className} text-blue-500 animate-pulse`} />;
    case "ready":
      return <CheckCircle2 className={`${className} text-green-500`} />;
    case "served":
      return <UserCheck className={`${className} text-gray-500`} />;
    case "paid":
      return <Banknote className={`${className} text-emerald-500`} />;
    case "cancelled":
      return <Ban className={`${className} text-red-500`} />;
    default:
      return null;
  }
}

interface OrdersTabProps {
  orders: OrderWithDetails[] | any[];
  unpaidCount: number;
  pendingCount: number;
  readyCount: number;
  onNewOrder: () => void;
  onPayOrder: (order: any) => void;
  onCancelOrder: (id: number) => void;
}

/**
 * Live Orders Management tab with filtering, search, and settlement
 */
export function OrdersTab({
  orders,
  unpaidCount,
  pendingCount,
  readyCount,
  onNewOrder,
  onPayOrder,
  onCancelOrder,
}: OrdersTabProps) {
  const { t } = useLang();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all", label: t.all },
    { key: "unpaid", label: t.unpaidFilter },
    { key: "pending", label: t.queueFilter },
    { key: "ready", label: t.readyFilter },
    { key: "paid", label: t.paidFilter },
  ];

  const filtered = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      String(o.id).includes(search);
    if (!matchesSearch) return false;

    if (filter === "unpaid") return o.paymentStatus !== "paid" && o.status !== "cancelled";
    if (filter === "pending") return o.status === "pending" || o.status === "preparing";
    if (filter === "ready") return o.status === "ready" || o.status === "served";
    if (filter === "paid") return o.paymentStatus === "paid";
    return true;
  });

  return (
    <div className="space-y-3 pb-8">
      {/* Search & New Order Action */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={t.searchOrders}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 bg-white"
          />
        </div>
        <button
          type="button"
          onClick={onNewOrder}
          className="hidden sm:flex h-11 px-4 bg-black hover:bg-black/90 text-white rounded-xl items-center gap-1.5 text-sm font-semibold shrink-0 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t.newOrder}
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition cursor-pointer ${
              filter === f.key
                ? "bg-black text-white border-black shadow-xs"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
            {f.key === "unpaid" && unpaidCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                {unpaidCount}
              </span>
            )}
            {f.key === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                {pendingCount}
              </span>
            )}
            {f.key === "ready" && readyCount > 0 && (
              <span className="ml-1.5 bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                {readyCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <ChefHat className="w-14 h-14 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No orders</p>
        </div>
      )}

      {/* Order Cards */}
      <div className="space-y-3">
        {filtered.map((order) => (
          <div
            key={order.id}
            className={`rounded-2xl border-2 p-4 shadow-2xs ${
              STATUS_BG[order.status] ?? "border-gray-200 bg-white"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-lg flex items-center gap-1.5">
                    #{order.id}
                    {getStatusIcon(order.status, "w-5 h-5")}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      PAY_PILL[order.paymentStatus]
                    }`}
                  >
                    {(t.payStatus as any)[order.paymentStatus]}
                    {order.paymentStatus === "partial" &&
                      ` (Rs.${(order.paidAmount ?? 0).toFixed(0)}/${(
                        order.totalAmount ?? 0
                      ).toFixed(0)})`}
                  </span>
                </div>
                <p className="font-semibold text-base mt-0.5">{order.customerName}</p>
                <p className="text-xs text-gray-400">{fmtTime(order.createdAt)}</p>
              </div>
              <p className="text-xl font-bold text-orange-600">
                Rs. {(order.totalAmount ?? 0).toFixed(0)}
              </p>
            </div>

            {/* Items List */}
            <div className="bg-white/60 rounded-xl px-3 py-2 mb-3 space-y-0.5">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center text-xs text-gray-700">
                  <span>
                    {item.name} <span className="text-gray-400">×{item.quantity}</span>
                  </span>
                  <span className="font-medium">
                    Rs. {(item.unitPrice * item.quantity).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Bar */}
            <div className="flex gap-2 justify-end">
              {order.status !== "cancelled" && order.paymentStatus !== "paid" && (
                <button
                  type="button"
                  onClick={() => onPayOrder(order)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  {t.payment}
                </button>
              )}
              {order.status !== "cancelled" && order.status !== "paid" && (
                <button
                  type="button"
                  onClick={() => onCancelOrder(order.id)}
                  className="flex items-center gap-1 px-3 py-2 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-xl cursor-pointer transition"
                >
                  <Ban className="w-3.5 h-3.5" />
                  {t.cancel}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
