"use client";

import React, { useState, useMemo } from "react";
import {
  Loader2,
  Utensils,
  Search,
  LayoutGrid,
  List,
  Trash2,
  Minus,
  Plus,
  X,
} from "lucide-react";
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

// Cultural & Urdu Category Mapper
function formatCategoryLabel(cat: string, lang: string) {
  const lower = cat.toLowerCase();
  if (lower === "all") return lang === "ur" ? "سب مینو" : "All Items";
  if (lower.includes("chai") || lower.includes("tea") || lower.includes("drink")) {
    return lang === "ur" ? "چائے و مشروبات" : "Chai & Drinks";
  }
  if (lower.includes("paratha") || lower.includes("roti") || lower.includes("bread")) {
    return lang === "ur" ? "پراٹھے و نان" : "Parathas & Breads";
  }
  if (lower.includes("nashta") || lower.includes("breakfast") || lower.includes("puri")) {
    return lang === "ur" ? "تازہ ناشتہ" : "Breakfast";
  }
  if (lower.includes("karahi") || lower.includes("chicken") || lower.includes("meat") || lower.includes("curry") || lower.includes("salan")) {
    return lang === "ur" ? "کڑاہی و سالن" : "Karahi & Curries";
  }
  if (lower.includes("snack") || lower.includes("samosa") || lower.includes("pakora")) {
    return lang === "ur" ? "سموسے و سنیکس" : "Snacks & Samosa";
  }
  if (lower.includes("food") || lower.includes("dish") || lower.includes("general") || lower.includes("main")) {
    return lang === "ur" ? "کھانا و طعام" : "Food & Meals";
  }
  if (lower.includes("sweet") || lower.includes("mithai") || lower.includes("dessert") || lower.includes("halwa")) {
    return lang === "ur" ? "میٹھی ڈش" : "Sweets & Dessert";
  }
  if (lower.includes("rice") || lower.includes("biryani") || lower.includes("pulao")) {
    return lang === "ur" ? "بریانی و چاول" : "Biryani & Rice";
  }
  return cat;
}

