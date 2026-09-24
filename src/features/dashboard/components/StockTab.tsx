"use client";

import React, { useState } from "react";
import { Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLang } from "@/contexts/LangContext";
import { StockItem } from "@/types/hotel";

interface StockTabProps {
  stockData?: StockItem[];
  isUpdating: boolean;
  onSaveStock: (id: number, values: { total: number; inUse: number; broken: number }) => void;
}

export function StockTab({ stockData, isUpdating, onSaveStock }: StockTabProps) {
  const { t } = useLang();
  const [stockEdits, setStockEdits] = useState<
    Record<number, { total: number; inUse: number; broken: number }>
  >({});

  if (!stockData || stockData.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p>No stock</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-24">
      {stockData.map((item) => {
        const e = stockEdits[item.id];
        const total = e?.total ?? item.totalQuantity;
        const inUse = e?.inUse ?? item.inUse;
        const broken = e?.broken ?? item.broken;
        const avail = total - inUse - broken;
        const hasEdits = !!e;

        return (
          <div key={item.id} className="bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-2xs">
            <div className="flex justify-between items-center mb-3">
              <p className="font-semibold">{item.name}</p>
              <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                {avail} available
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {(
                [
                  ["total", "Total", total],
                  ["inUse", "In Use", inUse],
                  ["broken", "Broken", broken],
                ] as const
              ).map(([key, label, val]) => (
                <div key={key} className="text-center">
                  <label className="text-xs text-gray-500 block mb-1">{label}</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={val}
                    onChange={(evt) =>
                      setStockEdits((p) => ({
                        ...p,
                        [item.id]: {
                          total: p[item.id]?.total ?? item.totalQuantity,
                          inUse: p[item.id]?.inUse ?? item.inUse,
                          broken: p[item.id]?.broken ?? item.broken,
                          [key]: parseInt(evt.target.value, 10) || 0,
                        },
                      }))
                    }
                    className="h-12 text-base font-bold text-center"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                onSaveStock(item.id, { total, inUse, broken });
                setStockEdits((p) => {
                  const n = { ...p };
                  delete n[item.id];
                  return n;
                });
              }}
              disabled={isUpdating || !hasEdits}
              className="w-full h-12 bg-black hover:bg-black/90 active:scale-98 transition text-white font-bold rounded-xl cursor-pointer disabled:opacity-40"
            >
              {t.save}
            </button>
          </div>
        );
      })}
    </div>
  );
}
