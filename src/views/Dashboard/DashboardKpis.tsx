"use client";

import React from "react";
import { Banknote } from "lucide-react";
import { useLang } from "@/contexts/LangContext";

interface DashboardKpisProps {
  cashReport?: {
    totalCash?: string | null;
    cashTotal?: string | null;
    bankTotal?: string | null;
  } | null;
  pendingCount: number;
  readyCount: number;
  unpaidCount: number;
}

/**
 * Top KPI Summary Banner (Revenue & Order Queues)
 */
export function DashboardKpis({
  cashReport,
  pendingCount,
  readyCount,
  unpaidCount,
}: DashboardKpisProps) {
  const { t } = useLang();

  const totalRevenue = parseInt(cashReport?.totalCash ?? "0", 10);
  const cashAmount = parseInt(cashReport?.cashTotal ?? "0", 10);
  const bankAmount = parseInt(cashReport?.bankTotal ?? "0", 10);

  return (
    <div className="mb-4 space-y-2">
      {/* Revenue Card (Split cash / bank / total) */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-500 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-10 pointer-events-none">
          <Banknote className="w-24 h-24" />
        </div>
        <p className="text-[10px] text-orange-100 uppercase tracking-wider font-bold">
          {t.todayRevenue}
        </p>
        <h2 className="text-2xl font-black mt-0.5">Rs. {totalRevenue}</h2>

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/20 text-xs text-orange-50 font-medium">
          <div>
            <span className="opacity-75">{t.cashSplit}:</span>{" "}
            <span className="font-bold text-white">Rs. {cashAmount}</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <div>
            <span className="opacity-75">{t.bankSplit}:</span>{" "}
            <span className="font-bold text-white">Rs. {bankAmount}</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5 text-center shadow-xs">
          <p className="text-lg font-black text-amber-700">{pendingCount}</p>
          <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">
            {t.inKitchen}
          </p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-2.5 text-center shadow-xs">
          <p className="text-lg font-black text-green-700">{readyCount}</p>
          <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider">
            {t.ready2}
          </p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-2.5 text-center shadow-xs">
          <p className="text-lg font-black text-red-700">{unpaidCount}</p>
          <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">
            {t.unpaidOrders}
          </p>
        </div>
      </div>
    </div>
  );
}
