"use client";

import React from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/useMobile";
import { CartItem } from "@/types/hotel";
import { useLang } from "@/contexts/LangContext";
import { Trash2, Minus, Plus, Receipt, ShoppingBag } from "lucide-react";
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

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  const renderContent = (isMob: boolean) => (
    <div className="p-4 sm:p-5 flex flex-col gap-4 text-center">
      {/* Header */}
      <div
        className={`flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-3 ${
          isMob ? "pt-0" : "pt-1"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white">
            {t.confirmOrderTitle || t.confirmOrder}
          </h3>
        </div>
        <span className="text-xs font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
          {totalItems} {t.orderSummary || "Items"}
        </span>
      </div>

      {/* Itemized Order List */}
      <div className="bg-stone-50 dark:bg-zinc-900/80 rounded-2xl p-3 text-left max-h-56 overflow-y-auto space-y-2 border border-stone-200/80 dark:border-zinc-800 divide-y divide-stone-200/60 dark:divide-zinc-800 no-scrollbar">
        {cart.map((item) => (
          <div
            key={item.id}
            className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs"
          >
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-stone-900 dark:text-white truncate">
                {item.name}
              </p>
              <p className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                Rs. {(item.price * item.quantity).toLocaleString()}
              </p>
            </div>

            {/* Stepper + Delete Icon */}
            <div className="flex items-center gap-1.5 shrink-0">
              {onDec && onAdd && (
                <div className="flex items-center border border-stone-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      onDec(item.id);
                    }}
                    className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-zinc-700 hover:bg-stone-200 dark:hover:bg-zinc-600 flex items-center justify-center text-stone-700 dark:text-zinc-200 transition cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-black text-stone-900 dark:text-white font-mono">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      onAdd(item);
                    }}
                    className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
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
                  className="w-7 h-7 rounded-xl bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 transition flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Total Due */}
      <div className="flex items-center justify-between px-1 font-black text-sm text-stone-900 dark:text-white pt-1">
        <span className="flex items-center gap-1.5 text-stone-600 dark:text-zinc-300 font-bold">
          <Receipt className="w-4 h-4 text-amber-500" />
          {t.totalBillLabel || t.total}
        </span>
        <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-lg sm:text-xl">
          Rs. {cartTotal.toLocaleString()}
        </span>
      </div>

      {/* Buttons */}
      <div className="flex gap-2.5 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-12 border border-stone-200 dark:border-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-800 active:scale-95 rounded-2xl text-xs sm:text-sm font-bold cursor-pointer text-stone-700 dark:text-zinc-300 transition"
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
          className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black rounded-2xl text-xs sm:text-sm cursor-pointer flex items-center justify-center shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
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
        <DrawerContent className="bg-white dark:bg-zinc-950 p-0 rounded-t-3xl border-t border-stone-200 dark:border-zinc-800">
          <div className="mx-auto w-12 h-1.5 bg-stone-200 dark:bg-zinc-800 rounded-full my-3 shrink-0" />
          {renderContent(true)}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent className="max-w-sm mx-4 bg-white dark:bg-zinc-950 p-0 overflow-hidden rounded-3xl border border-stone-200 dark:border-zinc-800 shadow-2xl">
        {renderContent(false)}
      </AlertDialogContent>
    </AlertDialog>
  );
}
