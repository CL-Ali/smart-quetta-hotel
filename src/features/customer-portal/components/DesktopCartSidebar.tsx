"use client";

import React, { useState, useMemo } from "react";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  User,
  ArrowRight,
  Zap,
  Sparkles,
  Check,
} from "lucide-react";
import { CartItem, MenuItem } from "@/types/hotel";
import { useLang } from "@/contexts/LangContext";
import { playTapSound, playOrderSuccessSound } from "@/lib/sound";

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
  category: "chai" | "paratha" | "egg" | "curry" | "drink" | "general";
}

function getDynamicSpecialRequests(cart: CartItem[]): SpecialRequestOption[] {
  if (!cart || cart.length === 0) return [];

  const cartText = cart
    .map((i) => `${i.name} ${i.description || ""}`)
    .join(" ")
    .toLowerCase();

  const options: SpecialRequestOption[] = [];

  // 1. Chai / Tea detection
  const hasChai = /chai|tea|chaye|چائے|قہوہ|green tea|doodh patti|karak/i.test(cartText);
  if (hasChai) {
    options.push(
      { id: "chai_karak", labelUr: "☕ کڑک / تیز پتی", labelEn: "Strong Tea", category: "chai" },
      { id: "chai_less_sugar", labelUr: "☕ کم چینی", labelEn: "Less Sugar", category: "chai" },
      { id: "chai_no_sugar", labelUr: "☕ بغیر چینی (شوگر فری)", labelEn: "No Sugar", category: "chai" },
      { id: "chai_sweet", labelUr: "☕ زیادہ میٹھی", labelEn: "Extra Sweet", category: "chai" }
    );
  }

  // 2. Paratha / Roti detection
  const hasParatha = /paratha|lacha|roti|naan|پراٹھا|روٹی|نان/i.test(cartText);
  if (hasParatha) {
    options.push(
      { id: "paratha_crispy", labelUr: "🫓 کرکرا / کڑک پراٹھا", labelEn: "Crispy Paratha", category: "paratha" },
      { id: "paratha_less_oil", labelUr: "🫓 کم تیل / گھی", labelEn: "Less Oil", category: "paratha" },
      { id: "paratha_soft", labelUr: "🫓 نرم پراٹھا", labelEn: "Soft Paratha", category: "paratha" }
    );
  }

  // 3. Egg / Omelette / Breakfast detection
  const hasEgg = /anda|egg|omelette|fry|half fry|chanay|چنے|انڈہ|آملیٹ|ناشتہ/i.test(cartText);
  if (hasEgg) {
    options.push(
      { id: "egg_half_fry", labelUr: "🍳 ہاف فرائی انڈہ", labelEn: "Half Fry Egg", category: "egg" },
      { id: "egg_full_fry", labelUr: "🍳 فل فرائی / کڑک", labelEn: "Full Fry Egg", category: "egg" },
      { id: "egg_spicy", labelUr: "🌶️ ہری مرچ زیادہ", labelEn: "Extra Green Chili", category: "egg" }
    );
  }

  // 4. Karahi / Handi / Curry / Meat detection
  const hasCurry = /karahi|chicken|gosht|mutton|handi|qeema|کڑاہی|قیمہ|سالن|مرغی/i.test(cartText);
  if (hasCurry) {
    options.push(
      { id: "curry_spicy", labelUr: "🌶️ تیز مرچ و مصالحہ", labelEn: "Extra Spicy", category: "curry" },
      { id: "curry_mild", labelUr: "🌶️ کم مصالحہ (ہلکی مرچ)", labelEn: "Mild Spicy", category: "curry" },
      { id: "curry_lemon", labelUr: "🍋 لیموں و ادرک ساتھ", labelEn: "Extra Lemon & Ginger", category: "curry" }
    );
  }

  // 5. Lassi / Beverages detection
  const hasDrink = /lassi|drink|cold drink|water|sprite|coke|لسی|شربت|پانی/i.test(cartText);
  if (hasDrink) {
    options.push(
      { id: "drink_extra_ice", labelUr: "🧊 زیادہ برف", labelEn: "Extra Ice", category: "drink" },
      { id: "drink_no_ice", labelUr: "🚫 بغیر برف", labelEn: "No Ice", category: "drink" },
      { id: "drink_sweet", labelUr: "🍯 میٹھی لسی", labelEn: "Sweet Lassi", category: "drink" },
      { id: "drink_namkeen", labelUr: "🧂 نمکین لسی", labelEn: "Namkeen Lassi", category: "drink" }
    );
  }

  // 6. Packing & General
  options.push(
    { id: "takeaway_pack", labelUr: "📦 پارسل / پیکنگ", labelEn: "Takeaway Packing", category: "general" },
    { id: "extra_cutlery", labelUr: "🍽️ برتن و چمچ", labelEn: "Extra Cutlery", category: "general" }
  );

  return options;
}

/**
 * Intelligent Recommender: Selects active, available menu items that best complement the user's cart
 */
