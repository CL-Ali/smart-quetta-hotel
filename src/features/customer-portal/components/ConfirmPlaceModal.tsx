"use client";

import React from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/useMobile";
import { CartItem } from "@/types/hotel";
import { useLang } from "@/contexts/LangContext";
import { Trash2, Minus, Plus } from "lucide-react";
import { playTapSound } from "@/lib/sound";

interface ConfirmPlaceModalProps {
  open: boolean;
  cart: CartItem[];
  cartTotal: number;
  onClose: () => void;
  onConfirm: () => void;
  onRemoveItem?: (id: number) => void;
  onAdd?: (item: any) => void;
  onDec?: (id: number) => void;
}

export function ConfirmPlaceModal({
  open,
  cart,
  cartTotal,
  onClose,
  onConfirm,
  onRemoveItem,
  onAdd,
  onDec,
}: ConfirmPlaceModalProps) {
  const isMobile = useIsMobile();
  const { t } = useLang();

  const renderContent = (isMob: boolean) => (
    <div className="p-4 flex flex-col gap-3.5 text-center">
      <div
        className={`flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2.5 ${
          isMob ? "pt-0" : "pt-1"
        }`}
      >
        <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100">
          {t.confirmOrderTitle || t.confirmOrder || "Confirm Order"}
        </h3>
        <span className="text-xs font-black bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
          {cart.reduce((s, i) => s + i.quantity, 0)} {t.orderSummary || "Items"}
        </span>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-3 text-left max-h-52 overflow-y-auto space-y-2 border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
        {cart.map((item) => (
          <div
            key={item.id}
            className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs"
          >
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-gray-900 dark:text-gray-100 truncate">
                {item.name}
              </p>
              <p className="text-[11px] font-bold text-orange-600">
                Rs. {item.price * item.quantity}
              </p>
            </div>

            {/* Stepper + Delete Icon */}
            <div className="flex items-center gap-1.5 shrink-0">
              {onDec && onAdd && (
                <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      onDec(item.id);
                    }}
                    className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 flex items-center justify-center text-gray-700 dark:text-gray-200 transition cursor-pointer"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="w-5 text-center text-xs font-black text-gray-900 dark:text-white">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      onAdd(item);
                    }}
                    className="w-5 h-5 rounded bg-orange-600 text-white flex items-center justify-center hover:bg-orange-700 transition cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}

              {onRemoveItem && (
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    onRemoveItem(item.id);
                  }}
                  className="w-6 h-6 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 transition flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Remove"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-1 font-black text-sm text-gray-900 dark:text-white">
        <span>{t.totalBillLabel || t.total || "Total Due"}</span>
        <span className="text-orange-600 text-base sm:text-lg">Rs. {cartTotal}</span>
      </div>

      <div className="flex gap-2.5 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-12 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-xl text-xs sm:text-sm font-bold cursor-pointer text-gray-700 dark:text-gray-300 transition"
        >
          {t.cancel || "Cancel"}
        </button>
        <button
          type="button"
          disabled={cart.length === 0}
          onClick={() => {
            onClose();
            onConfirm();
          }}
          className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black rounded-xl text-xs sm:text-sm cursor-pointer flex items-center justify-center shadow-md transition disabled:opacity-50"
        >
          {t.confirmOrder || "Confirm Order ✓"}
        </button>
      </div>
    </div>
  );

  if (!open) return null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
        <DrawerContent className="bg-white dark:bg-gray-950 p-0">
          <div className="mx-auto w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full my-3 shrink-0" />
          {renderContent(true)}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent className="max-w-sm mx-4 bg-white dark:bg-gray-950 p-0 overflow-hidden rounded-2xl">
        {renderContent(false)}
      </AlertDialogContent>
    </AlertDialog>
  );
}
