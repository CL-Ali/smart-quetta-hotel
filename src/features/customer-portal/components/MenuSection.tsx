"use client";

import React, { useState, useMemo } from "react";
import {
  FaUtensils,
  FaMagnifyingGlass,
  FaList,
  FaTableCellsLarge,
  FaPlus,
  FaMinus,
  FaTrashCan,
  FaXmark,
  FaSpinner,
} from "react-icons/fa6";
import { MenuItem, CartItem } from "@/types/hotel";
import { useLang } from "@/contexts/LangContext";
import { playTapSound, playCartAddSound, unlockAudio } from "@/lib/sound";

interface MenuSectionProps {
  menu?: MenuItem[];
  isLoading: boolean;
  cart: CartItem[];
  onAdd: (item: MenuItem) => void;
  onDec: (id: number) => void;
  onRemoveItem?: (id: number) => void;
}

import { getAccurateItemImageByName } from "../utils/itemImage";
import { getItemDisplayName } from "../utils/itemTranslation";

function getAccurateItemImage(item: MenuItem): string {
  return getAccurateItemImageByName(item.name, item.imageUrl);
}

// Category Label Formatter
function formatCategoryLabel(cat: string, lang: string) {
  const lower = cat.toLowerCase();
  if (lower === "all") return lang === "ur" ? "تمام" : "All";
  if (lower.includes("chai") || lower.includes("tea") || lower.includes("drink")) {
    return lang === "ur" ? "چائے و مشروبات" : "Tea & Drinks";
  }
  if (lower.includes("paratha") || lower.includes("roti") || lower.includes("bread")) {
    return lang === "ur" ? "پراٹھا و نان" : "Paratha & Bread";
  }
  if (lower.includes("nashta") || lower.includes("breakfast") || lower.includes("puri")) {
    return lang === "ur" ? "ناشتہ" : "Breakfast";
  }
  if (lower.includes("karahi") || lower.includes("chicken") || lower.includes("meat") || lower.includes("curry") || lower.includes("salan")) {
    return lang === "ur" ? "کڑاہی و سالن" : "Curry & Meals";
  }
  if (lower.includes("snack") || lower.includes("samosa") || lower.includes("pakora")) {
    return lang === "ur" ? "سنیکس" : "Snacks";
  }
  if (lower.includes("food") || lower.includes("dish") || lower.includes("general") || lower.includes("main")) {
    return lang === "ur" ? "کھانے" : "Food";
  }
  if (lower.includes("sweet") || lower.includes("mithai") || lower.includes("dessert") || lower.includes("halwa")) {
    return lang === "ur" ? "میٹھی ڈش" : "Dessert";
  }
  if (lower.includes("rice") || lower.includes("biryani") || lower.includes("pulao")) {
    return lang === "ur" ? "چاول" : "Rice";
  }
  return cat;
}

