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
      <div className="min-h-screen bg-[#F8F3EC] dark:bg-[#0B0F17] text-[#24180A] dark:text-[#F8FAFC]">
        {/* Monolithic Floating Luxe Top Navigation Header */}
        <header className="bg-white dark:bg-[#121824] rounded-[24px] sm:rounded-[28px] border-0 shadow-none px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0 gap-3 sticky top-3 z-30 mx-3 sm:mx-4 my-2">
          {/* Left: Brand + Context */}
          <div className="flex items-center gap-3 shrink-0 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#D98A3C] text-white flex items-center justify-center font-black shrink-0 shadow-none">
              <Utensils className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-black text-[#24180A] dark:text-white leading-none truncate">
                  {t.hotelName || "Smart Quetta Hotel"}
                </h1>
                {staff?.stationName && (
                  <span className="bg-[#D98A3C]/15 text-[#D98A3C] text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                    <Store className="w-3 h-3 text-[#D98A3C]" />
                    <span>{staff.stationName}</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#D98A3C] font-extrabold uppercase tracking-widest mt-1 truncate">
                Floor Waiter & Table Delivery
              </p>
            </div>
          </div>

          {/* Center: Centered Waiter View Filter Tabs Pill */}
          <div className="flex-1 flex justify-center items-center px-2 min-w-0">
            <div className="flex items-center gap-1.5 bg-[#F4EFEA] dark:bg-[#1A2234] p-1.5 rounded-full overflow-x-auto no-scrollbar max-w-full border-0">
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setFilterTab("all");
                }}
                className={`px-4 py-2 text-xs font-bold rounded-full transition flex items-center gap-2 cursor-pointer select-none shrink-0 border-0 ${
                  filterTab === "all"
                    ? "bg-[#D98A3C] text-white shadow-none font-black"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50"
                }`}
              >
                <span>All Orders</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  filterTab === "all" ? "bg-white/20 text-white" : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
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
                className={`px-4 py-2 text-xs font-bold rounded-full transition flex items-center gap-2 cursor-pointer select-none shrink-0 border-0 ${
                  filterTab === "ready"
                    ? "bg-[#D98A3C] text-white shadow-none font-black"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Ready to Serve</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  filterTab === "ready" ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
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
                className={`px-4 py-2 text-xs font-bold rounded-full transition flex items-center gap-2 cursor-pointer select-none shrink-0 border-0 ${
                  filterTab === "served"
                    ? "bg-[#D98A3C] text-white shadow-none font-black"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/50"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Served History</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  filterTab === "served" ? "bg-white/20 text-white" : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
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
              <div className="hidden md:flex items-center gap-2 bg-[#F4EFEA] dark:bg-[#1A2234] px-3.5 py-1.5 rounded-full text-xs border-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-[#24180A] dark:text-white">{staff.name}</span>
                <span className="text-[10px] font-extrabold text-[#D98A3C] uppercase bg-amber-500/15 px-2 py-0.5 rounded-full">
                  Floor Waiter
                </span>
              </div>
            )}

            <LangSwitcher />

            <button
              type="button"
              onClick={() => logout()}
              className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full transition cursor-pointer shrink-0 border-0"
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
              <Loader2 className="w-8 h-8 animate-spin text-[#D98A3C] mb-3" />
              <p className="text-sm font-bold text-[#24180A] dark:text-white">Loading floor orders…</p>
            </div>
          ) : (
            <>
              {/* Ready to Serve Section */}
              {(filterTab === "all" || filterTab === "ready") && (
                <div>
                  <h2 className="text-sm font-black text-[#24180A] dark:text-white mb-3 flex items-center gap-2">
                    {t.readyToServe}
                    {vm.withReady.length > 0 && (
                      <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full">
                        {vm.withReady.length}
                      </span>
                    )}
                  </h2>

                  {vm.withReady.length === 0 ? (
                    <div className="text-center py-12 text-stone-400 bg-white dark:bg-[#121824] rounded-[28px] border-0 flex flex-col items-center justify-center shadow-none">
                      <Coffee className="w-8 h-8 mb-2 text-stone-300" />
                      <p className="text-sm font-bold text-[#24180A] dark:text-white">{t.noOrdersReady}</p>
                    </div>
                  ) : (
                <div className="space-y-3">
                  {Object.entries(vm.groupedReady).map(([customerName, customerOrders]) => (
                    <div
                      key={customerName}
                      className="rounded-[28px] bg-white dark:bg-[#121824] overflow-hidden border-0 shadow-none mb-3"
                    >
                      {/* Customer Banner */}
                      <div className="bg-[#0D4846] dark:bg-[#0D4846]/80 px-4 py-3 flex items-center justify-between text-white border-0">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-200" />
                          <span className="font-bold text-sm text-white">{customerName}</span>
                        </div>
                        {customerOrders[0]?.counterName && (
                          <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border-0">
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
                          <div key={order.id} className="border-t border-[#F8F3EC] dark:border-white/5 first:border-0">
                            <button
                              type="button"
                              onClick={() => vm.toggleExpand(order.id)}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F8F3EC]/40 dark:hover:bg-[#1A2232]/40 transition-colors text-left cursor-pointer border-0"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-stone-400">#{order.id}</span>
                                {(order.seatingNo || order.tableNo) && (
                                  <span className="text-[11px] font-bold bg-[#D98A3C]/15 text-[#D98A3C] px-2 py-0.5 rounded-full">
                                    {order.seatingNo
                                      ? order.seatingType === "seat"
                                        ? `Seat ${order.seatingNo}`
                                        : `Table ${order.seatingNo}`
                                      : order.tableNo}
                                  </span>
                                )}
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                                  {readyItems.length} item{readyItems.length !== 1 ? "s" : ""} ready
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-[#24180A] dark:text-white font-mono">
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
                                      className={`flex items-center justify-between rounded-2xl px-3 py-2.5 border-0 ${
                                        isServed
                                          ? "bg-[#F8F3EC]/30 dark:bg-[#1A2232]/30 opacity-60"
                                          : "bg-[#F8F3EC] dark:bg-[#1A2232]"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        {isServed ? (
                                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                        ) : (
                                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                                        )}
                                        <span className="text-sm font-bold text-[#24180A] dark:text-white truncate">
                                          {item.name}
                                        </span>
                                        <span className="text-xs font-bold text-[#D98A3C] shrink-0">
                                          ×{item.quantity}
                                          {item.servedQty > 0 &&
                                            item.servedQty < item.quantity && (
                                              <span className="text-[#D98A3C] font-bold">
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
                                          className="shrink-0 ml-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-full cursor-pointer flex items-center gap-1 border-0 shadow-none transition active:scale-95"
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
                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition text-white text-xs font-bold rounded-full cursor-pointer flex items-center justify-center gap-2 border-0"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                    <span>Serve All ({readyItems.length} items)</span>
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
              <h2 className="text-sm font-black text-[#24180A] dark:text-white mb-3">{t.recentlyServed}</h2>
              <div className="space-y-2">
                {vm.recentServed.map((order: any) => (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-[#121824] border-0 rounded-[24px] px-4 py-3 flex justify-between items-center shadow-none"
                  >
                    <div>
                      <p className="font-bold text-sm text-[#24180A] dark:text-white">
                        #{order.id} — {order.customerName}
                      </p>
                      <p className="text-xs text-stone-400">{fmtTime(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        Rs. {(order.servedAmount ?? order.totalAmount ?? 0).toFixed(0)}
                      </p>
                      <span className="flex items-center gap-1 text-xs text-stone-400 justify-end">
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
