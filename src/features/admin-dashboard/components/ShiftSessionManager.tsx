"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { playTapSound, playOrderSuccessSound } from "@/lib/sound";
import { fmtTime } from "@/lib/time";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Search,
  Eye,
  Trash2,
  Edit3,
  Receipt,
  ShoppingBag,
  DollarSign,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Lock,
  Unlock,
  Layers,
  FileText,
  Printer,
} from "lucide-react";

export function ShiftSessionManager() {
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState<any | null>(null);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [searchVersion, setSearchVersion] = useState("");

  // TRPC Queries & Mutations
  const { data: sessionInfo, refetch: refetchSessionInfo, isLoading: loadingSession } =
    trpc.admin.getShiftSessionInfo.useQuery(undefined, { refetchInterval: 5000 });

  const { data: stagedOrders = [], refetch: refetchStaged } =
    trpc.admin.getStagedVerificationOrders.useQuery(undefined, {
      enabled: showVerifyModal || sessionInfo?.shiftStatus === "verifying",
      refetchInterval: 6000,
    });

  const { data: sessionLogs = [], refetch: refetchLogs } =
    trpc.admin.getSessionLogs.useQuery();

  const stageWindupMutation = trpc.admin.stageShiftWindup.useMutation();
  const revertWindupMutation = trpc.admin.revertShiftWindup.useMutation();
  const updateOrderMutation = trpc.admin.updateStagedOrder.useMutation();
  const deleteOrderMutation = trpc.admin.deleteStagedOrder.useMutation();
  const finalizeCloseMutation = trpc.admin.finalizeDayClose.useMutation();

  const handleStageWindup = async () => {
    playTapSound();
    try {
      await stageWindupMutation.mutateAsync();
      toast.info("Shift entered verification mode. Review tickets before final close.");
      await refetchSessionInfo();
      await refetchStaged();
      setShowVerifyModal(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to enter verification mode");
    }
  };

  const handleRevertWindup = async () => {
    playTapSound();
    try {
      await revertWindupMutation.mutateAsync();
      toast.success("Reverted back to active live billing.");
      await refetchSessionInfo();
      setShowVerifyModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to revert verification mode");
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to permanently delete this staged order?")) return;
    playTapSound();
    try {
      await deleteOrderMutation.mutateAsync({ orderId });
      toast.success("Order removed from staged audit.");
      await refetchStaged();
      await refetchSessionInfo();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete order");
    }
  };

  const handleSaveEditOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    playTapSound();
    try {
      await updateOrderMutation.mutateAsync({
        orderId: editingOrder.id,
        customerName: editingOrder.customerName,
        discount: Number(editingOrder.discount) || 0,
        total: Number(editingOrder.total) || 0,
        paidAmount: Number(editingOrder.paidAmount) || 0,
        remarks: editingOrder.remarks,
      });
      toast.success("Ticket details updated.");
      setEditingOrder(null);
      await refetchStaged();
      await refetchSessionInfo();
    } catch (err: any) {
      toast.error(err.message || "Failed to update order");
    }
  };

  const handleFinalizeDayClose = async () => {
    if (!confirm(`Are you ready to final close Day Session (Version #${sessionInfo?.ticketVersion})? This will archive all records and reset live tickets to #1.`)) {
      return;
    }
    playTapSound();
    try {
      const res = await finalizeCloseMutation.mutateAsync();
      playOrderSuccessSound();
      toast.success(`Day Session Version #${res.closedVersion} closed & archived! Live tickets reset for Version #${res.nextVersion}.`);
      setShowVerifyModal(false);
      await refetchSessionInfo();
      await refetchLogs();
    } catch (err: any) {
      toast.error(err.message || "Failed to finalize day close");
    }
  };

  // Filter logs by search
  const filteredLogs = sessionLogs.filter((log) => {
    if (!searchVersion) return true;
    const q = searchVersion.toLowerCase();
    return (
      log.ticketVersion.toString().includes(q) ||
      log.closedBy.toLowerCase().includes(q) ||
      log.closedDate.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* ── LIVE SHIFT SESSION STATUS CARD ──────────────────────────── */}
      <div className="bg-white dark:bg-[#121824] rounded-[24px] p-4 sm:p-5 border-0 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D98A3C]/15 text-[#D98A3C] flex items-center justify-center font-black">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#24180A] dark:text-white">
                  Day Session: <span className="text-[#D98A3C]">Version #{sessionInfo?.ticketVersion ?? 1}</span>
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    sessionInfo?.shiftStatus === "verifying"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {sessionInfo?.shiftStatus === "verifying" ? "In Audit Verification" : "Live Active"}
                </span>
              </div>
              <p className="text-xs font-semibold text-stone-500 dark:text-zinc-400">
                Live queue and new tickets start from #1 for Version #{sessionInfo?.ticketVersion ?? 1}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live Item Sales Report Button */}
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setShowDetailsModal({
                  ticketVersion: sessionInfo?.ticketVersion ?? 1,
                  isLive: true,
                  shiftStatus: sessionInfo?.shiftStatus ?? "active",
                  closedBy: "Live Shift",
                  closedDate: new Date().toISOString(),
                  totalRevenue: sessionInfo?.todayRevenue ?? 0,
                  totalCash: sessionInfo?.todayCash ?? 0,
                  totalBank: sessionInfo?.todayBank ?? 0,
                  totalKhata: sessionInfo?.todayUnpaid ?? 0,
                  totalTickets: sessionInfo?.todayTicketsCount ?? 0,
                  totalDiscount: sessionInfo?.todayDiscount ?? 0,
                });
              }}
              className="px-4 py-2.5 rounded-full bg-[#F8F3EC] dark:bg-[#1A2232] hover:bg-[#EFE7DC] dark:hover:bg-[#253046] text-[#24180A] dark:text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border-0 shadow-none"
            >
              <FileText className="w-3.5 h-3.5 text-[#D98A3C]" />
              <span>Live Item Sales Report</span>
            </button>

            {sessionInfo?.shiftStatus === "verifying" ? (
              <>
                <button
                  type="button"
                  onClick={handleRevertWindup}
                  disabled={revertWindupMutation.isPending}
                  className="px-4 py-2.5 rounded-full bg-stone-100 dark:bg-[#1A2232] text-stone-700 dark:text-zinc-300 font-bold text-xs hover:bg-stone-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Revert to Live</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(true)}
                  className="px-5 py-2.5 rounded-full bg-[#D98A3C] hover:bg-[#C27930] text-white font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-none active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Review Audit & Close Day</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStageWindup}
                disabled={stageWindupMutation.isPending}
                className="px-5 py-2.5 rounded-full bg-[#D98A3C] hover:bg-[#C27930] text-white font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-none active:scale-95"
              >
                {stageWindupMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>Wind-up Day / Stage for Verification</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-4">
          <div className="bg-[#F8F3EC] dark:bg-[#1A2232] p-3 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-zinc-400 block">
              Today Tickets
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-[#24180A] dark:text-white">
              {sessionInfo?.todayTicketsCount ?? 0}
            </span>
          </div>

          <div className="bg-[#F8F3EC] dark:bg-[#1A2232] p-3 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-zinc-400 block">
              Gross Revenue
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-[#D98A3C]">
              Rs. {(sessionInfo?.todayRevenue ?? 0).toLocaleString()}
            </span>
          </div>

          <div className="bg-[#F8F3EC] dark:bg-[#1A2232] p-3 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-zinc-400 block">
              Cash Drawer
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
              Rs. {(sessionInfo?.todayCash ?? 0).toLocaleString()}
            </span>
          </div>

          <div className="bg-[#F8F3EC] dark:bg-[#1A2232] p-3 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-zinc-400 block">
              Online / QR Bank
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-blue-600 dark:text-blue-400">
              Rs. {(sessionInfo?.todayBank ?? 0).toLocaleString()}
            </span>
          </div>

          <div className="bg-[#F8F3EC] dark:bg-[#1A2232] p-3 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-zinc-400 block">
              Market Khata Due
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-orange-600 dark:text-orange-400">
              Rs. {(sessionInfo?.todayUnpaid ?? 0).toLocaleString()}
            </span>
          </div>

          <div className="bg-[#F8F3EC] dark:bg-[#1A2232] p-3 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-zinc-400 block">
              Total Discounts
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-purple-600 dark:text-purple-400">
              Rs. {(sessionInfo?.todayDiscount ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ── HISTORICAL ARCHIVES & SEARCH TABLE ───────────────────────── */}
      <div className="bg-white dark:bg-[#121824] rounded-[24px] p-4 sm:p-5 border-0 shadow-none space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-black text-[#24180A] dark:text-white">
              Shift & Day Close Archive Logs
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Historical ledger for past closed sessions (Version #1 to #365)
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchVersion}
              onChange={(e) => setSearchVersion(e.target.value)}
              placeholder="Search Version # or Date..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-full text-xs font-semibold text-[#24180A] dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D98A3C] border-0"
            />
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-100 dark:border-white/5 text-[11px] font-black uppercase text-stone-400">
                <th className="py-2.5 px-3">Session</th>
                <th className="py-2.5 px-3">Date Closed</th>
                <th className="py-2.5 px-3">Closed By</th>
                <th className="py-2.5 px-3">Tickets</th>
                <th className="py-2.5 px-3">Gross Sales</th>
                <th className="py-2.5 px-3">Cash</th>
                <th className="py-2.5 px-3">Bank / QR</th>
                <th className="py-2.5 px-3">Khata</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-white/5">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-stone-400 font-semibold">
                    No closed session logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/60 dark:hover:bg-[#1A2232]/50 transition">
                    <td className="py-3 px-3 font-black text-[#D98A3C]">
                      Version #{log.ticketVersion}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#24180A] dark:text-white">
                      {fmtTime(log.closedDate)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-stone-600 dark:text-zinc-300">
                      {log.closedBy}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      {log.totalTickets}
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-[#D98A3C]">
                      Rs. {log.totalRevenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      Rs. {log.totalCash.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      Rs. {log.totalBank.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-orange-600 dark:text-orange-400">
                      Rs. {log.totalKhata.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setShowDetailsModal(log);
                        }}
                        className="px-3 py-1 rounded-full bg-[#F8F3EC] dark:bg-[#1A2232] hover:bg-[#D98A3C] hover:text-white font-bold text-[11px] transition cursor-pointer"
                      >
                        View Z-Report
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: VERIFICATION & AUDIT STAGING DIALOG ────────────── */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121824] rounded-[28px] p-5 sm:p-6 max-w-4xl w-full border-0 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-white/5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D98A3C]/15 text-[#D98A3C] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#24180A] dark:text-white">
                    Audit Verification — Version #{sessionInfo?.ticketVersion}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-zinc-400">
                    Review, correct, or delete tickets before final Day Close
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Staged Orders List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 no-scrollbar min-h-0">
              {stagedOrders.length === 0 ? (
                <div className="text-center py-12 text-stone-400 font-semibold">
                  No orders found in current session.
                </div>
              ) : (
                stagedOrders.map((ord: any) => (
                  <div
                    key={ord.id}
                    className="bg-[#F8F3EC] dark:bg-[#1A2232] rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-[#24180A] dark:text-white flex items-center gap-1">
                          <Receipt className="w-3.5 h-3.5 text-[#D98A3C]" />
                          <span>{ord.orderNo || `TKT-${ord.id}`}</span>
                        </span>
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-white dark:bg-[#121824] text-stone-700 dark:text-zinc-300">
                          {ord.customerName || "Walk-in"}
                        </span>
                        <span className="text-[10px] text-stone-400">({fmtTime(ord.createdAt)})</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                            ord.paymentStatus === "paid"
                              ? "bg-emerald-500/15 text-emerald-600"
                              : "bg-amber-500/15 text-amber-600"
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">
                        {ord.items?.map((it: any) => `${it.nameSnapshot || "Item"} ×${it.quantity}`).join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right font-mono">
                        <span className="text-sm font-black text-[#D98A3C]">
                          Rs. {ord.total}
                        </span>
                        {ord.discount > 0 && (
                          <span className="text-[10px] text-stone-400 block line-through">
                            Rs. {ord.subtotal}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingOrder(ord)}
                          className="p-1.5 rounded-lg bg-white dark:bg-[#121824] text-stone-600 dark:text-zinc-300 hover:text-[#D98A3C] transition cursor-pointer"
                          title="Edit ticket"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(ord.id)}
                          className="p-1.5 rounded-lg bg-white dark:bg-[#121824] text-red-500 hover:bg-red-500 hover:text-white transition cursor-pointer"
                          title="Delete ticket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary & Final Close Button */}
            <div className="pt-3 border-t border-stone-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="text-xs font-semibold text-stone-600 dark:text-zinc-300">
                <span>Verified: </span>
                <strong className="text-[#24180A] dark:text-white">{stagedOrders.length} tickets</strong>
                <span> • Grand Total: </span>
                <strong className="text-[#D98A3C] font-mono font-black text-sm">
                  Rs. {(sessionInfo?.todayRevenue ?? 0).toLocaleString()}
                </strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRevertWindup}
                  className="px-4 py-2.5 rounded-full text-xs font-bold text-stone-500 hover:bg-stone-100 dark:hover:bg-[#1A2232] cursor-pointer"
                >
                  Cancel / Revert
                </button>
                <button
                  type="button"
                  onClick={handleFinalizeDayClose}
                  disabled={finalizeCloseMutation.isPending}
                  className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  {finalizeCloseMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Confirm & Final Close Day</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: EDIT STAGED ORDER DIALOG ───────────────────────── */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121824] rounded-[24px] p-5 max-w-md w-full border-0 shadow-2xl space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100 dark:border-white/5">
              <h4 className="text-sm font-black text-[#24180A] dark:text-white">
                Edit Ticket {editingOrder.orderNo || `TKT-${editingOrder.id}`}
              </h4>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditOrder} className="space-y-2.5 text-xs">
              <div>
                <label className="font-bold text-stone-600 dark:text-zinc-300 block mb-1">
                  Customer / Table Name
                </label>
                <input
                  type="text"
                  value={editingOrder.customerName || ""}
                  onChange={(e) => setEditingOrder({ ...editingOrder, customerName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-xl font-semibold border-0 focus:ring-2 focus:ring-[#D98A3C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-600 dark:text-zinc-300 block mb-1">
                    Total Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    value={editingOrder.total || 0}
                    onChange={(e) => setEditingOrder({ ...editingOrder, total: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-xl font-semibold border-0 focus:ring-2 focus:ring-[#D98A3C]"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-600 dark:text-zinc-300 block mb-1">
                    Paid Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    value={editingOrder.paidAmount || 0}
                    onChange={(e) => setEditingOrder({ ...editingOrder, paidAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-xl font-semibold border-0 focus:ring-2 focus:ring-[#D98A3C]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-600 dark:text-zinc-300 block mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={editingOrder.remarks || ""}
                  onChange={(e) => setEditingOrder({ ...editingOrder, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-xl font-semibold border-0 focus:ring-2 focus:ring-[#D98A3C]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="flex-1 py-2 rounded-full font-bold text-stone-500 hover:bg-[#F8F3EC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateOrderMutation.isPending}
                  className="flex-1 py-2 bg-[#D98A3C] hover:bg-[#C27930] text-white rounded-full font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: HISTORICAL SESSION Z-REPORT & COMPREHENSIVE ITEM SALES REPORT ────────────── */}
      {showDetailsModal && (
        <SessionDetailsModal
          session={showDetailsModal}
          onClose={() => setShowDetailsModal(null)}
        />
      )}
    </div>
  );
}

// ── COMPREHENSIVE Z-REPORT & ITEM SALES REPORT MODAL ─────────────────────────
function SessionDetailsModal({
  session,
  onClose,
}: {
  session: any;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"items" | "orders">("items");
  const [filterType, setFilterType] = useState<"all" | "sold" | "unsold">("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | "served" | "cancelled" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: itemReport, isLoading: loadingReport } =
    trpc.admin.getSessionItemSalesReport.useQuery(
      { ticketVersion: session.ticketVersion },
      { refetchInterval: session.isLive ? 5000 : false }
    );

  const rawOrdersSnapshot = React.useMemo(() => {
    try {
      if (session.ordersSnapshot) {
        return JSON.parse(session.ordersSnapshot);
      }
    } catch {}
    return [];
  }, [session.ordersSnapshot]);

  // Combined orders list: prefer detailed ordersAudit from server, fallback to rawOrdersSnapshot
  const ordersList = React.useMemo(() => {
    if (itemReport?.ordersAudit && itemReport.ordersAudit.length > 0) {
      return itemReport.ordersAudit;
    }
    return rawOrdersSnapshot.map((ord: any) => ({
      ...ord,
      itemsSummary: ord.items?.map((it: any) => `${it.nameSnapshot || it.name || "Item"} ×${it.quantity}`).join(", ") || "",
    }));
  }, [itemReport?.ordersAudit, rawOrdersSnapshot]);

  // Filter Items
  const filteredItems = React.useMemo(() => {
    if (!itemReport?.items) return [];
    return itemReport.items.filter((item) => {
      // Filter by sold / unsold
      if (filterType === "sold" && !item.isSold) return false;
      if (filterType === "unsold" && item.isSold) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.departmentName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [itemReport?.items, filterType, searchQuery]);

  // Filter Orders
  const filteredOrders = React.useMemo(() => {
    return ordersList.filter((ord: any) => {
      const status = (ord.orderStatus || ord.status || "").toLowerCase();
      if (orderStatusFilter === "served" && status !== "completed" && status !== "served") return false;
      if (orderStatusFilter === "cancelled" && status !== "cancelled" && status !== "voided") return false;
      if (orderStatusFilter === "pending" && (status === "completed" || status === "served" || status === "cancelled" || status === "voided")) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const orderNo = (ord.orderNo || `TKT-${ord.id}`).toLowerCase();
        const cust = (ord.customerName || "").toLowerCase();
        const itemsStr = (ord.itemsSummary || "").toLowerCase();
        return orderNo.includes(q) || cust.includes(q) || itemsStr.includes(q);
      }
      return true;
    });
  }, [ordersList, orderStatusFilter, searchQuery]);

  const handlePrint = () => {
    playTapSound();
    window.print();
  };

  const totalRevenue = itemReport?.totalRevenue ?? session.totalRevenue ?? 0;
  const totalUnits = itemReport?.totalQuantitySold ?? 0;
  const soldCount = itemReport?.soldCount ?? 0;
  const unsoldCount = itemReport?.unsoldCount ?? 0;
  const totalMenu = itemReport?.totalMenuItems ?? 0;

  const totalOrdersCount = itemReport?.totalOrdersCount ?? ordersList.length;
  const servedOrdersCount = itemReport?.servedOrdersCount ?? ordersList.filter((o: any) => ["completed", "served"].includes((o.orderStatus || o.status || "").toLowerCase())).length;
  const cancelledOrdersCount = itemReport?.cancelledOrdersCount ?? ordersList.filter((o: any) => ["cancelled", "voided"].includes((o.orderStatus || o.status || "").toLowerCase())).length;
  const pendingOrdersCount = itemReport?.pendingOrdersCount ?? (totalOrdersCount - servedOrdersCount - cancelledOrdersCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white dark:bg-[#121824] rounded-[28px] p-4 sm:p-6 max-w-4xl w-full border-0 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden print:max-h-none print:shadow-none print:rounded-none print:w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-white/5 shrink-0 print:pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D98A3C]/15 text-[#D98A3C] flex items-center justify-center font-black shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-[#24180A] dark:text-white">
                  Z-Report & Sales Report — Version #{session.ticketVersion}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    session.isLive
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 animate-pulse"
                      : "bg-[#D98A3C]/15 text-[#D98A3C]"
                  }`}
                >
                  {session.isLive ? "Live Shift (لائیو سیشن)" : "Closed Archive (بند شدہ سیشن)"}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-zinc-400 font-medium">
                {session.isLive
                  ? `Active real-time shift performance`
                  : `Closed on ${fmtTime(session.closedDate)} by ${session.closedBy}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-full bg-[#F8F3EC] dark:bg-[#1A2232] hover:bg-[#EFE7DC] text-[#24180A] dark:text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border-0"
              title="Print Z-Report"
            >
              <Printer className="w-3.5 h-3.5 text-[#D98A3C]" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 shrink-0">
          <div className="bg-[#F8F3EC] dark:bg-[#1A2232] p-3 rounded-2xl">
            <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">
              Gross Revenue (کل سیلز)
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-[#D98A3C]">
              Rs. {totalRevenue.toLocaleString()}
            </span>
          </div>
          <div className="bg-[#F8F3EC] dark:bg-[#1A2232] p-3 rounded-2xl">
            <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">
              Cash in Drawer (کیش)
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
              Rs. {(session.totalCash ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="bg-[#F8F3EC] dark:bg-[#1A2232] p-3 rounded-2xl">
            <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">
              Online / QR (بینک)
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-blue-600 dark:text-blue-400">
              Rs. {(session.totalBank ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="bg-[#F8F3EC] dark:bg-[#1A2232] p-3 rounded-2xl">
            <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">
              Market Khata (ادھار)
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-orange-600 dark:text-orange-400">
              Rs. {(session.totalKhata ?? 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Order Lifecycle Status Banner */}
        <div className="grid grid-cols-4 gap-2 pb-3 shrink-0 text-center">
          <div className="bg-[#F8F3EC]/70 dark:bg-[#1A2232]/70 p-2 rounded-xl">
            <span className="text-[10px] text-stone-400 font-bold block uppercase">Total Orders (کل)</span>
            <span className="text-sm font-black font-mono text-[#24180A] dark:text-white">{totalOrdersCount}</span>
          </div>
          <div className="bg-emerald-500/10 dark:bg-emerald-950/40 p-2 rounded-xl">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block uppercase">Served / Paid (سرو شدہ)</span>
            <span className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-300">{servedOrdersCount}</span>
          </div>
          <div className="bg-rose-500/10 dark:bg-rose-950/40 p-2 rounded-xl">
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block uppercase">Cancelled (منسوخ)</span>
            <span className="text-sm font-black font-mono text-rose-700 dark:text-rose-300">{cancelledOrdersCount}</span>
          </div>
          <div className="bg-amber-500/10 dark:bg-amber-950/40 p-2 rounded-xl">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block uppercase">Pending (جاری)</span>
            <span className="text-sm font-black font-mono text-amber-700 dark:text-amber-300">{pendingOrdersCount > 0 ? pendingOrdersCount : 0}</span>
          </div>
        </div>

        {/* Navigation Tabs (Items Performance vs Individual Orders) */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100 dark:border-white/5 shrink-0 print:hidden">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setActiveTab("items");
                setSearchQuery("");
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition cursor-pointer border-0 ${
                activeTab === "items"
                  ? "bg-[#D98A3C] text-white shadow-xs"
                  : "bg-[#F8F3EC] dark:bg-[#1A2232] text-stone-600 dark:text-zinc-300 hover:bg-[#EFE7DC]"
              }`}
            >
              Item Sales Breakdown (آئٹم وائز رپورٹ)
            </button>
            {ordersList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setActiveTab("orders");
                  setSearchQuery("");
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition cursor-pointer border-0 ${
                  activeTab === "orders"
                    ? "bg-[#D98A3C] text-white shadow-xs"
                    : "bg-[#F8F3EC] dark:bg-[#1A2232] text-stone-600 dark:text-zinc-300 hover:bg-[#EFE7DC]"
                }`}
              >
                Orders Audit ({ordersList.length} Tickets)
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Full Item-by-Item Sales & Unsold Performance */}
        {activeTab === "items" && (
          <div className="flex-1 flex flex-col min-h-0 pt-2 space-y-3">
            {/* Filter Bar & KPI Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setFilterType("all");
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer border-0 ${
                    filterType === "all"
                      ? "bg-[#24180A] dark:bg-white text-white dark:text-[#24180A]"
                      : "bg-[#F8F3EC] dark:bg-[#1A2232] text-stone-500"
                  }`}
                >
                  All Items ({totalMenu})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setFilterType("sold");
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer border-0 flex items-center gap-1 ${
                    filterType === "sold"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Sold / Served ({soldCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setFilterType("unsold");
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer border-0 flex items-center gap-1 ${
                    filterType === "unsold"
                      ? "bg-stone-700 text-white"
                      : "bg-stone-200 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400"
                  }`}
                >
                  <X className="w-3 h-3 stroke-[3]" />
                  <span>Unsold Items ({unsoldCount})</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-56 print:hidden">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search item or category..."
                  className="w-full pl-8 pr-3 py-1 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-full text-xs font-semibold text-[#24180A] dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D98A3C] border-0"
                />
              </div>
            </div>

            {/* Performance Summary Banner */}
            <div className="bg-[#F8F3EC] dark:bg-[#1A2232] p-2.5 rounded-2xl flex items-center justify-between text-xs font-bold text-stone-600 dark:text-zinc-300 shrink-0">
              <div className="flex items-center gap-3">
                <span>
                  Total Units Served / Sold: <strong className="text-[#D98A3C] font-mono text-sm">{totalUnits}</strong>
                </span>
                <span>•</span>
                <span>
                  Active Varieties: <strong className="text-[#24180A] dark:text-white">{soldCount} / {totalMenu}</strong>
                </span>
              </div>
              <span className="text-[11px] text-stone-400 font-medium">
                {filterType === "unsold" ? "Showing items with 0 sales" : "Sorted by highest quantity sold"}
              </span>
            </div>

            {/* Items Table */}
            <div className="flex-1 overflow-y-auto no-scrollbar rounded-2xl border border-stone-100 dark:border-white/5 min-h-0">
              {loadingReport ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-400">
                  <Loader2 className="w-5 h-5 animate-spin text-[#D98A3C]" />
                  <span className="text-xs font-semibold">Generating comprehensive item report...</span>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-xs font-semibold">
                  No items match the selected filter.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-[#F8F3EC] dark:bg-[#1A2232] text-[10px] font-black uppercase text-stone-400 z-10">
                    <tr>
                      <th className="py-2 px-3 w-8">#</th>
                      <th className="py-2 px-3">Item Name & Category</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-2.5 text-center">Ordered (کل)</th>
                      <th className="py-2 px-2.5 text-center">Served / Sold (سرو)</th>
                      <th className="py-2 px-2.5 text-center">Cancelled (منسوخ)</th>
                      <th className="py-2 px-3 text-right">Total Revenue</th>
                      <th className="py-2 px-3 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                    {filteredItems.map((item, idx) => {
                      const sharePercent = totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : "0";
                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-stone-50 dark:hover:bg-[#1A2232]/50 transition ${
                            !item.isSold ? "opacity-60 bg-stone-50/30 dark:bg-[#1A2232]/20" : ""
                          }`}
                        >
                          <td className="py-2 px-3 text-stone-400 font-mono text-[11px] font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-black text-[#24180A] dark:text-white">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-stone-400 font-medium">
                              {item.departmentName}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-stone-600 dark:text-zinc-300">
                            Rs. {item.unitPrice}
                          </td>
                          <td className="py-2 px-2.5 text-center font-mono font-bold text-stone-500">
                            {item.quantityOrdered ?? item.quantitySold}
                          </td>
                          <td className="py-2 px-2.5 text-center font-mono">
                            {item.isSold ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                ×{item.quantitySold}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 dark:bg-zinc-800 text-stone-400">
                                0 Sold
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 text-center font-mono">
                            {(item.quantityCancelled ?? 0) > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                                ×{item.quantityCancelled}
                              </span>
                            ) : (
                              <span className="text-stone-300 dark:text-zinc-600">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-sm text-[#D98A3C]">
                            Rs. {item.revenue.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-[11px] font-bold text-stone-500">
                            {sharePercent}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Orders Snapshot List */}
        {activeTab === "orders" && (
          <div className="flex-1 flex flex-col min-h-0 pt-2 space-y-2.5">
            {/* Orders Filter & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setOrderStatusFilter("all");
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer border-0 ${
                    orderStatusFilter === "all"
                      ? "bg-[#24180A] dark:bg-white text-white dark:text-[#24180A]"
                      : "bg-[#F8F3EC] dark:bg-[#1A2232] text-stone-500"
                  }`}
                >
                  All ({ordersList.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setOrderStatusFilter("served");
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer border-0 ${
                    orderStatusFilter === "served"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  Served / Completed ({servedOrdersCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setOrderStatusFilter("cancelled");
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer border-0 ${
                    orderStatusFilter === "cancelled"
                      ? "bg-rose-600 text-white"
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                  }`}
                >
                  Cancelled ({cancelledOrdersCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setOrderStatusFilter("pending");
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer border-0 ${
                    orderStatusFilter === "pending"
                      ? "bg-amber-600 text-white"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  }`}
                >
                  Active / Pending ({pendingOrdersCount > 0 ? pendingOrdersCount : 0})
                </button>
              </div>

              {/* Order Search */}
              <div className="relative w-full sm:w-56 print:hidden">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ticket # or items..."
                  className="w-full pl-8 pr-3 py-1 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-full text-xs font-semibold text-[#24180A] dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D98A3C] border-0"
                />
              </div>
            </div>

            {/* Orders List */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 min-h-0">
              {filteredOrders.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-xs font-semibold">
                  No orders match this status.
                </div>
              ) : (
                filteredOrders.map((ord: any) => {
                  const isCancelled = ["cancelled", "voided"].includes((ord.orderStatus || ord.status || "").toLowerCase());
                  const isServed = ["completed", "served"].includes((ord.orderStatus || ord.status || "").toLowerCase());
                  const isPaid = (ord.paymentStatus || "").toLowerCase() === "paid";

                  return (
                    <div
                      key={ord.id}
                      className={`bg-[#F8F3EC] dark:bg-[#1A2232] rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition ${
                        isCancelled ? "opacity-60 bg-rose-50/40 dark:bg-rose-950/20" : ""
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-[#24180A] dark:text-white">
                            {ord.orderNo || `TKT-${ord.id}`}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-[#121824] text-stone-700 dark:text-zinc-300">
                            {ord.customerName || "Walk-in"}
                          </span>
                          {ord.tableName && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D98A3C]/10 text-[#D98A3C]">
                              {ord.tableName}
                            </span>
                          )}
                          <span className="text-[10px] text-stone-400">({fmtTime(ord.createdAt)})</span>
                          
                          {/* Order Status Badge */}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              isCancelled
                                ? "bg-rose-500/15 text-rose-600"
                                : isServed
                                ? "bg-emerald-500/15 text-emerald-600"
                                : "bg-amber-500/15 text-amber-600"
                            }`}
                          >
                            {ord.orderStatus || ord.status || "Order"}
                          </span>

                          {/* Payment Status Badge */}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              isPaid
                                ? "bg-emerald-500/15 text-emerald-600"
                                : "bg-amber-500/15 text-amber-600"
                            }`}
                          >
                            {ord.paymentStatus || "unpaid"}
                          </span>
                        </div>

                        {/* Resolved Dishes & Quantities */}
                        <p className="text-[11px] text-stone-600 dark:text-zinc-300 font-medium truncate">
                          {ord.itemsSummary ||
                            ord.items?.map((it: any) => `${it.name || it.nameSnapshot || "Item"} ×${it.quantity}`).join(", ") ||
                            "No items"}
                        </p>
                      </div>

                      <div className={`text-right font-mono font-black text-sm shrink-0 ${
                        isCancelled ? "text-stone-400 line-through" : "text-[#D98A3C]"
                      }`}>
                        Rs. {(ord.total ?? 0).toLocaleString()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-stone-100 dark:border-white/5 flex items-center justify-between shrink-0 print:hidden">
          <div className="text-xs text-stone-500 dark:text-zinc-400 font-medium">
            Total Menu Items: <strong>{totalMenu}</strong> • Sold: <strong className="text-emerald-600 font-bold">{soldCount}</strong> • Unsold: <strong className="text-stone-400">{unsoldCount}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-[#D98A3C] hover:bg-[#C27930] text-white font-black text-xs transition cursor-pointer border-0 shadow-none active:scale-95"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}

