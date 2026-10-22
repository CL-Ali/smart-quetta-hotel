"use client";

import React, { useState, useMemo } from "react";
import {
  FaBagShopping,
  FaTrashCan,
  FaPlus,
  FaMinus,
  FaArrowRight,
  FaSpinner,
} from "react-icons/fa6";
import { CartItem, MenuItem } from "@/types/hotel";
import { useLang } from "@/contexts/LangContext";
import { playTapSound, unlockAudio } from "@/lib/sound";
import { getAccurateItemImageByName } from "../utils/itemImage";
import { getItemDisplayName } from "../utils/itemTranslation";

interface DesktopCartSidebarProps {
  cart: CartItem[];
  cartTotal: number;
  guestName: string;
  ticketNo?: string | null;
  seatingLabel?: string;
  placing: boolean;
  menu?: MenuItem[];
  onAdd: (item: any, qty?: number) => void;
  onDec: (id: number) => void;
  onRemoveItem: (id: number) => void;
  onClearCart?: () => void;
  onCheckout: () => void;
}

// Smart upsell finder (100% Dynamic & Data-driven)
function getSmartMenuUpsells(menu: MenuItem[] = [], cart: CartItem[] = []): MenuItem[] {
  if (!menu || menu.length === 0) return [];

  const cartIds = new Set(cart.map((i) => i.id));
  const cartDeptIds = new Set(cart.map((i) => (i as any).departmentId).filter(Boolean));
  const candidates = menu.filter((m) => m.isAvailable !== false && !cartIds.has(m.id));
  if (candidates.length === 0) return [];

  // Recommend complementary items from other departments not yet in the cart
  const crossDeptCandidates = candidates.filter((m) => m.departmentId && !cartDeptIds.has(m.departmentId));
  if (crossDeptCandidates.length > 0) {
    return crossDeptCandidates.slice(0, 2);
  }

  return candidates.slice(0, 2);
}

