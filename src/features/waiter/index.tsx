"use client";

import React from "react";
import { Loader2, Utensils, Coffee, Check, UserCheck, ChevronDown, ChevronUp } from "lucide-react";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import { NewOrderSheet } from "@/components/NewOrderSheet";
import { fmtTime } from "@/lib/time";
import { DashboardPinGate } from "@/components/DashboardPinGate";

// ViewModel
import { useWaiterViewModel } from "./viewmodel/useWaiterViewModel";

/**
 * Waiter Delivery View (MVVM)
 * Pure UI Layer consuming useWaiterViewModel
 */
export function WaiterView() {
  const { t } = useLang();
  const vm = useWaiterViewModel();

  if (!vm.pinUnlocked) {
    return <DashboardPinGate onUnlocked={vm.handleUnlockPin} />;
  }

  if (vm.isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-2xs">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-green-600" />
            <h1 className="text-lg font-bold">{t.waiterView}</h1>
            {vm.withReady.length > 0 && (
              <span className="bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {vm.withReady.length}
              </span>
            )}
          </div>
          <LangSwitcher />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-6 pb-20">
        {/* Ready to Serve Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            {t.readyToServe}
            {vm.withReady.length > 0 && (
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {vm.withReady.length}
              </span>
            )}
          </h2>

          {vm.withReady.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
              <Coffee className="w-8 h-8 mb-2 text-gray-300" />
              <p className="text-sm">{t.noOrdersReady}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(vm.groupedReady).map(([customerName, customerOrders]) => (
                <div
                  key={customerName}
                  className="rounded-2xl border-2 border-green-200 bg-green-50 overflow-hidden shadow-2xs"
                >
                  {/* Customer Banner */}
                  <div className="bg-green-600 px-4 py-2 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-100" />
                    <span className="font-bold text-sm text-white">{customerName}</span>
                  </div>

                  {customerOrders.map((order) => {
                    const readyItems =
                      order.items?.filter((i: any) => i.kitchenStatus === "ready") ?? [];
                    const isExpanded =
                      vm.expandedOrders.has(order.id) || customerOrders.length === 1;
                    const servedBill = order.servedAmount ?? 0;

                    return (
                      <div key={order.id} className="border-b border-green-100 last:border-0">
                        <button
                          type="button"
                          onClick={() => vm.toggleExpand(order.id)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-green-100/50 transition-colors text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-green-800">#{order.id}</span>
                            <span className="text-xs text-green-700">
                              {readyItems.length} item{readyItems.length !== 1 ? "s" : ""} ready
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-green-900">
                              Rs. {servedBill.toFixed(0)} served
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-green-700" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-green-700" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-2">
                            {order.items?.map((item: any) => {
                              const isReady = item.kitchenStatus === "ready";
                              const isServed = item.kitchenStatus === "served";
                              const pending = item.quantity - (item.servedQty ?? 0);
                              if (!isReady && !isServed) return null;

                              return (
                                <div
                                  key={item.id}
                                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 border ${
                                    isServed
                                      ? "bg-white/60 border-gray-100 opacity-50"
                                      : "bg-white border-green-200"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {isServed ? (
                                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    ) : (
                                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                                    )}
                                    <span className="text-sm font-semibold text-gray-800 truncate">
                                      {item.name}
                                    </span>
                                    <span className="text-xs text-gray-500 shrink-0">
                                      ×{item.quantity}
                                      {item.servedQty > 0 &&
                                        item.servedQty < item.quantity && (
                                          <span className="text-amber-600">
                                            {" "}
                                            ({item.servedQty} done)
                                          </span>
                                        )}
                                    </span>
                                  </div>

                                  {isReady && pending > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => vm.handleServeItem(item.id, pending)}
                                      disabled={vm.serving.has(item.id)}
                                      className="shrink-0 ml-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs transition"
                                    >
                                      {vm.serving.has(item.id) ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <>
                                          <Check className="w-3 h-3" /> Serve
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              );
                            })}

                            {/* Serve All Button */}
                            {readyItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => vm.handleServeAll(order)}
                                className="w-full py-2.5 bg-green-600 hover:bg-green-700 active:scale-98 transition text-white text-sm font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                              >
                                <UserCheck className="w-4 h-4" />
                                Serve All ({readyItems.length} items)
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Served Section */}
        {vm.recentServed.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-700 mb-3">{t.recentlyServed}</h2>
            <div className="space-y-2">
              {vm.recentServed.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex justify-between items-center shadow-2xs"
                >
                  <div>
                    <p className="font-semibold text-sm">
                      #{order.id} — {order.customerName}
                    </p>
                    <p className="text-xs text-gray-400">{fmtTime(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-700">
                      Rs. {(order.servedAmount ?? order.totalAmount ?? 0).toFixed(0)}
                    </p>
                    <span className="flex items-center gap-1 text-xs text-gray-500 justify-end">
                      <UserCheck className="w-3 h-3" /> Served
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Manual Quick Add Order */}
      <NewOrderSheet
        open={vm.showNewOrder}
        onClose={() => vm.setShowNewOrder(false)}
        onDone={vm.refetch}
      />
      <FloatingAddButton onClick={() => vm.setShowNewOrder(true)} />
    </div>
  );
}

export default WaiterView;
