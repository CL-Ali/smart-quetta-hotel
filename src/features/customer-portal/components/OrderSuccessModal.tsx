"use client";

import React from "react";
import { CheckCircle2, Ticket, ChefHat, ArrowRight } from "lucide-react";
import { useLang } from "@/contexts/LangContext";

interface OrderSuccessModalProps {
  open: boolean;
  ticketNo?: string | null;
  guestName: string;
  orderTotal: number;
  onClose: () => void;
  onViewOrders: () => void;
}

export function OrderSuccessModal({
  open,
  ticketNo,
  guestName,
  orderTotal,
  onClose,
  onViewOrders,
}: OrderSuccessModalProps) {
  const { lang } = useLang();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col items-center text-center animate-in zoom-in-95">
        {/* Animated Celebration Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-inner">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-black text-gray-900 leading-tight">
          {lang === "ur" ? "آرڈر مل گیا! مبارک ہو" : "Order Placed Successfully!"}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {lang === "ur"
            ? `محترم ${guestName || "مہمان"}، آپ کا کھانا کچن میں تیار ہو رہا ہے`
            : `Dear ${guestName || "Guest"}, your order is being prepared in the kitchen`}
        </p>

        {/* Ticket Token Box */}
        <div className="my-4 w-full bg-orange-50 border-2 border-dashed border-orange-300 rounded-2xl p-3.5 flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 uppercase tracking-wider">
            <Ticket className="w-4 h-4" />
            <span>{lang === "ur" ? "آپ کا ٹوکن نمبر" : "Your Token Number"}</span>
          </div>
          <p className="text-2xl font-black text-orange-600 font-mono tracking-wider mt-0.5">
            {ticketNo || "ORD-" + Math.floor(100 + Math.random() * 900)}
          </p>
          <div className="flex items-center justify-between w-full pt-2 mt-2 border-t border-orange-200/60 text-xs font-extrabold text-gray-800">
            <span>{lang === "ur" ? "کل رقم:" : "Total Bill:"}</span>
            <span className="text-orange-700 text-sm">Rs. {orderTotal}</span>
          </div>
        </div>

        {/* Cooking Status Notice */}
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl mb-4 w-full justify-center">
          <ChefHat className="w-4 h-4 animate-bounce" />
          <span>
            {lang === "ur"
              ? "باورچی خانے میں بن رہا ہے (Cooking Started)"
              : "Food is being freshly prepared"}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 w-full">
          <button
            type="button"
            onClick={onViewOrders}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold rounded-2xl text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{lang === "ur" ? "آرڈر ٹریک کریں" : "Track Your Order"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-10 border border-gray-200 hover:bg-gray-50 active:scale-95 text-gray-600 font-bold rounded-2xl text-xs transition cursor-pointer"
          >
            {lang === "ur" ? "مزید کھانا منگوائیں (Back to Menu)" : "Order More Items"}
          </button>
        </div>
      </div>
    </div>
  );
}