export function DesktopCartSidebar({
  cart,
  cartTotal,
  placing,
  menu = [],
  onAdd,
  onDec,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: DesktopCartSidebarProps) {
  const { t, lang } = useLang();
  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const smartUpsells = useMemo(() => getSmartMenuUpsells(menu, cart), [menu, cart]);

  const confirmDelete = () => {
    if (itemToDelete) {
      playTapSound();
      onRemoveItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  return (
    <div className="bg-white dark:bg-[#121824] rounded-[26px] sm:rounded-[28px] flex flex-col h-full overflow-hidden relative">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="p-4 border-b border-stone-100 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-amber/15 text-brand-amber flex items-center justify-center font-bold shrink-0">
            <FaBagShopping className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 dark:text-white text-sm leading-tight">
              {t.orderSummary || "Order Summary"}
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-zinc-400 font-medium">
              {totalItems} {totalItems === 1 ? "item" : "items"} selected
            </p>
          </div>
        </div>

        {cart.length > 0 && onClearCart && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-xs text-stone-400 hover:text-red-500 font-medium transition cursor-pointer px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Cart Items List ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 no-scrollbar min-h-0">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-center text-stone-400">
            <div className="w-12 h-12 rounded-full bg-[#F8F3EC] dark:bg-zinc-800 flex items-center justify-center mb-2.5">
              <FaBagShopping className="w-5 h-5 opacity-40 text-stone-500" />
            </div>
            <p className="text-sm font-bold text-stone-700 dark:text-zinc-300">
              Your cart is empty
            </p>
            <p className="text-xs text-stone-400 mt-0.5">Click + Add on any food item to start</p>
          </div>
        ) : (
          <>
            {/* List of items */}
            <div className="space-y-2">
              {cart.map((item) => {
                const itemImg = getAccurateItemImageByName(item.name, item.imageUrl);
                const displayName = getItemDisplayName(item.name, lang);
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-[#F8F3EC] dark:bg-[#1A2232] flex items-center justify-between gap-3 border-0 transition-all"
                  >
                    <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-white dark:bg-zinc-800 shrink-0">
                      <img src={itemImg} alt={displayName} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs sm:text-sm text-[#24180A] dark:text-white truncate">
                        {displayName}
                      </h4>
                      <p className="text-xs font-black text-[#D98A3C] font-mono mt-0.5">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>

                    {/* Delete button + Stepper Pill */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Delete Item Button */}
                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setItemToDelete(item);
                        }}
                        className="w-7 h-7 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
                        title="Delete item"
                      >
                        <FaTrashCan className="w-2.5 h-2.5" />
                      </button>

                      {/* Quantity Stepper Pill */}
                      <div className="h-8 bg-white dark:bg-[#121824] rounded-full px-1.5 flex items-center gap-1.5 border-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity === 1) {
                              playTapSound();
                              setItemToDelete(item);
                            } else {
                              playTapSound();
                              onDec(item.id);
                            }
                          }}
                          className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 text-[#24180A] dark:text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
                          title="Decrease"
                        >
                          <FaMinus className="w-2.5 h-2.5" />
                        </button>
                        <span className="min-w-[16px] text-center text-xs font-mono font-black text-[#D98A3C]">
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
                          className="w-6 h-6 rounded-full bg-[#D98A3C] hover:bg-[#C27930] text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
                          title="Increase"
                        >
                          <FaPlus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recommended Complements / Upsell */}
            {smartUpsells.length > 0 && (
              <div className="pt-3 border-t border-[#F8F3EC] dark:border-white/5">
                <p className="text-xs font-extrabold text-[#786B5D] dark:text-zinc-400 mb-2">
                  Frequently Ordered Together
                </p>
                <div className="space-y-2">
                  {smartUpsells.map((upsell) => (
                    <div
                      key={upsell.id}
                      className="bg-[#F8F3EC] dark:bg-[#1A2232] p-3 rounded-2xl flex items-center justify-between gap-2 border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#24180A] dark:text-white truncate">
                          {upsell.name}
                        </p>
                        <p className="text-xs font-black text-[#D98A3C] font-mono">
                          Rs. {upsell.price}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          unlockAudio();
                          playTapSound();
                          onAdd(upsell, 1);
                        }}
                        className="px-4 py-1.5 rounded-full bg-[#D98A3C] hover:bg-[#C27930] text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-none active:scale-95"
                      >
                        <FaPlus className="w-2.5 h-2.5" />
                        <span>{t.addToCart || "Add"}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Fixed Footer & Place Order Action ─────────────── */}
      {cart.length > 0 && (
        <div className="p-4 sm:p-5 border-t border-[#F8F3EC] dark:border-white/5 bg-white dark:bg-[#121824] space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#786B5D] dark:text-zinc-400">
              Total Bill
            </span>
            <span className="text-lg font-black font-mono text-[#24180A] dark:text-white">
              Rs. {cartTotal.toLocaleString()}
            </span>
          </div>

          <button
            type="button"
            disabled={placing}
            onClick={() => {
              unlockAudio();
              playTapSound();
              onCheckout();
            }}
            className="w-full h-13 bg-[#D98A3C] hover:bg-[#C27930] text-white font-black text-sm rounded-full shadow-none active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {placing ? (
              <>
                <FaSpinner className="w-4 h-4 animate-spin" />
                <span>Sending to Kitchen…</span>
              </>
            ) : (
              <>
                <span>Place Order</span>
                <FaArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Item Delete Confirmation Modal ─────────────────── */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0">
          <div className="bg-white dark:bg-[#121824] rounded-[28px] p-6 max-w-xs w-full text-center shadow-2xl space-y-4 animate-in zoom-in-95">
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
                  : `Are you sure you want to remove "${getItemDisplayName(itemToDelete.name, lang)}" from your cart?`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="h-10 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 text-xs font-bold transition cursor-pointer"
              >
                {t.cancel || "Cancel"}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="h-10 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
              >
                {lang === "ur" ? "ہٹائیں" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
