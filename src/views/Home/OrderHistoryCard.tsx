"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Clock, CheckCircle2 } from "lucide-react";
import { fmtDateTime } from "@/lib/time";
import { useLang } from "@/contexts/LangContext";
import { OrderWithDetails } from "@/types/hotel";

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  preparing: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
  served: "bg-gray-200 text-gray-700",
  paid: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

interface OrderHistoryCardProps {
  order: OrderWithDetails | any;
}

/**
 * Collapsible past order item card for customer order tracking
 */
export function OrderHistoryCard({ order }: OrderHistoryCardProps) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition text-left cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">#{order.id}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {(t.status as any)[order.status] ?? order.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-orange-600 text-sm">
            Rs. {(order.totalAmount ?? 0).toFixed(0)}
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-2">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {fmtDateTime(order.createdAt)}
          </p>

          <div className="space-y-1">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.name} <span className="text-gray-400">×{item.quantity}</span>
                </span>
                <span className="text-gray-600">Rs. {(item.unitPrice * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-sm">
            <span>{t.total}</span>
            <span className="text-orange-600">Rs. {(order.totalAmount ?? 0).toFixed(0)}</span>
          </div>

          {/* Payment Badges */}
          {order.paymentStatus === "paid" && (
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {t.payStatus.paid} — {order.paymentMethod}
            </p>
          )}
          {order.paymentStatus === "partial" && (
            <p className="text-xs text-amber-600">
              {t.payStatus.partial}: Rs. {(order.paidAmount ?? 0).toFixed(0)} / Rs.{" "}
              {(order.totalAmount ?? 0).toFixed(0)}
            </p>
          )}
          {order.paymentStatus === "unpaid" && order.status !== "cancelled" && (
            <p className="text-xs text-red-500">{t.payStatus.unpaid}</p>
          )}
        </div>
      )}
    </div>
  );
}