function getSmartMenuUpsells(menu: MenuItem[] = [], cart: CartItem[] = []): MenuItem[] {
  if (!menu || menu.length === 0) return [];

  // Exclude items already in cart and unavailable items
  const cartIds = new Set(cart.map((i) => i.id));
  const candidates = menu.filter((m) => m.isAvailable !== false && !cartIds.has(m.id));
  if (candidates.length === 0) return [];

  const cartText = cart
    .map((i) => `${i.name} ${i.description || ""} ${i.name}`)
    .join(" ")
    .toLowerCase();

  const hasChai = /chai|tea|chaye|چائے|قہوہ|green tea|doodh patti|karak/i.test(cartText);
  const hasParatha = /paratha|lacha|roti|naan|پراٹھا|روٹی|نان/i.test(cartText);
  const hasEgg = /anda|egg|omelette|fry|half fry|chanay|چنے|انڈہ|آملیٹ|ناشتہ/i.test(cartText);
  const hasCurry = /karahi|chicken|gosht|mutton|handi|qeema|کڑاہی|قیمہ|سالن|مرغی/i.test(cartText);
  const hasDrink = /lassi|drink|cold drink|water|sprite|coke|لسی|شربت|پانی/i.test(cartText);

  const matched: MenuItem[] = [];

  // Helper to find and add candidate
  const findCandidate = (regex: RegExp) => {
    const found = candidates.find(
      (c) =>
        regex.test(`${c.name} ${c.description || ""} ${c.category || ""}`) &&
        !matched.some((m) => m.id === c.id)
    );
    if (found) matched.push(found);
  };

  // Rule 1: If user has Paratha/Egg but NO Chai -> Strongly recommend Chai from available menu
  if ((hasParatha || hasEgg) && !hasChai) {
    findCandidate(/chai|tea|chaye|چائے|karak|doodh patti/i);
  }

  // Rule 2: If user has Chai but NO Paratha/Egg -> Strongly recommend Paratha/Omelette
  if (hasChai && !hasParatha && !hasEgg) {
    findCandidate(/paratha|lacha|پراٹھا|roti/i);
    findCandidate(/anda|egg|omelette|آملیٹ/i);
  }

  // Rule 3: If user has Karahi/Curry but NO Roti/Naan -> Recommend Roti/Naan
  if (hasCurry && !hasParatha) {
    findCandidate(/roti|naan|روٹی|نان|paratha/i);
  }

  // Rule 4: If user has heavy food but NO beverage -> Recommend Lassi or Drink
  if ((hasCurry || hasEgg || hasParatha) && !hasDrink) {
    findCandidate(/lassi|لسی|drink|cold drink|شربت/i);
  }

  // Fallback: Fill up to 2 items with other available items
  for (const item of candidates) {
    if (matched.length >= 2) break;
    if (!matched.some((m) => m.id === item.id)) {
      matched.push(item);
    }
  }

  return matched.slice(0, 2);
}

