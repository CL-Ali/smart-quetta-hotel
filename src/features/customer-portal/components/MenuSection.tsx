"use client";

import React, { useState, useMemo } from "react";
import {
  Loader2,
  Utensils,
  Search,
  LayoutGrid,
  List,
  Flame,
  Sparkles,
  Trash2,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { MenuItem, CartItem } from "@/types/hotel";
import { useLang } from "@/contexts/LangContext";
import { playTapSound } from "@/lib/sound";

interface MenuSectionProps {
  menu?: MenuItem[];
  isLoading: boolean;
  cart: CartItem[];
  onAdd: (item: MenuItem) => void;
  onDec: (id: number) => void;
  onRemoveItem?: (id: number) => void;
}

// Cultural & Urdu Category Mapper
function formatCategoryLabel(cat: string, lang: string) {
  const lower = cat.toLowerCase();
  if (lower === "all") return "🌟 " + (lang === "ur" ? "سب مینو" : "All Menu");
  if (lower.includes("chai") || lower.includes("tea") || lower.includes("drink")) {
    return "☕ " + (lang === "ur" ? "چائے و مشروبات" : "Chai & Drinks");
  }
  if (lower.includes("paratha") || lower.includes("roti") || lower.includes("bread")) {
    return "🫓 " + (lang === "ur" ? "پراٹھے و روٹی" : "Parathas & Breads");
  }
  if (lower.includes("nashta") || lower.includes("breakfast") || lower.includes("puri")) {
    return "🍳 " + (lang === "ur" ? "تازہ ناشتہ" : "Fresh Breakfast");
  }
  if (lower.includes("karahi") || lower.includes("chicken") || lower.includes("meat")) {
    return "🍗 " + (lang === "ur" ? "کڑاہی و سالن" : "Karahi & Dishes");
  }
  if (lower.includes("snack") || lower.includes("samosa") || lower.includes("pakora")) {
    return "🥟 " + (lang === "ur" ? "سموسے و پکوڑے" : "Snacks & Samosa");
  }
  if (lower.includes("food")) {
    return "🍲 " + (lang === "ur" ? "کھانے و سالن" : "Hot Food");
  }
  return "🍽️ " + cat;
}

// Psychology Bestseller / Special Tag Detector
function getItemBadge(name: string, lang: string): { text: string; bg: string; icon: any } | null {
  const lower = name.toLowerCase();
  if (lower.includes("chai") || lower.includes("doodh patti")) {
    return {
      text: lang === "ur" ? "مقبول ترین" : "Bestseller",
      bg: "bg-amber-600 text-white shadow-xs",
      icon: Flame,
    };
  }
  if (lower.includes("paratha") || lower.includes("anda")) {
    return {
      text: lang === "ur" ? "گرم و خستہ" : "Hot & Crispy",
      bg: "bg-orange-600 text-white shadow-xs",
      icon: Sparkles,
    };
  }
  if (lower.includes("lassi") || lower.includes("halwa")) {
    return {
      text: lang === "ur" ? "ہوٹل اسپیشل" : "Chef Special",
      bg: "bg-emerald-600 text-white shadow-xs",
      icon: Sparkles,
    };
  }
  return null;
}

export function MenuSection({
  menu = [],
  isLoading,
  cart,
  onAdd,
  onDec,
  onRemoveItem,
}: MenuSectionProps) {
  const { t, lang } = useLang();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const getQty = (id: number) => cart.find((c) => c.id === id)?.quantity ?? 0;

  // Extract distinct categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    menu.forEach((item) => {
      if (item.category) {
        cats.add(item.category);
      }
    });
    return ["all", ...Array.from(cats)];
  }, [menu]);

  // Filter items
  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const matchesCat =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [menu, selectedCategory, searchQuery]);

  const handleItemTap = (item: MenuItem) => {
    playTapSound();
    onAdd(item);
  };

  const handleBulkAdd = (item: MenuItem, count: number, e: React.MouseEvent) => {
    e.stopPropagation();
    playTapSound();
    for (let i = 0; i < count; i++) {
      onAdd(item);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white/50 rounded-3xl border border-stone-200">
        <Loader2 className="animate-spin h-9 w-9 text-amber-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2.5">
      {/* ── Material 3 Elevated Category Chips & Search Bar ─────────── */}
      <div className="bg-white dark:bg-zinc-900 p-2.5 sm:p-3 rounded-3xl border border-stone-200/90 dark:border-zinc-800 shadow-xs flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* M3 Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 pb-0.5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setSelectedCategory(cat);
                  }}
                  className={`px-3.5 py-1.5 rounded-2xl text-xs sm:text-sm font-black shrink-0 transition-all flex items-center gap-1 cursor-pointer select-none active:scale-95 ${
                    isSelected
                      ? "bg-amber-500 text-stone-950 shadow-sm shadow-amber-500/30 scale-[1.02] border border-amber-400 font-extrabold"
                      : "bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 border border-transparent"
                  }`}
                >
                  <span>{formatCategoryLabel(cat, lang)}</span>
                </button>
              );
            })}
          </div>

          {/* View Switcher (List vs Grid on Mobile) */}
          <div className="flex sm:hidden items-center border border-stone-200 dark:border-zinc-700 rounded-xl p-0.5 bg-stone-50 dark:bg-zinc-800 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "list"
                  ? "bg-white dark:bg-zinc-900 shadow-2xs text-stone-900 dark:text-white"
                  : "text-stone-400"
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "grid"
                  ? "bg-white dark:bg-zinc-900 shadow-2xs text-stone-900 dark:text-white"
                  : "text-stone-400"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* M3 Rounded Pill Search Bar */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchFoodPlaceholder || "Search food or tea..."}
            className="w-full pl-9 pr-9 py-2 bg-stone-100/90 dark:bg-zinc-800/90 hover:bg-stone-100 focus:bg-white dark:focus:bg-zinc-900 border border-stone-200 dark:border-zinc-700 focus:border-amber-500 rounded-2xl text-xs sm:text-sm text-stone-900 dark:text-white placeholder:text-stone-400 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── FAST ORDER MENU ITEMS ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pr-0.5 min-h-0 no-scrollbar pb-20 lg:pb-2">
        {/* 1. Mobile Fast List Mode (Ultra-Fast 1-Thumb Ergonomics) */}
        {viewMode === "list" && (
          <div className="space-y-2 sm:hidden">
            {filteredMenu.map((item) => {
              const qty = getQty(item.id);
              const isSelected = qty > 0;
              const badge = getItemBadge(item.name, lang);

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemTap(item)}
                  className={`bg-white dark:bg-zinc-900 rounded-3xl border p-2.5 flex items-center justify-between gap-3 transition-all active:scale-[0.98] select-none shadow-2xs ${
                    isSelected
                      ? "border-amber-500 ring-2 ring-amber-500/25 bg-amber-50/30 dark:bg-amber-950/20"
                      : "border-stone-200/90 dark:border-zinc-800 hover:border-stone-300"
                  }`}
                >
                  {/* Thumbnail & Title */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-zinc-800 overflow-hidden shrink-0 relative border border-stone-200/60 dark:border-zinc-700">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-amber-50/60 text-amber-500">
                          <Utensils className="w-6 h-6 opacity-50" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-0 right-0 bg-amber-600 text-white font-black text-[11px] w-5 h-5 rounded-bl-xl flex items-center justify-center shadow-xs">
                          {qty}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-black text-stone-900 dark:text-white text-xs sm:text-sm line-clamp-1 leading-tight">
                          {item.name}
                        </h4>
                        {badge && (
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${badge.bg}`}>
                            {badge.text}
                          </span>
                        )}
                      </div>
                      <p className="font-mono font-black text-sm text-amber-600 dark:text-amber-400 mt-0.5">
                        Rs. {item.price}
                      </p>
                    </div>
                  </div>

                  {/* Quantity Stepper with Delete icon when in cart, or 1-Tap Quick Multipliers */}
                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isSelected ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center border border-amber-300 dark:border-amber-700 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playTapSound();
                              onDec(item.id);
                            }}
                            className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 shadow-2xs flex items-center justify-center text-stone-800 dark:text-stone-200 hover:bg-stone-100 active:scale-90 transition cursor-pointer font-black text-sm"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center text-xs font-black text-amber-950 dark:text-amber-200 font-mono">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playTapSound();
                              onAdd(item);
                            }}
                            className="w-8 h-8 rounded-xl bg-amber-600 text-white shadow-2xs flex items-center justify-center hover:bg-amber-700 active:scale-90 transition cursor-pointer font-black text-sm"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* 1-Tap Delete / Trash Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playTapSound();
                            onRemoveItem ? onRemoveItem(item.id) : onDec(item.id);
                          }}
                          className="w-8 h-8 rounded-2xl bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 transition flex items-center justify-center cursor-pointer active:scale-90 shadow-2xs"
                          title="Remove item from cart"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleBulkAdd(item, 1, e)}
                          className="px-3 py-2 rounded-2xl bg-stone-100 dark:bg-zinc-800 hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-black active:scale-90 font-black text-xs text-stone-800 dark:text-stone-200 transition cursor-pointer"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleBulkAdd(item, 2, e)}
                          className="px-3 py-2 rounded-2xl bg-stone-100 dark:bg-zinc-800 hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-black active:scale-90 font-black text-xs text-stone-800 dark:text-stone-200 transition cursor-pointer"
                        >
                          +2
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleBulkAdd(item, 5, e)}
                          className="px-3 py-2 rounded-2xl bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-600 hover:text-white active:scale-90 font-black text-xs text-amber-800 dark:text-amber-300 transition cursor-pointer border border-amber-200/60 dark:border-amber-800/40"
                        >
                          +5
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. Desktop Grid / Mobile Optional Grid Mode (M3 Elevated Food Cards) */}
        <div
          className={`${
            viewMode === "list" ? "hidden sm:grid" : "grid"
          } grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-3.5`}
        >
          {filteredMenu.map((item) => {
            const qty = getQty(item.id);
            const isSelected = qty > 0;
            const badge = getItemBadge(item.name, lang);

            return (
              <div
                key={item.id}
                onClick={() => handleItemTap(item)}
                className={`group bg-white dark:bg-zinc-900 rounded-3xl border transition-all flex flex-col overflow-hidden relative select-none cursor-pointer text-left shadow-2xs active:scale-[0.97] hover:shadow-lg ${
                  isSelected
                    ? "border-amber-500 ring-2 ring-amber-500/25 bg-amber-50/20 dark:bg-amber-950/20"
                    : "border-stone-200/90 dark:border-zinc-800 hover:border-amber-300"
                }`}
              >
                {/* Photo Section */}
                <div className="aspect-16/10 w-full bg-stone-100 dark:bg-zinc-800 relative overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-amber-50/40 dark:bg-amber-950/20 text-amber-500">
                      <Utensils className="w-8 h-8 opacity-40" />
                    </div>
                  )}

                  {/* Marketing Badge */}
                  {badge && (
                    <div className={`absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-lg shadow-xs ${badge.bg}`}>
                      {badge.text}
                    </div>
                  )}

                  {/* Counter Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-amber-600 text-white font-black text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-75 font-mono">
                      {qty}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-3 flex-1 flex flex-col justify-between bg-white dark:bg-zinc-900">
                  <div>
                    <h3 className="font-extrabold text-stone-900 dark:text-white text-xs sm:text-sm line-clamp-1 leading-tight">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono font-black text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                        Rs. {item.price}
                      </span>
                      {item.category && (
                        <span className="text-[10px] font-bold text-stone-400 dark:text-zinc-400 truncate max-w-[80px]">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stepper with Delete Icon or Bulk Multipliers */}
                  <div
                    className="mt-2.5 pt-2 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isSelected ? (
                      <div className="flex items-center gap-1 w-full">
                        <div className="flex items-center border border-amber-300 dark:border-amber-700 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 p-0.5 flex-1 justify-between shadow-2xs">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playTapSound();
                              onDec(item.id);
                            }}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-800 shadow-2xs flex items-center justify-center text-stone-800 dark:text-stone-200 hover:bg-stone-100 active:scale-90 transition cursor-pointer font-black text-xs"
                            title="Decrease"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-xs font-black text-amber-950 dark:text-amber-200 font-mono">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playTapSound();
                              onAdd(item);
                            }}
                            className="w-6 h-6 rounded-lg bg-amber-600 text-white shadow-2xs flex items-center justify-center hover:bg-amber-700 active:scale-90 transition cursor-pointer font-black text-xs"
                            title="Increase"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        {/* Delete / Trash Icon */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playTapSound();
                            onRemoveItem ? onRemoveItem(item.id) : onDec(item.id);
                          }}
                          className="w-7 h-7 rounded-xl bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 transition flex items-center justify-center cursor-pointer active:scale-90 shrink-0 shadow-2xs"
                          title="Delete from cart"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleBulkAdd(item, 1, e)}
                          className="flex-1 py-1 rounded-xl bg-stone-100 dark:bg-zinc-800 hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-black active:scale-90 font-extrabold text-[11px] text-stone-800 dark:text-stone-200 transition cursor-pointer text-center"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleBulkAdd(item, 2, e)}
                          className="flex-1 py-1 rounded-xl bg-stone-100 dark:bg-zinc-800 hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-black active:scale-90 font-extrabold text-[11px] text-stone-800 dark:text-stone-200 transition cursor-pointer text-center"
                        >
                          +2
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleBulkAdd(item, 5, e)}
                          className="flex-1 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-600 hover:text-white active:scale-90 font-extrabold text-[11px] text-amber-800 dark:text-amber-300 transition cursor-pointer text-center border border-amber-200/50"
                        >
                          +5
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredMenu.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200 dark:border-zinc-800 text-stone-400">
            <Utensils className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-500" />
            <p className="text-xs sm:text-sm font-extrabold text-stone-700 dark:text-zinc-300">
              {t.noPastOrders || "No items found"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
