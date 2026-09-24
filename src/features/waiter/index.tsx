"use client";

import React from "react";
import { Loader2, Utensils, Coffee, Check, UserCheck, ChevronDown, ChevronUp, Store, User, LogOut, ChefHat } from "lucide-react";
import Link from "next/link";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { useLang } from "@/contexts/LangContext";
import { useAuth } from "@/contexts/AuthContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import { StaffWorkspaceSwitcher } from "@/components/StaffWorkspaceSwitcher";
import { playTapSound } from "@/lib/sound";
import { NewOrderSheet } from "@/components/NewOrderSheet";
import { fmtTime } from "@/lib/time";
import { useWaiterViewModel } from "./viewmodel/useWaiterViewModel";
import { StaffAuthGuard } from "@/components/StaffAuthGuard";

/**
 * Waiter Delivery View (MVVM)
 * Pure UI Layer consuming useWaiterViewModel
 */
export function WaiterView() {
  const { t } = useLang();
  const { staff, logout, permissions } = useAuth();
  const vm = useWaiterViewModel();
  const [filterTab, setFilterTab] = React.useState<"all" | "ready" | "served">("all");

  return (
    <StaffAuthGuard allowedRoles={["admin", "cashier", "kitchen", "waiter"]}>
      <div className="min-h-screen bg-stone-50 text-stone-900">
        {/* Top Navigation Header */}
        <header className="bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-xs gap-3 sticky top-0 z-30 w-full">
          {/* Left: Brand + Context */}
          <div className="flex items-center gap-3 shrink-0 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-black text-stone-900 leading-none truncate">
                  {t.hotelName || "Smart Quetta Hotel"}
                </h1>
                {staff?.stationName && (
                  <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                    <Store className="w-3 h-3 text-amber-600" />
                    <span>{staff.stationName}</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] text-amber-600 font-extrabold uppercase tracking-widest mt-0.5 truncate">
                Floor Waiter & Table Delivery
              </p>
            </div>
          </div>

          {/* Center: Centered Waiter View Filter Tabs Pill */}
          <div className="flex-1 flex justify-center items-center px-2 min-w-0">
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/60 overflow-x-auto no-scrollbar max-w-full">
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setFilterTab("all");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  filterTab === "all"
                    ? "bg-amber-500 text-stone-950 shadow-xs font-black"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                }`}
              >
                <span>All Orders</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  filterTab === "all" ? "bg-stone-950 text-amber-400" : "bg-stone-200 text-stone-700"
                }`}>
                  {vm.withReady.length + vm.recentServed.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setFilterTab("ready");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  filterTab === "ready"
                    ? "bg-amber-500 text-stone-950 shadow-xs font-black"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Ready to Serve</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  filterTab === "ready" ? "bg-stone-950 text-amber-400" : "bg-emerald-100 text-emerald-800"
                }`}>
                  {vm.withReady.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setFilterTab("served");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  filterTab === "served"
                    ? "bg-amber-500 text-stone-950 shadow-xs font-black"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Served History</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  filterTab === "served" ? "bg-stone-950 text-amber-400" : "bg-stone-200 text-stone-700"
                }`}>
                  {vm.recentServed.length}
                </span>
              </button>
            </div>
          </div>

          {/* Right: Desktop Tools */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick Staff View Links */}
            <StaffWorkspaceSwitcher current="waiter" />

            {staff && (
              <div className="hidden md:flex items-center gap-2 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-stone-800">{staff.name}</span>
                <span className="text-[10px] font-extrabold text-amber-800 uppercase bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                  Floor Waiter
                </span>
              </div>
            )}

            <LangSwitcher />

            <button
              type="button"
              onClick={() => logout()}
              className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Content Workspace */}
        <main className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-6 pb-20">
          {vm.isLoading ? (
            <div className="text-center py-24 text-stone-400 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
              <p className="text-sm font-bold text-stone-600">Loading floor orders…</p>
            </div>
          ) : (
            <>
              {/* Ready to Serve Section */}
              {(filterTab === "all" || filterTab === "ready") && (
                <div>
                  <h2 className="text-sm font-black text-stone-800 mb-3 flex items-center gap-2">
                    {t.readyToServe}
                    {vm.withReady.length > 0 && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2 py-0.5 rounded-full">
                        {vm.withReady.length}
                      </span>
                    )}
                  </h2>

                  {vm.withReady.length === 0 ? (
                    <div className="text-center py-12 text-stone-400 bg-white rounded-2xl border border-stone-200/80 flex flex-col items-center justify-center shadow-xs">
                      <Coffee className="w-8 h-8 mb-2 text-stone-300" />
                      <p className="text-sm font-bold text-stone-600">{t.noOrdersReady}</p>
                    </div>
                  ) : (
                <div className="space-y-3">
                  {Object.entries(vm.groupedReady).map(([customerName, customerOrders]) => (
                    <div
                      key={customerName}
                      className="rounded-2xl border border-emerald-200/80 bg-white overflow-hidden shadow-xs"
                    >
                      {/* Customer Banner */}
                      <div className="bg-emerald-600 px-4 py-2.5 flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-100" />
                          <span className="font-bold text-sm text-white">{customerName}</span>
                        </div>
                        {customerOrders[0]?.counterName && (
                          <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            <span>{customerOrders[0].counterName}</span>
                          </span>
                        )}
                      </div>

                      {customerOrders.map((order: any) => {
                        const readyItems =
                          order.items?.filter((i: any) => i.kitchenStatus === "ready") ?? [];
                        const isExpanded =
                          vm.expandedOrders.has(order.id) || customerOrders.length === 1;
                        const servedBill = order.servedAmount ?? 0;

                        return (
                          <div key={order.id} className="border-b border-stone-100 last:border-0">
                            <button
                              type="button"
                              onClick={() => vm.toggleExpand(order.id)}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50/50 transition-colors text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-stone-600">#{order.id}</span>
                                {(order.seatingNo || order.tableNo) && (
                                  <span className="text-[11px] font-extrabold bg-amber-50 text-amber-950 border border-amber-200 px-1.5 py-0.2 rounded-md">
                                    {order.seatingNo
                                      ? order.seatingType === "seat"
                                        ? `Seat ${order.seatingNo}`
                                        : `Table ${order.seatingNo}`
                                      : order.tableNo}
                                  </span>
                                )}
                                <span className="text-xs text-emerald-700 font-bold">
                                  {readyItems.length} item{readyItems.length !== 1 ? "s" : ""} ready
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-stone-900">
                                  Rs. {servedBill.toFixed(0)} served
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-stone-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-stone-400" />
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
                                          ? "bg-stone-50 border-stone-100 opacity-60"
                                          : "bg-white border-emerald-200/80 shadow-2xs"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        {isServed ? (
                                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        ) : (
                                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                        )}
                                        <span className="text-sm font-semibold text-stone-900 truncate">
                                          {item.name}
                                        </span>
                                        <span className="text-xs text-stone-500 shrink-0">
                                          ×{item.quantity}
                                          {item.servedQty > 0 &&
                                            item.servedQty < item.quantity && (
                                              <span className="text-amber-700 font-bold">
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
                                          className="shrink-0 ml-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs transition"
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
                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition text-white text-sm font-black rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-xs"
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
          )}

          {/* Recently Served Section */}
          {(filterTab === "all" || filterTab === "served") && vm.recentServed.length > 0 && (
            <div>
              <h2 className="text-sm font-black text-stone-800 mb-3">{t.recentlyServed}</h2>
              <div className="space-y-2">
                {vm.recentServed.map((order: any) => (
                  <div
                    key={order.id}
                    className="bg-white border border-stone-200/80 rounded-xl px-4 py-3 flex justify-between items-center shadow-2xs"
                  >
                    <div>
                      <p className="font-bold text-sm text-stone-900">
                        #{order.id} — {order.customerName}
                      </p>
                      <p className="text-xs text-stone-400">{fmtTime(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-700">
                        Rs. {(order.servedAmount ?? order.totalAmount ?? 0).toFixed(0)}
                      </p>
                      <span className="flex items-center gap-1 text-xs text-stone-500 justify-end">
                        <UserCheck className="w-3 h-3 text-emerald-600" /> Served
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </main>

        {/* Manual Quick Add Order */}
        <NewOrderSheet
          open={vm.showNewOrder}
          onClose={() => vm.setShowNewOrder(false)}
          onDone={vm.refetch}
        />
        <FloatingAddButton onClick={() => vm.setShowNewOrder(true)} />
      </div>
    </StaffAuthGuard>
  );
}

export default WaiterView;
