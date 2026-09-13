"use client";

import React, { useState, useMemo } from "react";
import {
  FaBagShopping,
  FaTrashCan,
  FaPlus,
  FaMinus,
  FaArrowRight,
  FaCheck,
  FaSpinner,
  FaPen,
} from "react-icons/fa6";
import { CartItem, MenuItem } from "@/types/hotel";
import { useLang } from "@/contexts/LangContext";
import { playTapSound, unlockAudio } from "@/lib/sound";

interface DesktopCartSidebarProps {
  cart: CartItem[];
  cartTotal: number;
  guestName: string;
  ticketNo?: string | null;
  seatingLabel?: string;
  placing: boolean;
  menu?: MenuItem[];
  onAdd: (item: any) => void;
  onDec: (id: number) => void;
  onRemoveItem: (id: number) => void;
  onClearCart?: () => void;
  onCheckout: () => void;
}

interface SpecialRequestOption {
  id: string;
  labelUr: string;
  labelEn: string;
}

// Clean special requests without emojis
function getDynamicSpecialRequests(cart: CartItem[]): SpecialRequestOption[] {
  if (!cart || cart.length === 0) return [];

  const cartText = cart
    .map((i) => `${i.name} ${i.description || ""}`)
    .join(" ")
    .toLowerCase();

  const options: SpecialRequestOption[] = [];

  // 1. Chai detection
  const hasChai = /chai|tea|chaye|چائے|doodh patti|karak/i.test(cartText);
  if (hasChai) {
    options.push(
      { id: "chai_karak", labelUr: "کڑک چائے", labelEn: "Strong Karak" },
      { id: "chai_less_sugar", labelUr: "کم چینی", labelEn: "Less Sugar" },
      { id: "chai_no_sugar", labelUr: "بغیر چینی", labelEn: "No Sugar" }
    );
  }

  // 2. Paratha / Roti
  const hasParatha = /paratha|lacha|roti|naan|پراٹھا|روٹی|نان/i.test(cartText);
  if (hasParatha) {
    options.push(
      { id: "paratha_crispy", labelUr: "کرکرا پراٹھا", labelEn: "Extra Crispy" },
      { id: "paratha_less_oil", labelUr: "کم تیل/گھی", labelEn: "Less Oil" }
    );
  }

  // 3. Egg / Breakfast
  const hasEgg = /anda|egg|omelette|fry|half fry|انڈہ|آملیٹ|ناشتہ/i.test(cartText);
  if (hasEgg) {
    options.push(
      { id: "egg_half_fry", labelUr: "ہاف فرائی", labelEn: "Half Fry" },
      { id: "egg_full_fry", labelUr: "فل فرائی", labelEn: "Full Fry" },
      { id: "egg_spicy", labelUr: "تیز مرچ", labelEn: "Extra Spicy" }
    );
  }

  // 4. Curry / Karahi
  const hasCurry = /karahi|chicken|gosht|mutton|handi|qeema|کڑاہی|قیمہ|سالن/i.test(cartText);
  if (hasCurry) {
    options.push(
      { id: "curry_spicy", labelUr: "تیز مصالحہ", labelEn: "Extra Spicy" },
      { id: "curry_mild", labelUr: "ہلکی مرچ", labelEn: "Mild Spicy" }
    );
  }

  // 5. Takeaway
  options.push(
    { id: "takeaway_pack", labelUr: "پارسل / پیکنگ", labelEn: "Takeaway Packing" }
  );

  return options;
}