export function DesktopCartSidebar({
  cart,
  cartTotal,
  guestName,
  ticketNo,
  seatingLabel,
  placing,
  menu = [],
  onAdd,
  onDec,
  onRemoveItem,
  onCheckout,
}: DesktopCartSidebarProps) {
  const { t, lang } = useLang();
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Dynamically calculate special requests based on cart items
  const dynamicPreferences = useMemo(() => getDynamicSpecialRequests(cart), [cart]);

  // Dynamically suggest upsells from real available database menu based on current cart
  const smartUpsells = useMemo(() => getSmartMenuUpsells(menu, cart), [menu, cart]);

  const toggleNote = (noteId: string) => {
    playTapSound();
    setSelectedNotes((prev) =>
      prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId]
    );
  };

  const handleCheckoutClick = () => {
    playOrderSuccessSound();
    onCheckout();
  };

  const displayToken = ticketNo
    ? ticketNo.startsWith("VIS-")
      ? `#${ticketNo.split("-")[1] || ticketNo}`
      : ticketNo
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="px-3.5 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70 shrink-0">
        <h2 className="text-xs sm:text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
          <ShoppingBag className="w-4 h-4 text-orange-600" />
          <span>{t.currentOrder || "Current Order"}</span>
          <span className="bg-orange-100 text-orange-800 text-[11px] px-2 py-0.2 rounded-full font-extrabold">
            {totalItems}
          </span>
        </h2>

        {/* Guest & Token info */}
        <div className="flex items-center gap-1.5 text-xs text-gray-700 font-bold bg-white px-2 py-0.5 rounded-lg border border-gray-200">
          <User className="w-3.5 h-3.5 text-orange-600" />
          <span className="truncate max-w-[90px]">{guestName || "Guest"}</span>
          {displayToken && (
            <span className="text-[10px] bg-orange-50 text-orange-700 px-1 rounded font-mono font-black">
              {displayToken}
            </span>
          )}
        </div>
      </div>

      {/* ── Scrollable Body Area ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3.5 py-2 divide-y divide-gray-100 no-scrollbar min-h-0 space-y-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-6 text-center select-none">
            <ShoppingBag className="w-10 h-10 stroke-1 text-gray-300 mb-1.5" />
            <p className="text-xs sm:text-sm font-extrabold text-gray-700">
              {t.cartEmpty || "Your cart is empty"}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5 max-w-[190px]">
              {t.tapItemsToAdd || "Tap items on the left to add"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Items List */}
            {cart.map((item) => (
              <div key={item.id} className="py-2 flex items-center justify-between gap-2 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <p className="text-xs sm:text-sm font-extrabold text-gray-900 truncate">
                      {item.name}
                    </p>
                    <span className="text-xs sm:text-sm font-extrabold text-gray-900 ml-2">
                      Rs. {item.price * item.quantity}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] text-gray-400 font-medium">
                      Rs. {item.price} {t.each || "each"}
                    </span>

                    {/* Micro Stepper & Delete */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            playTapSound();
                            onDec(item.id);
                          }}
                          className="w-5 h-5 rounded bg-white shadow-2xs flex items-center justify-center text-gray-700 hover:bg-gray-100 active:scale-90 transition cursor-pointer"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-extrabold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            playTapSound();
                            onAdd(item);
                          }}
                          className="w-5 h-5 rounded bg-orange-600 text-white shadow-2xs flex items-center justify-center hover:bg-orange-700 active:scale-90 transition cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          onRemoveItem(item.id);
                        }}
                        className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* ── Dynamic Product-Aware Kitchen Notes / Preference Chips ── */}
            {dynamicPreferences.length > 0 && (
              <div className="pt-2.5 pb-1">
                <p className="text-[11px] font-extrabold text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>{t.orderPreferences || "Order Preferences:"}</span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {t.kitchenNote || "Kitchen Note"}
                  </span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {dynamicPreferences.map((pref) => {
                    const active = selectedNotes.includes(pref.id);
                    return (
                      <button
                        key={pref.id}
                        type="button"
                        onClick={() => toggleNote(pref.id)}
                        className={`text-[10px] font-extrabold px-2 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                          active
                            ? "bg-orange-600 border-orange-600 text-white shadow-2xs"
                            : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {active && <Check className="w-2.5 h-2.5" />}
                        <span>{lang === "ur" || lang === "ps" || lang === "bal" || lang === "brh" || lang === "fa" || lang === "pa" || lang === "sd" ? pref.labelUr : pref.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Real Database Menu Upsell Recommendations ── */}
            {smartUpsells.length > 0 && (
              <div className="pt-2.5 pb-1">
                <p className="text-[11px] font-extrabold text-orange-700 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-orange-500" />
                  <span>{t.frequentlyAdded || "Frequently Added Together:"}</span>
                </p>
                <div className="space-y-1.5">
                  {smartUpsells.map((upsell) => (
                    <div
                      key={upsell.id}
                      className="flex items-center justify-between bg-orange-50/50 border border-orange-100 rounded-xl px-2.5 py-1.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {upsell.imageUrl ? (
                          <img
                            src={upsell.imageUrl}
                            alt={upsell.name}
                            className="w-7 h-7 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-bold shrink-0">
                            {upsell.category?.toLowerCase().includes("chai") ||
                            upsell.name.toLowerCase().includes("chai")
                              ? "☕"
                              : upsell.category?.toLowerCase().includes("paratha") ||
                                upsell.name.toLowerCase().includes("paratha")
                              ? "🫓"
                              : upsell.category?.toLowerCase().includes("drink") ||
                                upsell.name.toLowerCase().includes("lassi")
                              ? "🥤"
                              : "🍽️"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[11px] font-extrabold text-gray-900 truncate">
                            {upsell.name}
                          </p>
                          <p className="text-[10px] font-bold text-orange-700">Rs. {upsell.price}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          playTapSound();
                          onAdd(upsell);
                        }}
                        className="bg-white border border-orange-300 text-orange-700 hover:bg-orange-600 hover:text-white active:scale-90 text-[10px] font-black px-2.5 py-1 rounded-lg transition shadow-2xs cursor-pointer shrink-0"
                      >
                        + {t.addToCart || "Add"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Fixed Bottom Summary & Order CTA ──────── */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/90 shrink-0 space-y-2">
        {/* Bill Breakdown */}
        <div className="space-y-1 text-xs font-bold text-gray-600">
          <div className="flex justify-between">
            <span>{t.subtotalLabel || "Subtotal"}</span>
            <span>Rs. {cartTotal}</span>
          </div>
          <div className="flex justify-between text-[11px] text-emerald-700">
            <span>{t.taxAndService || "Tax & Service"}</span>
            <span>{t.free || "Free"}</span>
          </div>
          <div className="flex justify-between items-center text-sm sm:text-base font-black text-gray-900 pt-1 border-t border-gray-200">
            <span>{t.totalBillLabel || "Total Bill"}</span>
            <span className="text-orange-600 text-base sm:text-lg">Rs. {cartTotal}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCheckoutClick}
          disabled={placing || cart.length === 0}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-40 cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>
            {placing
              ? t.sendingOrder || "Sending Order..."
              : `${t.placeOrder || "Place Order"} • Rs. ${cartTotal}`}
          </span>
          {!placing && <ArrowRight className="w-4 h-4 rtl:rotate-180" />}
        </button>
      </div>
    </div>
  );
}