// Clean Minimal Badge
function getItemBadge(name: string, lang: string): { text: string; bg: string } | null {
  const lower = name.toLowerCase();
  if (lower.includes("chai") || lower.includes("doodh patti") || lower.includes("karak")) {
    return {
      text: lang === "ur" ? "مقبول" : "Bestseller",
      bg: "bg-amber-500 text-stone-950 font-bold",
    };
  }
  if (lower.includes("paratha") || lower.includes("anda")) {
    return {
      text: lang === "ur" ? "خاص" : "Popular",
      bg: "bg-stone-900 dark:bg-white text-white dark:text-zinc-950 font-semibold",
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
    unlockAudio();
    playCartAddSound();
    onAdd(item);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200/80 dark:border-zinc-800">
        <FaSpinner className="animate-spin h-7 w-7 text-amber-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2">
      {/* ── Compact Search Bar & Filter Chips ─────────── */}
      <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-stone-200/70 dark:border-zinc-800 shadow-2xs flex flex-col gap-2.5 shrink-0">
        {/* Search Input */}
        <div className="relative flex items-center">
          <FaMagnifyingGlass className="w-3.5 h-3.5 text-stone-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchFoodPlaceholder || "Search food, tea, breakfast..."}
            className="w-full pl-9 pr-8 py-1.5 bg-stone-100 dark:bg-zinc-800/90 focus:bg-white dark:focus:bg-zinc-800 border border-stone-200/60 dark:border-zinc-700/60 focus:border-amber-500 dark:focus:border-amber-500 rounded-full text-xs text-stone-900 dark:text-white placeholder:text-stone-400 transition-all focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
            >
              <FaXmark className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Chips + Mobile View Mode Switcher */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 py-0.5">
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
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer select-none active:scale-95 flex items-center gap-1 ${
                    isSelected
                      ? cat === "all"
                        ? "bg-stone-900 text-white dark:bg-white dark:text-stone-950 font-bold shadow-2xs"
                        : "bg-amber-500 text-stone-950 font-bold shadow-2xs"
                      : "bg-stone-100 dark:bg-zinc-800/90 text-stone-600 dark:text-zinc-300 hover:bg-stone-200/80 border border-stone-200/70 dark:border-zinc-700/70"
                  }`}
                >
                  <span>{formatCategoryLabel(cat, lang)}</span>
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle (Mobile) */}
          <div className="flex sm:hidden items-center border border-stone-200/80 dark:border-zinc-700 rounded-full p-0.5 bg-stone-100 dark:bg-zinc-800 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1 rounded-full transition cursor-pointer ${
                viewMode === "list"
                  ? "bg-white dark:bg-zinc-900 shadow-xs text-stone-900 dark:text-white font-bold"
                  : "text-stone-400"
              }`}
              title="List View"
            >
              <FaList className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded-full transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white dark:bg-zinc-900 shadow-xs text-stone-900 dark:text-white font-bold"
                  : "text-stone-400"
              }`}
              title="Grid View"
            >
              <FaTableCellsLarge className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Menu List & Grid Viewport ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pr-0.5 min-h-0 no-scrollbar pb-24 lg:pb-4">
        {/* 1. Mobile List Mode: Compact Minimalist Material 3 List Cards */}
        {viewMode === "list" && (
          <div className="space-y-2.5 sm:hidden">
            {filteredMenu.map((item) => {
              const qty = getQty(item.id);
              const isSelected = qty > 0;
              const badge = getItemBadge(item.name, lang);
              const accurateImg = getAccurateItemImage(item);
              const displayName = getItemDisplayName(item.name, lang);

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemTap(item)}
                  className={`bg-white dark:bg-zinc-900 rounded-2xl border p-3 flex items-center justify-between gap-3 transition-all select-none shadow-2xs hover:shadow-xs active:scale-[0.99] cursor-pointer ${
                    isSelected
                      ? "border-amber-500/60 bg-amber-500/[0.03] dark:bg-amber-950/20"
                      : "border-stone-200/70 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700"
                  }`}
                >
                  {/* Left: Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-stone-100 dark:bg-zinc-800 overflow-hidden relative border border-stone-200/60 dark:border-zinc-700/60 shrink-0">
                    <img
                      src={accurateImg}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Middle: Details (Title, Tiny Bestseller Tag, Price) */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="font-bold text-stone-900 dark:text-white text-sm truncate leading-snug">
                      {displayName}
                    </h4>

                    {/* Tiny Bestseller / Popular Tag */}
                    {badge && (
                      <div className="flex items-center">
                        <span className="text-[9px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-800/60 px-1.5 py-0.2 rounded-md">
                          ★ {badge.text}
                        </span>
                      </div>
                    )}

                    <div className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400 pt-0.5">
                      Rs. {item.price}
                    </div>
                  </div>

                  {/* Right: Modern Stepper / Add Pill */}
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    {isSelected ? (
                      <div className="h-8 bg-stone-900 dark:bg-white text-white dark:text-stone-950 rounded-xl px-1.5 py-0.5 flex items-center gap-1.5 shadow-xs border border-stone-800 dark:border-stone-200">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playTapSound();
                            if (qty === 1 && onRemoveItem) {
                              onRemoveItem(item.id);
                            } else {
                              onDec(item.id);
                            }
                          }}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-stone-300 hover:text-white dark:text-stone-700 dark:hover:text-stone-950 hover:bg-white/10 dark:hover:bg-stone-100 transition active:scale-90 cursor-pointer"
                          title={qty === 1 ? "Remove" : "Decrease"}
                        >
                          {qty === 1 ? (
                            <FaTrashCan className="w-2.5 h-2.5 text-red-400 dark:text-red-500" />
                          ) : (
                            <FaMinus className="w-2.5 h-2.5" />
                          )}
                        </button>
                        <span className="min-w-[18px] text-center text-xs font-mono font-black text-amber-400 dark:text-amber-600">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            unlockAudio();
                            playCartAddSound();
                            onAdd(item);
                          }}
                          className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center justify-center transition active:scale-90 cursor-pointer shadow-2xs"
                          title="Increase"
                        >
                          <FaPlus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          unlockAudio();
                          playCartAddSound();
                          onAdd(item);
                        }}
                        className="h-8 px-3.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <FaPlus className="w-2.5 h-2.5" />
                        <span>{t.addToCart || "Add"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. Grid Mode (Desktop & 2-Column Grid): Compact Minimalist Material 3 */}
        <div
          className={`${
            viewMode === "list" ? "hidden sm:grid" : "grid"
          } grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5`}
        >
          {filteredMenu.map((item) => {
            const qty = getQty(item.id);
            const isSelected = qty > 0;
            const badge = getItemBadge(item.name, lang);
            const accurateImg = getAccurateItemImage(item);
            const displayName = getItemDisplayName(item.name, lang);

            return (
              <div
                key={item.id}
                onClick={() => handleItemTap(item)}
                className={`group bg-white dark:bg-zinc-900 rounded-2xl border transition-all flex flex-col overflow-hidden select-none cursor-pointer text-left shadow-2xs hover:shadow-xs active:scale-[0.99] ${
                  isSelected
                    ? "border-amber-500/60 bg-amber-500/[0.04] dark:bg-amber-950/15"
                    : "border-stone-200/70 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700"
                }`}
              >
                {/* Image Section */}
                <div className="h-24 sm:h-26 w-full bg-stone-100 dark:bg-zinc-800 relative overflow-hidden shrink-0">
                  <img
                    src={accurateImg}
                    alt={displayName}
                    className="w-full h-full object-cover group-hover:scale-102 transition duration-200"
                    loading="lazy"
                  />
                </div>

                {/* Compact Content & Action Section */}
                <div className="p-2.5 flex flex-col justify-between flex-1 bg-white dark:bg-zinc-900 gap-2">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-bold text-stone-900 dark:text-white text-xs sm:text-sm truncate">
                        {displayName}
                      </h3>
                      {badge && (
                        <span className="text-[8px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-800/60 px-1 py-0.2 rounded shrink-0">
                          ★ {badge.text}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & Action Row */}
                  <div className="pt-1.5 border-t border-stone-100 dark:border-zinc-800/80 flex items-center justify-between gap-1.5 mt-auto">
                    <span className="font-mono font-bold text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                      Rs. {item.price}
                    </span>

                    <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                      {isSelected ? (
                        <div className="h-6.5 bg-stone-900 dark:bg-white text-white dark:text-stone-950 rounded-lg px-1 flex items-center gap-1 shadow-2xs border border-stone-800 dark:border-stone-200">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playTapSound();
                              if (qty === 1 && onRemoveItem) {
                                onRemoveItem(item.id);
                              } else {
                                onDec(item.id);
                              }
                            }}
                            className="w-4.5 h-4.5 rounded flex items-center justify-center text-stone-300 hover:text-white dark:text-stone-700 transition cursor-pointer"
                            title={qty === 1 ? "Remove" : "Decrease"}
                          >
                            {qty === 1 ? (
                              <FaTrashCan className="w-2 h-2 text-red-400" />
                            ) : (
                              <FaMinus className="w-2 h-2" />
                            )}
                          </button>
                          <span className="min-w-[14px] text-center text-xs font-mono font-black text-amber-400 dark:text-amber-600">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              unlockAudio();
                              playCartAddSound();
                              onAdd(item);
                            }}
                            className="w-4.5 h-4.5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center transition cursor-pointer shadow-2xs"
                            title="Increase"
                          >
                            <FaPlus className="w-2 h-2" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            unlockAudio();
                            playCartAddSound();
                            onAdd(item);
                          }}
                          className="h-6.5 px-2 rounded-lg bg-amber-500 hover:bg-amber-400 font-bold text-xs text-stone-950 transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                        >
                          <FaPlus className="w-2 h-2" />
                          <span>{t.addToCart || "Add"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredMenu.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-stone-400">
            <FaUtensils className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
              No matching items found
            </p>
            <p className="text-xs mt-0.5">Try searching for something else or reset filter</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="mt-3 px-4 py-1.5 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 rounded-full text-xs font-semibold transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