// Smart upsell finder
function getSmartMenuUpsells(menu: MenuItem[] = [], cart: CartItem[] = []): MenuItem[] {
  if (!menu || menu.length === 0) return [];

  const cartIds = new Set(cart.map((i) => i.id));
  const candidates = menu.filter((m) => m.isAvailable !== false && !cartIds.has(m.id));
  if (candidates.length === 0) return [];

  const cartText = cart
    .map((i) => `${i.name} ${i.description || ""} ${i.name}`)
    .join(" ")
    .toLowerCase();

  const hasChai = /chai|tea|chaye|چائے|doodh patti|karak/i.test(cartText);
  const hasParatha = /paratha|lacha|roti|naan|پراٹھا|روٹی/i.test(cartText);
  const hasEgg = /anda|egg|omelette|fry/i.test(cartText);

  const matched: MenuItem[] = [];

  const findCandidate = (regex: RegExp) => {
    const found = candidates.find(
      (c) =>
        regex.test(`${c.name} ${c.description || ""} ${c.category || ""}`) &&
        !matched.some((m) => m.id === c.id)
    );
    if (found) matched.push(found);
  };

  if (hasParatha && !hasChai) findCandidate(/chai|doodh patti|tea/i);
  if (hasParatha && !hasEgg) findCandidate(/anda|egg|omelette|fry/i);
  if (hasChai && !hasParatha) findCandidate(/paratha|roti|samosa/i);

  if (matched.length === 0) {
    matched.push(...candidates.slice(0, 2));
  }

  return matched.slice(0, 2);
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
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const specialOptions = useMemo(() => getDynamicSpecialRequests(cart), [cart]);
  const smartUpsells = useMemo(() => getSmartMenuUpsells(menu, cart), [menu, cart]);

  const toggleSpecialRequest = (id: string) => {
    unlockAudio();
    playTapSound();
    setSelectedRequests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800 shadow-2xs flex flex-col h-full overflow-hidden">
      {/* ── M3 Header ─────────────────────────────────────── */}
      <div className="p-3.5 border-b border-stone-200/80 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
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
      <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar min-h-0">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-center text-stone-400">
            <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-zinc-800 flex items-center justify-center mb-2.5">
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
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-stone-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-stone-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-stone-900 dark:text-white truncate">
                      {item.name}
                    </h4>
                    <p className="text-xs font-mono font-black text-amber-600 dark:text-amber-400 mt-0.5">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>

                  {/* Stepper + Delete */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-full p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          onDec(item.id);
                        }}
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition cursor-pointer ${
                          item.quantity === 1
                            ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                            : "text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800"
                        }`}
                        title={item.quantity === 1 ? "Remove" : "Decrease"}
                      >
                        {item.quantity === 1 ? (
                          <FaTrashCan className="w-2 h-2" />
                        ) : (
                          <FaMinus className="w-2 h-2" />
                        )}
                      </button>
                      <span className="w-5 text-center text-xs font-bold font-mono text-stone-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          unlockAudio();
                          playTapSound();
                          onAdd(item);
                        }}
                        className="w-5 h-5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center transition cursor-pointer shadow-xs"
                        title="Increase"
                      >
                        <FaPlus className="w-2 h-2" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        playTapSound();
                        onRemoveItem(item.id);
                      }}
                      className="w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-500 transition flex items-center justify-center cursor-pointer shadow-2xs"
                      title="Delete item"
                    >
                      <FaTrashCan className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Special Instructions / Quick Request Chips */}
            {specialOptions.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1.5">
                  Preferences
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
                            ? "bg-amber-500 text-stone-950 border-amber-500 shadow-xs"
                            : "bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border-stone-200/80 dark:border-zinc-700 hover:border-stone-400"
                        }`}
                      >
                        {isSelected && <FaCheck className="w-2 h-2" />}
                        <span>{lang === "ur" ? opt.labelUr : opt.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Kitchen Note */}
            <div className="pt-1">
              {!showNoteInput ? (
                <button
                  type="button"
                  onClick={() => setShowNoteInput(true)}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <FaPen className="w-2.5 h-2.5 opacity-80" />
                  <span>+ Add kitchen note</span>
                </button>
              ) : (
                <div className="space-y-1">
                  <textarea
                    rows={2}
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="e.g. Extra hot chai, less oil..."
                    className="w-full text-xs p-2 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            {/* Recommended Complements */}
            {smartUpsells.length > 0 && (
              <div className="pt-2 border-t border-stone-100 dark:border-zinc-800">
                <p className="text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1.5">
                  Frequently Ordered Together
                </p>
                <div className="space-y-1.5">
                  {smartUpsells.map((upsell) => (
                    <div
                      key={upsell.id}
                      className="bg-stone-50 dark:bg-zinc-800/50 p-2 rounded-xl border border-stone-200/80 dark:border-zinc-700 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-stone-900 dark:text-white truncate">
                          {upsell.name}
                        </p>
                        <p className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                          Rs. {upsell.price}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          unlockAudio();
                          playTapSound();
                          onAdd(upsell);
                        }}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-full transition cursor-pointer flex items-center gap-1 active:scale-95 shadow-xs"
                      >
                        <FaPlus className="w-2 h-2" />
                        <span>Add</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Fixed Bottom Summary & Order CTA ──────── */}
      {cart.length > 0 && (
        <div className="p-3.5 border-t border-stone-200/80 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/90 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-600 dark:text-zinc-400">
            <span>{t.totalBillLabel || "Total Due"}</span>
            <span className="text-lg font-black font-mono text-stone-900 dark:text-white">
              Rs. {cartTotal.toLocaleString()}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              unlockAudio();
              playTapSound();
              onCheckout();
            }}
            disabled={placing}
            className="w-full h-11 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition active:scale-[0.99] disabled:opacity-50 text-xs sm:text-sm"
          >
            {placing ? (
              <FaSpinner className="w-4 h-4 animate-spin text-stone-950" />
            ) : (
              <>
                <span>{t.placeOrder || "Place Order"}</span>
                <FaArrowRight className="w-3 h-3 rtl:rotate-180" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
