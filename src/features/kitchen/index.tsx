"use client";

import React, { useState, useEffect } from "react";
import { Loader2, ChefHat, Check, Coffee, ChevronDown, ChevronUp, Store, LogOut, Utensils, Layers } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LangContext";
import { useAuth } from "@/contexts/AuthContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import { StaffWorkspaceSwitcher } from "@/components/StaffWorkspaceSwitcher";
import { playTapSound } from "@/lib/sound";
import { fmtTime } from "@/lib/time";
import { useKitchenViewModel } from "./viewmodel/useKitchenViewModel";
import { StaffAuthGuard } from "@/components/StaffAuthGuard";

const ITEM_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-stone-100", text: "text-stone-700", label: "Pending" },
  preparing: { bg: "bg-blue-50", text: "text-blue-700 border border-blue-200", label: "Cooking" },
  ready: { bg: "bg-emerald-50", text: "text-emerald-700 border border-emerald-200", label: "Ready" },
  served: { bg: "bg-stone-50", text: "text-stone-500", label: "Served" },
};

export function KitchenView() {
  const { t } = useLang();
  const { staff, logout, permissions } = useAuth();
  const vm = useKitchenViewModel();
  const departmentsQuery = trpc.hotel.getDepartments.useQuery();

  const [selectedCounter, setSelectedCounter] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  const isStaffRestricted =
    staff?.role === "kitchen" &&
    Boolean(staff.stationName) &&
    !staff.stationName?.includes("All Departments") &&
    !staff.stationName?.includes("Main Kitchen") &&
    !staff.stationName?.includes("127.0.0.1");

  const assignedDept = isStaffRestricted ? staff!.stationName! : null;

  // Sync staff's assigned department if specific
  useEffect(() => {
    if (isStaffRestricted && assignedDept) {
      setSelectedDepartment(assignedDept);
    }
  }, [isStaffRestricted, assignedDept]);

  const getDeptUrdu = (name: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("tea") || n.includes("chai")) return "(چائے و قہوہ)";
    if (n.includes("paratha") || n.includes("tandoor") || n.includes("food")) return "(پراٹھا و تندور)";
    if (n.includes("drink") || n.includes("lassi")) return "(مشروبات و لسی)";
    if (n.includes("appetizer") || n.includes("snack")) return "(سنیکس و پکوڑے)";
    return `(${name})`;
  };

  const matchDepartment = (item: any, deptName: string, depts: any[]) => {
    if (
      !deptName ||
      deptName === "all" ||
      deptName.includes("All Departments") ||
      deptName.includes("Main Kitchen")
    ) {
      return true;
    }
    const lowerDept = deptName.toLowerCase();
    const dObj = depts.find((d) => {
      const dn = (d.name || "").toLowerCase();
      return dn === lowerDept || lowerDept.includes(dn) || dn.includes(lowerDept);
    });
    if (dObj && item.departmentId === dObj.id) return true;
    if (
      item.category &&
      (item.category.toLowerCase() === lowerDept ||
        lowerDept.includes(item.category.toLowerCase()) ||
        item.category.toLowerCase().includes(lowerDept))
    ) {
      return true;
    }
    const lowerName = (item.name || "").toLowerCase();
    if (lowerDept.includes("tea") || lowerDept.includes("chai")) {
      return (
        lowerName.includes("chai") ||
        lowerName.includes("tea") ||
        item.category === "Tea" ||
        (item.category === "Drinks" && !lowerName.includes("lassi"))
      );
    }
    if (lowerDept.includes("paratha") || lowerDept.includes("tandoor") || lowerDept.includes("food")) {
      return (
        lowerName.includes("paratha") ||
        lowerName.includes("puri") ||
        lowerName.includes("anda") ||
        item.category === "Food" ||
        item.category === "Parathas"
      );
    }
    if (lowerDept.includes("drink") || lowerDept.includes("lassi")) {
      return lowerName.includes("lassi") || item.category === "Drinks";
    }
    if (lowerDept.includes("appetizer") || lowerDept.includes("snack")) {
      return (
        lowerName.includes("samosa") ||
        lowerName.includes("pakora") ||
        item.category === "Snacks" ||
        item.category === "Appetizer"
      );
    }
    return false;
  };

  // Extract distinct counters from active orders
  const availableCounters = Array.from(
    new Set((vm.activeOrders || []).map((o: any) => o.counterName || "Main Cashier Counter"))
  );

  // Filter orders by counter and department
  const filteredActiveOrders = (vm.activeOrders || [])
    .filter((o: any) => {
      if (selectedCounter !== "all") {
        const rawCounter = o.counterName || "Main Cashier Counter";
        if (rawCounter !== selectedCounter) return false;
      }
      if (
        selectedDepartment !== "all" &&
        !selectedDepartment.includes("All Departments") &&
        !selectedDepartment.includes("Main Kitchen")
      ) {
        const hasDeptItem = o.items?.some(
          (i: any) =>
            i.kitchenStatus !== "served" &&
            matchDepartment(i, selectedDepartment, departmentsQuery.data || [])
        );
        if (!hasDeptItem) return false;
      }
      return true;
    })
    .map((o: any) => {
      // If a specific department is selected, filter items to that department
      if (
        selectedDepartment !== "all" &&
        !selectedDepartment.includes("All Departments") &&
        !selectedDepartment.includes("Main Kitchen")
      ) {
        const filteredItems = (o.items || []).filter((i: any) =>
          matchDepartment(i, selectedDepartment, departmentsQuery.data || [])
        );
        return { ...o, items: filteredItems };
      }
      return o;
    });

  // Regroup filtered orders by customer
  const groupedOrders = filteredActiveOrders.reduce<Record<string, typeof filteredActiveOrders>>(
    (acc, order) => {
      const key = order.customerName ?? `#${order.id}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(order);
      return acc;
    },
    {}
  );

  return (
    <StaffAuthGuard allowedRoles={["admin", "cashier", "kitchen"]}>
      <div className="min-h-screen bg-stone-50 text-stone-900">
        {/* Top Navigation Header */}
        <header className="bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-xs gap-3 sticky top-0 z-30 w-full">
          {/* Left: Brand + Context */}
          <div className="flex items-center gap-3 shrink-0 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-black text-stone-900 leading-none truncate">
                  {t.hotelName || "Smart Quetta Hotel"}
                </h1>
                {vm.activeOrders.length > 0 && (
                  <span className="bg-amber-500 text-stone-950 text-[10px] font-black rounded-full px-2 py-0.5">
                    {vm.activeOrders.length}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-amber-600 font-extrabold uppercase tracking-widest mt-0.5 truncate">
                Kitchen Live Display System (KDS)
              </p>
            </div>
          </div>

          {/* Center: Counter Station Tabs Pill */}
          <div className="flex-1 flex justify-center items-center px-2 min-w-0">
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/60 overflow-x-auto no-scrollbar max-w-full">
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setSelectedCounter("all");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  selectedCounter === "all"
                    ? "bg-amber-500 text-stone-950 shadow-xs font-black"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                }`}
              >
                <span>All Stations</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  selectedCounter === "all" ? "bg-stone-950 text-amber-400" : "bg-stone-200 text-stone-700"
                }`}>
                  {vm.activeOrders.length}
                </span>
              </button>

              {availableCounters.map((cnt) => {
                const count = (vm.activeOrders || []).filter(
                  (o: any) => (o.counterName || "Main Cashier Counter") === cnt
                ).length;
                return (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setSelectedCounter(cnt);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      selectedCounter === cnt
                        ? "bg-amber-500 text-stone-950 shadow-xs font-black"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>{cnt}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      selectedCounter === cnt ? "bg-stone-950 text-amber-400" : "bg-stone-200 text-stone-700"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Desktop Tools */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick Staff View Links */}
            <StaffWorkspaceSwitcher current="kitchen" />

            {staff && (
              <div className="hidden md:flex items-center gap-2 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-stone-800">{staff.name}</span>
                <span className="text-[10px] font-extrabold text-amber-800 uppercase bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                  Kitchen KDS
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
        <main className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-4 pb-20">
          {/* Dynamic Kitchen Department Header / Tabs */}
          <div className="bg-white p-2.5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                <span>Kitchen Department (شعبہ کچن)</span>
              </span>
              {isStaffRestricted && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>🔒 Strictly Locked Station</span>
                </span>
              )}
            </div>

            {isStaffRestricted ? (
              <div className="flex items-center justify-between p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-2xs">
                    <ChefHat className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <span>{assignedDept} Section</span>
                      <span className="text-[11px] text-amber-800 font-bold">{getDeptUrdu(assignedDept || "")}</span>
                    </div>
                    <p className="text-[10px] text-amber-800/80 font-semibold">
                      You are strictly assigned to prepare only items from this department.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-500 text-stone-950 font-black px-3 py-1 rounded-xl text-xs shadow-2xs">
                  <span>{filteredActiveOrders.length}</span>
                  <span className="text-[10px] uppercase">Orders</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setSelectedDepartment("all");
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    selectedDepartment === "all" ||
                    selectedDepartment.includes("All Departments") ||
                    selectedDepartment.includes("Main Kitchen")
                      ? "bg-stone-900 text-white shadow-2xs"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All Departments (مکمل کچن)</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedDepartment === "all" || selectedDepartment.includes("All Departments")
                        ? "bg-stone-700 text-white"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {vm.activeOrders.length}
                  </span>
                </button>

                {(departmentsQuery.data || []).map((dept) => {
                  const deptCount = (vm.activeOrders || []).filter((o: any) =>
                    o.items?.some(
                      (i: any) =>
                        i.kitchenStatus !== "served" &&
                        matchDepartment(i, dept.name, departmentsQuery.data || [])
                    )
                  ).length;
                  const isSelected = selectedDepartment.toLowerCase() === dept.name.toLowerCase();

                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setSelectedDepartment(dept.name);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-amber-500 text-stone-950 font-black shadow-2xs"
                          : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                      }`}
                    >
                      <span>
                        {dept.name} Section {getDeptUrdu(dept.name)}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSelected
                            ? "bg-stone-950 text-amber-400"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {deptCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {vm.isLoading ? (
            <div className="text-center py-24 text-stone-400 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
              <p className="text-sm font-bold text-stone-600">Loading kitchen display…</p>
            </div>
          ) : filteredActiveOrders.length === 0 ? (
            <div className="text-center py-24 text-stone-400">
              <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-bold text-stone-600">{t.noOrders}</p>
              <div className="flex items-center justify-center gap-1.5 text-xs text-stone-400 mt-1">
                <Coffee className="w-3.5 h-3.5 text-stone-300" />
                <span>
                  {selectedDepartment !== "all"
                    ? `No active cooking orders in ${selectedDepartment} section!`
                    : "All clear for this counter station!"}
                </span>
              </div>
            </div>
          ) : (
            Object.entries(groupedOrders).map(([customerName, customerOrders]) => (
              <div
                key={customerName}
                className="rounded-2xl border border-stone-200/80 bg-white overflow-hidden shadow-xs"
              >
                {/* Customer header */}
                <div className="bg-amber-50/60 border-b border-amber-100/80 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-800 uppercase tracking-wide">
                      Customer
                    </span>
                    <span className="font-bold text-sm text-stone-900">{customerName}</span>
                  </div>

                  {customerOrders[0]?.counterName && (
                    <span className="bg-white text-stone-800 border border-stone-200 text-[11px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                      <Store className="w-3 h-3 text-amber-600" />
                      <span>{customerOrders[0].counterName}</span>
                    </span>
                  )}
                </div>

                {customerOrders.map((order: any) => {
                  const isExpanded =
                    vm.expandedOrders.has(order.id) || customerOrders.length === 1;
                  const activeItems =
                    order.items?.filter((i: any) => i.kitchenStatus !== "served") ?? [];
                  const allReady = activeItems.every((i: any) => i.kitchenStatus === "ready");

                  return (
                    <div key={order.id} className="border-b border-stone-100 last:border-0">
                      <button
                        type="button"
                        onClick={() => vm.toggleExpand(order.id)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-500">#{order.id}</span>
                          {(order.seatingNo || order.tableNo) && (
                            <span className="text-[11px] font-extrabold bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded-md">
                              {order.seatingNo
                                ? order.seatingType === "seat"
                                  ? `Seat ${order.seatingNo}`
                                  : `Table ${order.seatingNo}`
                                : order.tableNo}
                            </span>
                          )}
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                              order.status === "preparing"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : order.status === "ready"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {order.status === "preparing"
                              ? "Cooking"
                              : order.status === "ready"
                              ? "Ready"
                              : "Pending"}
                          </span>
                          <span className="text-xs text-stone-400">{fmtTime(order.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-stone-400">{activeItems.length} items</span>
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
                            const status = item.kitchenStatus ?? "pending";
                            const s = ITEM_STATUS[status] ?? ITEM_STATUS.pending;
                            const isFullyServed = status === "served";
                            const canAct = status === "pending" || status === "preparing";
                            const isItemLoading = vm.loadingItems.has(item.id);

                            return (
                              <div
                                key={item.id}
                                className={`flex items-center justify-between p-3 rounded-xl border ${
                                  isFullyServed
                                    ? "bg-stone-50/50 border-stone-100 opacity-60"
                                    : "bg-white border-stone-200/70 shadow-2xs"
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-stone-900">
                                      {item.name}
                                    </span>
                                    <span className="text-xs font-bold text-stone-500">
                                      ×{item.quantity}
                                    </span>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${s.bg} ${s.text}`}
                                    >
                                      {s.label}
                                    </span>
                                  </div>
                                </div>

                                {canAct && (
                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    {status === "pending" && (
                                      <button
                                        type="button"
                                        onClick={() => vm.handleItemAction(item.id, status)}
                                        disabled={isItemLoading}
                                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 transition text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
                                      >
                                        {isItemLoading ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          "Start Cook"
                                        )}
                                      </button>
                                    )}

                                    {status === "preparing" && (
                                      <button
                                        type="button"
                                        onClick={() => vm.handleItemAction(item.id, status)}
                                        disabled={isItemLoading}
                                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
                                      >
                                        {isItemLoading ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <>
                                            <Check className="w-3 h-3" /> Ready
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Quick Batch Action Button */}
                          {!allReady && activeItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => vm.handleMarkAllReady(activeItems)}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                            >
                              <Check className="w-4 h-4" />
                              <span>Mark All Items in #{order.id} Ready</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </main>
      </div>
    </StaffAuthGuard>
  );
}

export default KitchenView;
