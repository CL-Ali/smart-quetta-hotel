"use client";

import React, { useState } from "react";
import { Wallet, X, Banknote, Smartphone } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LangContext";
import { useIsMobile } from "@/hooks/useMobile";
import { OrderWithDetails } from "@/types/hotel";

type PayMethod = "cash" | "bank";
const BANK_PRESETS = ["JazzCash", "EasyPaisa", "HBL", "MCB", "UBL", "Meezan", "Sadapay"];

interface PaymentSheetProps {
  order: OrderWithDetails | any;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

export function PaymentSheet({ order, open, onClose, onDone }: PaymentSheetProps) {
  const { t } = useLang();
  const isMobile = useIsMobile();
  const recordPayment = trpc.hotel.recordPayment.useMutation();

  const total = order?.servedAmount ?? order?.totalAmount ?? 0;
  const paid = order?.paidAmount ?? 0;
  const remaining = Math.max(0, total - paid);

  const [method, setMethod] = useState<PayMethod>("cash");
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");

  const numAmount = parseFloat(amount) || 0;
  const isExact = numAmount === remaining;
  const isOver = numAmount > remaining;
  const bankNameMissing = method === "bank" && bankName.trim() === "";
  const canSubmit = numAmount > 0 && !isOver && !bankNameMissing && !recordPayment.isPending;

  const handleFillFull = () => setAmount(remaining.toFixed(0));

  const handleConfirm = async () => {
    if (!canSubmit) return;
    try {
      await recordPayment.mutateAsync({
        orderId: order.id,
        amount: numAmount,
        method,
        bankName: method === "bank" ? bankName.trim() : undefined,
      });
      toast.success(isExact ? "Order fully paid" : `Rs. ${numAmount.toFixed(0)} saved`);
      onDone();
      onClose();
    } catch {
      toast.error("Failed to save payment");
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setAmount("");
      setMethod("cash");
      setBankName("");
      onClose();
    }
  };

  const pastPayments: any[] = order?.paymentHistory ?? [];

  const content = (
    <div className="space-y-4 px-4 pb-8 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-bold">
            {t.payment} — #{order?.id}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => handleOpenChange(false)}
          className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-gray-50 rounded-2xl p-4 space-y-1.5 border border-gray-100">
        <p className="font-bold text-sm text-gray-900">{order?.customerName}</p>
        {order?.items?.map((item: any) => (
          <div key={item.id} className="flex justify-between text-xs text-gray-500">
            <span>
              {item.name} ×{item.quantity}
            </span>
            <span>Rs. {(item.unitPrice * item.quantity).toFixed(0)}</span>
          </div>
        ))}
        <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900 text-sm">
          <span>{t.grandTotal}</span>
          <span>Rs. {total.toFixed(0)}</span>
        </div>
        <div className="flex justify-between font-black text-orange-600 text-base">
          <span>{t.remaining}</span>
          <span>Rs. {remaining.toFixed(0)}</span>
        </div>
      </div>

      {pastPayments.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Past Payments
          </p>
          {pastPayments.map((p, i) => (
            <div
              key={i}
              className="flex justify-between items-center text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-100"
            >
              <span>{p.method === "bank" ? `Bank (${p.reference})` : "Cash"}</span>
              <span className="font-bold">Rs. {(p.amount ?? 0).toFixed(0)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMethod("cash")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition cursor-pointer ${
            method === "cash"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
              : "border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Banknote className="w-4 h-4" /> {t.cash}
        </button>
        <button
          type="button"
          onClick={() => setMethod("bank")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition cursor-pointer ${
            method === "bank"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Smartphone className="w-4 h-4" /> {t.bank}
        </button>
      </div>

      {method === "bank" && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {BANK_PRESETS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBankName(b)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                  bankName === b
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
          <Input
            placeholder="Or type bank / wallet name..."
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="h-10 text-sm"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-500">{t.howMuch}</label>
          {remaining > 0 && (
            <button
              type="button"
              onClick={handleFillFull}
              className="text-xs text-orange-600 font-bold hover:underline cursor-pointer"
            >
              Full (Rs. {remaining.toFixed(0)})
            </button>
          )}
        </div>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">
            Rs.
          </span>
          <Input
            type="number"
            placeholder={remaining.toFixed(0)}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`pl-10 h-13 text-xl font-bold ${
              isOver ? "border-red-500 focus-visible:ring-red-400" : ""
            }`}
          />
        </div>
        {isOver && (
          <p className="text-xs text-red-500">
            Amount exceeds remaining (Rs. {remaining.toFixed(0)})
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!canSubmit}
        className="w-full h-13 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] transition text-white font-bold rounded-xl text-base disabled:opacity-50 cursor-pointer shadow-md"
      >
        {recordPayment.isPending
          ? "Saving…"
          : isExact
          ? t.save
          : `Record Rs. ${numAmount.toFixed(0)}`}
      </button>
    </div>
  );

  if (!open) return null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="bg-white p-0">
          <div className="mx-auto w-12 h-1.5 bg-gray-200 rounded-full my-3 shrink-0" />
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md bg-white p-0 overflow-hidden">
        {content}
      </AlertDialogContent>
    </AlertDialog>
  );
}
