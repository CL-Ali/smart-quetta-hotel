"use client";

import React, { useState, useMemo } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/useMobile";
import { CartItem } from "@/types/hotel";
import { useLang } from "@/contexts/LangContext";
import {
  FaBagShopping,
  FaPlus,
  FaMinus,
  FaTrashCan,
  FaArrowRight,
  FaCheck,
  FaPen,
  FaXmark,
} from "react-icons/fa6";
import { playTapSound, unlockAudio } from "@/lib/sound";
import { getAccurateItemImageByName } from "../utils/itemImage";
import { getItemDisplayName } from "../utils/itemTranslation";

interface ConfirmPlaceModalProps {
  open: boolean;
  cart: CartItem[];
  cartTotal: number;
  onClose: () => void;
  onConfirm: (notes?: string) => void;
  onRemoveItem?: (id: number) => void;
  onAdd?: (item: any, qty?: number) => void;
  onDec?: (id: number) => void;
}

interface SpecialRequestOption {
  id: string;
  label: string;
}

// Dynamic preparation & cooking preferences extracted from the specific products in the cart
function getDynamicSpecialRequests(cart: CartItem[], lang: string): SpecialRequestOption[] {
  if (!cart || cart.length === 0) return [];

  const foundOptions: string[] = [];
  cart.forEach((item) => {
    if (item.options && typeof item.options === "string") {
      const parts = item.options.split(/[,;\n]/).map((p) => p.trim()).filter(Boolean);
      parts.forEach((p) => {
        if (!foundOptions.some((existing) => existing.toLowerCase() === p.toLowerCase())) {
          foundOptions.push(p);
        }
      });
    }
  });

  if (foundOptions.length > 0) {
    return foundOptions.map((opt, idx) => ({
      id: `opt_${idx}_${opt.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
      label: opt,
    }));
  }

  // Universal dining fallback if no specific product options are configured
  const takeawayLabel = lang === "ur" ? "پارسل / پیکنگ" : "Takeaway Packing";
  return [
    { id: "req_takeaway", label: takeawayLabel },
  ];
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

  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const specialOptions = useMemo(() => getDynamicSpecialRequests(cart, lang), [cart, lang]);

  const toggleSpecialRequest = (id: string) => {
    unlockAudio();
    playTapSound();
    setSelectedRequests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const confirmItemDelete = () => {
    if (itemToDelete && onRemoveItem) {
      playTapSound();
      onRemoveItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const renderContent = (isMob: boolean) => (
    <div className="p-4 sm:p-5 flex flex-col gap-3.5 text-center max-h-[85vh] overflow-y-auto no-scrollbar relative">
      {/* ── Modal Header ────────────────────────── */}
      <div
        className={`flex items-center justify-between border-b border-stone-100 dark:border-zinc-800/80 pb-3 ${
          isMob ? "pt-0" : "pt-1"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-amber/15 text-brand-amber flex items-center justify-center font-bold">
            <FaBagShopping className="w-4 h-4" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white">
            {t.confirmOrderTitle || t.confirmOrder || "Confirm Order"}
          </h3>
        </div>
        <span className="text-xs font-bold bg-amber-50 text-brand-amber dark:bg-amber-950/50 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60">
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </span>
      </div>

      {/* ── Itemized Order List ───────────────────── */}
      <div className="bg-stone-50 dark:bg-zinc-800/60 rounded-2xl p-3 text-left max-h-48 sm:max-h-56 overflow-y-auto space-y-2 border border-stone-200/80 dark:border-zinc-800 divide-y divide-stone-200/60 dark:divide-zinc-700/60 no-scrollbar">
        {cart.map((item) => {
          const itemImg = getAccurateItemImageByName(item.name, item.imageUrl);
          const displayName = getItemDisplayName(item.name, lang);
          return (
            <div
              key={item.id}
              className="pt-2.5 first:pt-0 flex items-center justify-between gap-2.5 text-xs"
            >
              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-stone-200 dark:bg-zinc-700 shrink-0 border border-stone-300/60 dark:border-zinc-600">
                <img src={itemImg} alt={displayName} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-stone-900 dark:text-white truncate">
                  {displayName}
                </p>
                <p className="font-bold text-xs text-brand-amber dark:text-amber-400 mt-0.5">
                  Rs. {(item.price * item.quantity).toLocaleString()}
                </p>
              </div>

              {/* Delete button (before quantity bar) + Stepper Pill */}
              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                {/* 1. Delete Item Button with confirmation */}
                {onRemoveItem && (
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setItemToDelete(item);
                    }}
                    className="w-6 h-6 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
                    title="Delete item"
                  >
                    <FaTrashCan className="w-2.5 h-2.5" />
                  </button>
                )}

                {/* 2. Stepper Pill */}
                {onDec && onAdd && (
                  <div className="h-7 bg-white dark:bg-zinc-800 border border-brand-amber/50 dark:border-brand-amber/40 rounded-full px-1.5 flex items-center gap-1.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.quantity === 1) {
                          playTapSound();
                          setItemToDelete(item);
                        } else {
                          playTapSound();
                          onDec(item.id);
                        }
                      }}
                      className="w-5 h-5 rounded-full bg-stone-100 dark:bg-zinc-700 text-stone-900 dark:text-stone-100 hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900 flex items-center justify-center transition active:scale-90 cursor-pointer"
                      title="Decrease"
                    >
                      <FaMinus className="w-2.5 h-2.5" />
                    </button>
                    <span className="min-w-[16px] text-center text-xs font-mono font-black text-brand-amber dark:text-amber-400">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        unlockAudio();
                        playTapSound();
                        onAdd(item, 1);
                      }}
                      className="w-5 h-5 rounded-full bg-brand-amber hover:bg-brand-amber-hover text-white flex items-center justify-center transition active:scale-90 cursor-pointer shadow-2xs"
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

      {/* ── Preferences & Kitchen Notes (Moved from sidebar into Dialog) ── */}
      {specialOptions.length > 0 && (
        <div className="text-left pt-1">
          <p className="text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1.5">
            {lang === "ur" ? "خصوصی ہدایات" : "Preferences"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {specialOptions.map((opt) => {
              const isSelected = selectedRequests.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleSpecialRequest(opt.id)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition cursor-pointer flex items-center gap-1 active:scale-95 ${
                    isSelected
                      ? "bg-brand-amber text-white border-brand-amber shadow-xs shadow-amber-500/20"
                      : "bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border-stone-200/80 dark:border-zinc-700 hover:border-brand-amber"
                  }`}
                >
                  {isSelected && <FaCheck className="w-2 h-2" />}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Custom Kitchen Note Input ────────────── */}
      <div className="text-left pt-0.5">
        {!showNoteInput ? (
          <button
            type="button"
            onClick={() => setShowNoteInput(true)}
            className="text-xs text-brand-amber dark:text-amber-400 hover:underline font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <FaPen className="w-2.5 h-2.5 opacity-80" />
            <span>+ {lang === "ur" ? "کچن نوٹ شامل کریں" : "Add kitchen note"}</span>
          </button>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
              <span>{lang === "ur" ? "کچن نوٹ:" : "Kitchen Note:"}</span>
              <button
                type="button"
                onClick={() => setShowNoteInput(false)}
                className="text-stone-400 hover:text-stone-600 p-0.5"
              >
                <FaXmark className="w-3 h-3" />
              </button>
            </div>
            <textarea
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder={lang === "ur" ? "مثال: چائے زیادہ گرم، کم تیل وغیرہ..." : "e.g. Extra hot chai, less oil..."}
              className="w-full text-xs p-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-brand-amber text-stone-900 dark:text-white"
            />
          </div>
        )}
      </div>

      {/* ── Bill Total Summary ───────────────────── */}
      <div className="bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl p-3.5 flex items-center justify-between border border-amber-200/80 dark:border-amber-800/60">
        <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
          {t.total || "Total Due"}
        </span>
        <span className="text-lg font-black font-mono text-stone-900 dark:text-white">
          Rs. {cartTotal.toLocaleString()}
        </span>
      </div>

      {/* ── Confirmation Actions ─────────────────── */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => {
            playTapSound();
            onClose();
          }}
          className="h-11 rounded-full border border-stone-200/90 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 text-xs font-bold hover:bg-stone-100 dark:hover:bg-zinc-800 transition cursor-pointer"
        >
          {t.cancel || "Cancel"}
        </button>
        <button
          type="button"
          onClick={() => {
            unlockAudio();
            playTapSound();
            const selectedLabels = specialOptions
              .filter((opt) => selectedRequests.includes(opt.id))
              .map((opt) => opt.label);
            let finalNote = selectedLabels.join(", ");
            if (customNote.trim()) {
              finalNote = finalNote ? `${finalNote} (${customNote.trim()})` : customNote.trim();
            }
            onConfirm(finalNote || undefined);
          }}
          className="h-11 rounded-full bg-brand-amber hover:bg-brand-amber-hover text-white text-xs font-bold transition cursor-pointer shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 active:scale-98"
        >
          <span>{t.confirm || "Confirm Order"}</span>
          <FaArrowRight className="w-3 h-3 rtl:rotate-180" />
        </button>
      </div>

      {/* ── Item Delete Confirmation Prompt Inside Modal ── */}
      {itemToDelete && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in-0 duration-200">
          <div className="bg-white dark:bg-[#121824] rounded-t-[32px] sm:rounded-[24px] border border-stone-200/90 dark:border-white/[0.08] p-5 sm:p-6 max-w-xs w-full text-center shadow-2xl space-y-3.5 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-full mx-auto mb-2 sm:hidden shrink-0" />
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 mx-auto flex items-center justify-center">
              <FaTrashCan className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                {lang === "ur" ? "آئٹم ہٹائیں؟" : "Remove Item?"}
              </h4>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
                {lang === "ur"
                  ? `کیا آپ واقعی "${getItemDisplayName(itemToDelete.name, lang)}" کو آرڈر سے ہٹانا چاہتے ہیں؟`
                  : `Are you sure you want to remove "${getItemDisplayName(itemToDelete.name, lang)}" from your order?`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="h-9 rounded-full border border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 text-xs font-bold hover:bg-stone-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                {t.cancel || "Cancel"}
              </button>
              <button
                type="button"
                onClick={confirmItemDelete}
                className="h-9 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
              >
                {lang === "ur" ? "ہٹائیں" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (!open) return null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(val) => !val && onClose()}>
        <DrawerContent className="bg-white dark:bg-[#121824] border-stone-200/80 dark:border-zinc-800 p-0 rounded-t-3xl">
          {renderContent(true)}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={(val) => !val && onClose()}>
      <AlertDialogContent className="bg-white dark:bg-[#121824] border-stone-200/80 dark:border-zinc-800 max-w-md rounded-[28px] p-0 overflow-hidden shadow-2xl">
        {renderContent(false)}
      </AlertDialogContent>
    </AlertDialog>
  );
}