// Subtle Bestseller / Chef Special badge
function getItemBadge(name: string, lang: string): { text: string; bg: string; icon?: string } | null {
  const lower = name.toLowerCase();
  if (lower.includes("chai") || lower.includes("doodh patti") || lower.includes("karak")) {
    return {
      text: lang === "ur" ? "مقبول ترین" : "Bestseller",
      bg: "bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-400/40 dark:border-amber-700/50",
      icon: "🔥",
    };
  }
  if (lower.includes("paratha") || lower.includes("anda")) {
    return {
      text: lang === "ur" ? "تازہ تیار" : "Popular",
      bg: "bg-orange-500/15 text-orange-900 dark:text-orange-200 border border-orange-400/40 dark:border-orange-700/50",
      icon: "⭐",
    };
  }
  if (lower.includes("lassi") || lower.includes("halwa")) {
    return {
      text: lang === "ur" ? "خاص ڈش" : "Special",
      bg: "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border border-emerald-400/40 dark:border-emerald-700/50",
      icon: "✨",
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
      <div className="flex justify-center items-center h-64 bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-stone-200 dark:border-zinc-800">
        <Loader2 className="animate-spin h-8 w-8 text-amber-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-1.5">
      {/* ── Compact Category Filter Bar & Search ─────────── */}
      <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-stone-200/80 dark:border-zinc-800 shadow-2xs flex flex-col gap-1.5 shrink-0">
        <div className="flex items-center justify-between gap-1.5">
          {/* Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 pb-0.5">
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
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer select-none active:scale-95 ${
                    isSelected
                      ? "bg-stone-900 text-white dark:bg-amber-500 dark:text-stone-950 shadow-xs font-black"
                      : "bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  <span>{formatCategoryLabel(cat, lang)}</span>
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle (Mobile only) */}
          <div className="flex sm:hidden items-center border border-stone-200 dark:border-zinc-700 rounded-lg p-0.5 bg-stone-50 dark:bg-zinc-800 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1 rounded transition ${
                viewMode === "list"
                  ? "bg-white dark:bg-zinc-900 shadow-2xs text-stone-900 dark:text-white"
                  : "text-stone-400"
              }`}
              title="List View"
            >
              <List className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded transition ${
                viewMode === "grid"
                  ? "bg-white dark:bg-zinc-900 shadow-2xs text-stone-900 dark:text-white"
                  : "text-stone-400"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Compact Search Bar */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchFoodPlaceholder || "Search food or tea..."}
            className="w-full pl-8 pr-8 py-1.5 bg-stone-50 dark:bg-zinc-800/90 focus:bg-white dark:focus:bg-zinc-900 border border-stone-200 dark:border-zinc-700 focus:border-amber-500 rounded-lg text-xs text-stone-900 dark:text-white placeholder:text-stone-400 transition-all focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── Menu List & Grid Container ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pr-0.5 min-h-0 no-scrollbar pb-24 lg:pb-4">
        {/* 1. Mobile Compact List Mode (Clean, Scannable & Ergonomic UX) */}
        {viewMode === "list" && (
          <div className="space-y-1.5 sm:hidden">
            {filteredMenu.map((item) => {
              const qty = getQty(item.id);
              const isSelected = qty > 0;
              const badge = getItemBadge(item.name, lang);

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemTap(item)}
                  className={`bg-white dark:bg-zinc-900 rounded-xl border p-2 flex items-center justify-between gap-2 transition active:scale-[0.99] select-none shadow-2xs ${
                    isSelected
                      ? "border-stone-900 dark:border-amber-500 bg-stone-50/70 dark:bg-zinc-800/60 shadow-xs"
                      : "border-stone-200/80 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-700"
                  }`}
                >
                  {/* Left: Food Info & Details */}
                  <div className="min-w-0 flex-1 space-y-0.5 pr-1">
                    {badge && (
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-md ${badge.bg}`}>
                        {badge.icon && <span>{badge.icon}</span>}
                        <span>{badge.text}</span>
                      </span>
                    )}

                    <h4 className="font-bold text-stone-900 dark:text-white text-xs sm:text-sm line-clamp-1 leading-tight">
                      {item.name}
                    </h4>

                    <p className="font-mono font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 leading-tight">
                      Rs. {item.price}
                    </p>

                    {item.description && (
                      <p className="text-[10px] text-stone-400 dark:text-zinc-400 line-clamp-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Right: Appetizing Photo & Compact Button / Stepper */}
                  <div
                    className="flex flex-col items-center shrink-0 relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-18 h-18 rounded-xl bg-stone-100 dark:bg-zinc-800 overflow-hidden relative border border-stone-200/80 dark:border-zinc-700/80 shadow-2xs">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-stone-50 dark:bg-zinc-800 text-stone-400">
                          <Utensils className="w-5 h-5 opacity-40" />
                        </div>
                      )}

                      {/* Top Quantity Pill on image */}
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-stone-950/90 text-amber-400 font-mono font-bold text-[9px] px-1 py-0.2 rounded border border-amber-500/40">
                          ×{qty}
                        </div>
                      )}
                    </div>

                    {/* Compact Action Button / Stepper (Overlaps bottom of photo) */}
                    <div className="-mt-3 relative z-10 shadow-sm rounded-xl">
                      {isSelected ? (
                        <div className="flex items-center gap-0.5 bg-stone-950 dark:bg-amber-500 text-white dark:text-stone-950 rounded-xl p-0.5 border border-stone-800 dark:border-amber-400 shadow-md">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playTapSound();
                              onDec(item.id);
                            }}
                            className="w-5 h-5 rounded-lg bg-stone-800 dark:bg-amber-600 hover:bg-stone-700 text-white dark:text-stone-950 flex items-center justify-center transition active:scale-90 cursor-pointer font-bold"
                            title="Decrease"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-4 text-center text-[11px] font-bold font-mono">
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
                            className="w-5 h-5 rounded-lg bg-stone-800 dark:bg-amber-600 hover:bg-stone-700 text-white dark:text-stone-950 flex items-center justify-center transition active:scale-90 cursor-pointer font-bold"
                            title="Increase"
                          >
                            <Plus className="w-2.5 h-2.5" />
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
                          className="h-6 px-2.5 bg-white dark:bg-zinc-800 hover:bg-stone-950 hover:text-white dark:hover:bg-amber-500 dark:hover:text-stone-950 text-stone-800 dark:text-stone-200 font-bold text-[11px] rounded-xl border border-stone-200 dark:border-zinc-700 shadow-2xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer uppercase tracking-wider"
                        >
                          <Plus className="w-2.5 h-2.5 stroke-[2.5]" />
                          <span>{t.addToCart || "Add"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. Desktop Grid / Mobile Optional Grid Mode */}
        <div
          className={`${
            viewMode === "list" ? "hidden sm:grid" : "grid"
          } grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-3`}
        >
          {filteredMenu.map((item) => {
            const qty = getQty(item.id);
            const isSelected = qty > 0;
            const badge = getItemBadge(item.name, lang);

            return (
              <div
                key={item.id}
                onClick={() => handleItemTap(item)}
                className={`group bg-white dark:bg-zinc-900 rounded-2xl border transition-all flex flex-col overflow-hidden relative select-none cursor-pointer text-left shadow-2xs active:scale-[0.98] hover:border-stone-400 ${
                  isSelected
                    ? "border-stone-900 dark:border-amber-500 bg-stone-50/70 dark:bg-zinc-800/60 shadow-xs"
                    : "border-stone-200/80 dark:border-zinc-800"
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
                    <div className="w-full h-full flex items-center justify-center bg-stone-50 dark:bg-zinc-800 text-stone-400">
                      <Utensils className="w-6 h-6 opacity-40" />
                    </div>
                  )}

                  {/* Subtle Marketing Badge */}
                  {badge && (
                    <div className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.2 rounded-md shadow-xs ${badge.bg}`}>
                      {badge.text}
                    </div>
                  )}

                  {/* Quantity Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 font-bold text-xs w-5 h-5 rounded-md flex items-center justify-center shadow-md font-mono">
                      {qty}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-2.5 flex-1 flex flex-col justify-between bg-white dark:bg-zinc-900">
                  <div>
                    <h3 className="font-bold text-stone-900 dark:text-white text-xs sm:text-sm line-clamp-1 leading-tight">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                        Rs. {item.price}
                      </span>
                      {item.category && (
                        <span className="text-[10px] font-medium text-stone-400 dark:text-zinc-400 truncate max-w-[80px]">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Row */}
                  <div
                    className="mt-2 pt-1.5 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isSelected ? (
                      <div className="flex items-center gap-1 w-full">
                        <div className="flex items-center border border-stone-200 dark:border-zinc-700 rounded-xl bg-stone-50 dark:bg-zinc-800 p-0.5 flex-1 justify-between shadow-2xs">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playTapSound();
                              onDec(item.id);
                            }}
                            className="w-5 h-5 rounded-lg bg-white dark:bg-zinc-700 shadow-2xs flex items-center justify-center text-stone-800 dark:text-stone-200 hover:bg-stone-100 active:scale-90 transition cursor-pointer font-bold text-xs"
                            title="Decrease"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100 font-mono px-1">
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
                            className="w-5 h-5 rounded-lg bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 shadow-2xs flex items-center justify-center hover:bg-black active:scale-90 transition cursor-pointer font-bold text-xs"
                            title="Increase"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playTapSound();
                            onRemoveItem ? onRemoveItem(item.id) : onDec(item.id);
                          }}
                          className="w-6 h-6 rounded-lg bg-stone-50 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-950/40 text-stone-400 hover:text-red-600 transition flex items-center justify-center cursor-pointer active:scale-90"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
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
                        className="w-full py-1 rounded-xl bg-stone-100 hover:bg-stone-900 hover:text-white dark:bg-zinc-800 dark:hover:bg-amber-500 dark:hover:text-stone-950 font-bold text-xs text-stone-800 dark:text-stone-200 transition cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{t.addToCart || "Add"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty Search / Category State */}
        {filteredMenu.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-stone-400">
            <Utensils className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-bold text-stone-600 dark:text-stone-300">
              No matching items found
            </p>
            <p className="text-xs mt-0.5">Try searching for something else or reset filter</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="mt-3 px-3.5 py-1.5 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
