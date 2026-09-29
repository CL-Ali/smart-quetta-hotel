"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, ChefHat, Check, Coffee, ChevronDown, ChevronUp, Store, LogOut, Utensils, Layers, Lock } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LangContext";
import { useAuth } from "@/contexts/AuthContext";
import { StaffHeaderBar } from "@/components/StaffHeaderBar";
import { StaffBottomNav } from "@/components/StaffBottomNav";
import { StaffDrawerSheet } from "@/components/StaffDrawerSheet";
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
  const { t, lang } = useLang();
  const { staff, logout, permissions } = useAuth();
  const vm = useKitchenViewModel();
  const departmentsQuery = trpc.hotel.getDepartments.useQuery();

  const [selectedCounter, setSelectedCounter] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      return dn === lowerDept || String(d.id) === deptName;
    });
    if (dObj && item.departmentId === dObj.id) return true;
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
    <StaffAuthGuard requiredPermission="canKitchen" allowedRoles={["admin", "kitchen"]}>
      <div className="min-h-screen bg-[#F8F3EC] dark:bg-[#0B0F17] text-[#24180A] dark:text-[#F8FAFC] pb-20 md:pb-4">
        {/* Top Unified Navigation Header */}
        <StaffHeaderBar
          current="kitchen"
          title={t.hotelName || "Smart Hotel"}
          subtitle={`Kitchen KDS${staff?.stationName ? ` • ${staff.stationName}` : ""}`}
          icon={ChefHat}
          onOpenDrawer={() => setDrawerOpen(true)}
          centerContent={
            <div className="inline-flex items-center bg-[#F4EFEA] dark:bg-[#1A2234] p-1 rounded-full overflow-x-auto no-scrollbar max-w-full border-0 shadow-none relative">
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setSelectedCounter("all");
                }}
                className={`relative px-3.5 h-8 text-xs font-extrabold rounded-full inline-flex items-center gap-1.5 transition-colors duration-200 select-none cursor-pointer border-0 ${
                  selectedCounter === "all"
                    ? "text-white"
                    : "text-stone-600 dark:text-stone-400 hover:text-[#24180A] dark:hover:text-white"
                }`}
              >
                {selectedCounter === "all" && (
                  <motion.div
                    layoutId="kitchenCounterIndicator"
                    className="absolute inset-0 bg-[#D98A3C] rounded-full shadow-xs -z-0"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10">All Stations</span>
                <span className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedCounter === "all" ? "bg-white/25 text-white" : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
                }`}>
                  {vm.activeOrders.length}
                </span>
              </button>

              {availableCounters.map((cnt) => {
                const count = (vm.activeOrders || []).filter(
                  (o: any) => (o.counterName || "Main Cashier Counter") === cnt
                ).length;
                const isSelected = selectedCounter === cnt;
                return (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setSelectedCounter(cnt);
                    }}
                    className={`relative px-3.5 h-8 text-xs font-extrabold rounded-full inline-flex items-center gap-1.5 transition-colors duration-200 select-none cursor-pointer border-0 ${
                      isSelected
                        ? "text-white"
                        : "text-stone-600 dark:text-stone-400 hover:text-[#24180A] dark:hover:text-white"
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="kitchenCounterIndicator"
                        className="absolute inset-0 bg-[#D98A3C] rounded-full shadow-xs -z-0"
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      />
                    )}
                    <Store className="w-3.5 h-3.5 relative z-10" />
                    <span className="relative z-10">{cnt}</span>
                    <span className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? "bg-white/25 text-white" : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          }
        />

        {/* Main Content Workspace */}
        <main className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-4 pb-20">
          {/* Dynamic Kitchen Department Header / Tabs */}
          <div className="bg-white dark:bg-[#121824] p-3 rounded-[24px] border-0 shadow-none space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.kitchenDept || "Kitchen Department"}</span>
              </span>
              {isStaffRestricted && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-amber-800" />
                  <span>Strictly Locked Station</span>
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
                    <div className="text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <span>{assignedDept} Section</span>
                    </div>
                    <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 font-semibold">
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
                      ? "bg-stone-900 dark:bg-amber-600 text-white shadow-2xs"
                      : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{t.allDepartments || "All Departments"}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedDepartment === "all" || selectedDepartment.includes("All Departments")
                        ? "bg-stone-700 dark:bg-amber-700 text-white"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
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
                        {dept.name} Section
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
                className="rounded-[28px] bg-white dark:bg-[#121824] overflow-hidden border-0 shadow-none mb-3"
              >
                {/* Customer header */}
                <div className="bg-[#F8F3EC] dark:bg-[#1A2232] px-4 py-3 flex items-center justify-between border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#D98A3C] uppercase tracking-wide">
                      Customer
                    </span>
                    <span className="font-bold text-sm text-[#24180A] dark:text-white">{customerName}</span>
                  </div>

                  {customerOrders[0]?.counterName && (
                    <span className="bg-white dark:bg-[#121824] text-[#24180A] dark:text-zinc-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border-0">
                      <Store className="w-3 h-3 text-[#D98A3C]" />
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
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                              order.status === "preparing"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : order.status === "ready"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-black/5 dark:bg-white/5 text-[#4A3E31] dark:text-zinc-300"
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
                          <span className="text-xs text-stone-400 font-bold">{activeItems.length} items</span>
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
                                className={`flex items-center justify-between p-3 rounded-2xl border-0 ${
                                  isFullyServed
                                    ? "bg-[#F8F3EC]/30 dark:bg-[#1A2232]/30 opacity-60"
                                    : "bg-[#F8F3EC] dark:bg-[#1A2232]"
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-[#24180A] dark:text-white">
                                      {item.name}
                                    </span>
                                    <span className="text-xs font-bold text-[#D98A3C]">
                                      ×{item.quantity}
                                    </span>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                        status === "preparing"
                                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                          : status === "ready"
                                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                          : "bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-300"
                                      }`}
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
                                        className="px-3 py-1.5 bg-[#D98A3C] hover:bg-[#C27930] active:scale-95 transition text-white text-xs font-bold rounded-full cursor-pointer flex items-center gap-1 border-0"
                                      >
                                        {isItemLoading ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <ChefHat className="w-3 h-3" />
                                        )}
                                        <span>Start Cook</span>
                                      </button>
                                    )}

                                    {status === "preparing" && (
                                      <button
                                        type="button"
                                        onClick={() => vm.handleItemAction(item.id, status)}
                                        disabled={isItemLoading}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition text-white text-xs font-bold rounded-full cursor-pointer flex items-center gap-1 border-0"
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
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full border-0 transition cursor-pointer flex items-center justify-center gap-1.5 mt-2"
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

        {/* Mobile Bottom Navigation */}
        <StaffBottomNav
          current="kitchen"
          items={[
            { key: "all", label: lang === "ur" ? "تمام" : "All", icon: ChefHat },
            ...(departmentsQuery.data || []).map((d) => ({
              key: d.name,
              label: lang === "ur" ? (d.name.toLowerCase() === "tea" ? "چائے" : d.name.toLowerCase() === "paratha" ? "پراٹھا" : d.name.toLowerCase() === "kitchen" ? "کچن" : d.name.toLowerCase() === "drinks" ? "مشروبات" : d.name) : d.name,
              icon: Coffee,
            })),
          ]}
          activeItem={selectedDepartment}
          onSelectItem={(k) => setSelectedDepartment(k)}
          onOpenDrawer={() => setDrawerOpen(true)}
        />

        {/* Mobile Drawer Sheet */}
        <StaffDrawerSheet
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          current="kitchen"
        />
      </div>
    </StaffAuthGuard>
  );
}

export default KitchenView;
