"use client";

import React from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/useMobile";
import { CartItem } from "@/types/hotel";
import { useLang } from "@/contexts/LangContext";
import { FaBagShopping, FaPlus, FaMinus, FaTrashCan, FaArrowRight } from "react-icons/fa6";
import { playTapSound, unlockAudio } from "@/lib/sound";
import { getAccurateItemImageByName } from "../utils/itemImage";
import { getItemDisplayName } from "../utils/itemTranslation";

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
  const { t, lang } = useLang();

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  const renderContent = (isMob: boolean) => (
    <div className="p-4 sm:p-5 flex flex-col gap-3.5 text-center">
      {/* Header */}
      <div
        className={`flex items-center justify-between border-b border-stone-200/80 dark:border-zinc-800 pb-3 ${
          isMob ? "pt-0" : "pt-1"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <FaBagShopping className="w-4 h-4" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white">
            {t.confirmOrderTitle || t.confirmOrder}
          </h3>
        </div>
        <span className="text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/20">
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Itemized Order List */}
      <div className="bg-stone-50 dark:bg-zinc-800/60 rounded-2xl p-3 text-left max-h-60 overflow-y-auto space-y-2 border border-stone-200/80 dark:border-zinc-800 divide-y divide-stone-200/60 dark:divide-zinc-700/60 no-scrollbar">
        {cart.map((item) => {
          const itemImg = getAccurateItemImageByName(item.name, item.imageUrl);
          const displayName = getItemDisplayName(item.name, lang);
          return (
            <div
              key={item.id}
              className="pt-2.5 first:pt-0 flex items-center justify-between gap-2.5 text-xs"
            >
              <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-stone-200 dark:bg-zinc-700 shrink-0 border border-stone-300/60 dark:border-zinc-600">
                <img src={itemImg} alt={displayName} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-stone-900 dark:text-white truncate">
                  {displayName}
                </p>
                <p className="font-mono text-xs font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  Rs. {(item.price * item.quantity).toLocaleString()}
                </p>
              </div>

            {/* Stepper Pill */}
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              {onDec && onAdd && (
                <div className="h-7 bg-stone-900 dark:bg-white text-white dark:text-stone-950 rounded-xl px-1.5 py-0.5 flex items-center gap-1.5 shadow-2xs border border-stone-800 dark:border-stone-200">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playTapSound();
                      if (item.quantity === 1 && onRemoveItem) {
                        onRemoveItem(item.id);
                      } else {
                        onDec(item.id);
                      }
                    }}
                    className="w-5 h-5 rounded flex items-center justify-center text-stone-300 hover:text-white dark:text-stone-700 dark:hover:text-stone-950 hover:bg-white/10 dark:hover:bg-stone-100 transition active:scale-90 cursor-pointer"
                    title={item.quantity === 1 ? "Remove" : "Decrease"}
                  >
                    {item.quantity === 1 ? (
                      <FaTrashCan className="w-2.5 h-2.5 text-red-400 dark:text-red-500" />
                    ) : (
                      <FaMinus className="w-2.5 h-2.5" />
                    )}
                  </button>
                  <span className="min-w-[16px] text-center text-xs font-mono font-black text-amber-400 dark:text-amber-600">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      unlockAudio();
                      playTapSound();
                      onAdd(item);
                    }}
                    className="w-5 h-5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center justify-center transition active:scale-90 cursor-pointer shadow-2xs"
                    title="Increase"
                  >
                    <FaPlus className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {/* Bill Calculation Summary */}
      <div className="bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl p-3.5 flex items-center justify-between border border-amber-200/80 dark:border-amber-800/60">
        <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
          {t.total || "Total Due"}
        </span>
        <span className="text-lg font-black font-mono text-stone-900 dark:text-white">
          Rs. {cartTotal.toLocaleString()}
        </span>
      </div>

      {/* Confirmation Actions */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => {
            playTapSound();
            onClose();
          }}
          className="h-11 rounded-xl border border-stone-200/80 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 text-xs font-bold hover:bg-stone-100 dark:hover:bg-zinc-800 transition cursor-pointer"
        >
          {t.cancel || "Cancel"}
        </button>
        <button
          type="button"
          onClick={() => {
            unlockAudio();
            playTapSound();
            onConfirm();
          }}
          className="h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5 active:scale-98"
        >
          <span>{t.confirm || "Send to Kitchen"}</span>
          <FaArrowRight className="w-3 h-3 rtl:rotate-180" />
        </button>
      </div>
    </div>
  );

  if (!open) return null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(val) => !val && onClose()}>
        <DrawerContent className="bg-white dark:bg-zinc-900 border-stone-200/80 dark:border-zinc-800 p-0 rounded-t-3xl">
          {renderContent(true)}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={(val) => !val && onClose()}>
      <AlertDialogContent className="bg-white dark:bg-zinc-900 border-stone-200/80 dark:border-zinc-800 max-w-sm rounded-3xl p-0 overflow-hidden shadow-2xl">
        {renderContent(false)}
      </AlertDialogContent>
    </AlertDialog>
  );
}
