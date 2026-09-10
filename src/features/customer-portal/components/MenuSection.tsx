"use client";

import React, { useState, useMemo } from "react";
import { Loader2, Utensils, Search, LayoutGrid, List, Flame, Sparkles } from "lucide-react";
import { MenuItem, CartItem } from "@/types/hotel";
import { useLang } from "@/contexts/LangContext";
import { playTapSound } from "@/lib/sound";

interface MenuSectionProps {
  menu?: MenuItem[];
  isLoading: boolean;
  cart: CartItem[];
  onAdd: (item: MenuItem) => void;
  onDec: (id: number) => void;
}

// Cultural & Urdu Category Mapper
function formatCategoryLabel(cat: string, lang: string) {
  const lower = cat.toLowerCase();
  if (lower === "all") return "🌟 " + (lang === "ur" ? "سب مینو (All)" : "All Menu");
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
      text: lang === "ur" ? "سب سے مقبول" : "Bestseller",
      bg: "bg-amber-600 text-white",
      icon: Flame,
    };
  }
  if (lower.includes("paratha") || lower.includes("anda")) {
    return {
      text: lang === "ur" ? "گرم و خستہ" : "Hot & Crispy",
      bg: "bg-orange-600 text-white",
      icon: Sparkles,
    };
  }
  if (lower.includes("lassi") || lower.includes("halwa")) {
    return {
      text: lang === "ur" ? "ہوٹل اسپیشل" : "Special",
      bg: "bg-emerald-600 text-white",
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
}: MenuSectionProps) {
  const { lang } = useLang();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list"); // 'list' is ultra-fast on mobile

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
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2">
      {/* ── Sticky Visual Category Bar ───────────────────────────────── */}
      <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Visual Category horizontal scroll tabs */}
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
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black shrink-0 transition-all flex items-center gap-1 cursor-pointer select-none active:scale-95 ${
                    isSelected
                      ? "bg-black text-white shadow-xs scale-[1.02]"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{formatCategoryLabel(cat, lang)}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile View Switcher */}
          <div className="flex sm:hidden items-center border border-gray-200 rounded-lg p-0.5 bg-gray-50 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1 rounded ${viewMode === "list" ? "bg-white shadow-2xs text-black" : "text-gray-400"}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded ${viewMode === "grid" ? "bg-white shadow-2xs text-black" : "text-gray-400"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === "ur" ? "کھانا یا چائے تلاش کریں..." : "Search food or tea..."}
            className="w-full pl-8 pr-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* ── FAST ORDER MENU ITEMS ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pr-0.5 min-h-0 no-scrollbar pb-16 lg:pb-2">
        {/* 1. Mobile Fast List Mode (Row items for 1-thumb use) */}
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
                  className={`bg-white rounded-2xl border p-2 flex items-center justify-between gap-2.5 transition active:scale-[0.98] select-none shadow-2xs ${
                    isSelected
                      ? "border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/25"
                      : "border-gray-200"
                  }`}
                >
                  {/* Left: Thumbnail & Badge */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0 relative">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-400">
                          <Utensils className="w-6 h-6 opacity-40" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-0 right-0 bg-orange-600 text-white font-black text-[10px] w-4.5 h-4.5 rounded-bl-lg flex items-center justify-center shadow-xs">
                          {qty}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-black text-gray-900 text-xs sm:text-sm line-clamp-1 leading-tight">
                          {item.name}
                        </h4>
                        {badge && (
                          <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-md ${badge.bg}`}>
                            {badge.text}
                          </span>
                        )}
                      </div>
                      <p className="font-black text-sm text-orange-600 mt-0.5">
                        Rs. {item.price}
                      </p>
                    </div>
                  </div>

                  {/* Right: 1-Tap Bulk Multipliers (+1, +2, +5) */}
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => handleBulkAdd(item, 1, e)}
                      className="px-2.5 py-2 rounded-xl bg-gray-100 hover:bg-black hover:text-white active:scale-90 font-black text-xs text-gray-800 transition cursor-pointer"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleBulkAdd(item, 2, e)}
                      className="px-2.5 py-2 rounded-xl bg-gray-100 hover:bg-black hover:text-white active:scale-90 font-black text-xs text-gray-800 transition cursor-pointer"
                    >
                      +2
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleBulkAdd(item, 5, e)}
                      className="px-2.5 py-2 rounded-xl bg-orange-100 hover:bg-orange-600 hover:text-white active:scale-90 font-black text-xs text-orange-800 transition cursor-pointer"
                    >
                      +5
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. Desktop Grid / Mobile Optional Grid (Square Touch Tiles) */}
        <div
          className={`${
            viewMode === "list" ? "hidden sm:grid" : "grid"
          } grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3`}
        >
          {filteredMenu.map((item) => {
            const qty = getQty(item.id);
            const isSelected = qty > 0;
            const badge = getItemBadge(item.name, lang);

            return (
              <div
                key={item.id}
                onClick={() => handleItemTap(item)}
                className={`group bg-white rounded-2xl border transition-all flex flex-col overflow-hidden relative select-none cursor-pointer text-left shadow-2xs active:scale-[0.97] hover:shadow-md ${
                  isSelected
                    ? "border-orange-600 ring-2 ring-orange-500/20 bg-orange-50/15"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Photo Section */}
                <div className="aspect-16/10 w-full bg-gray-100 relative overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-orange-50/50 text-orange-400">
                      <Utensils className="w-8 h-8 opacity-30" />
                    </div>
                  )}

                  {/* Appetite Marketing Badge */}
                  {badge && (
                    <div className={`absolute top-1.5 left-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs ${badge.bg}`}>
                      {badge.text}
                    </div>
                  )}

                  {/* Visual Counter Badge */}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 bg-orange-600 text-white font-extrabold text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-75">
                      {qty}
                    </div>
                  )}
                </div>

                {/* Title & Price Section */}
                <div className="p-2.5 flex-1 flex flex-col justify-between bg-white">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-xs sm:text-sm line-clamp-1 leading-tight">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-extrabold text-xs sm:text-sm text-orange-600">
                        Rs. {item.price}
                      </span>
                      {item.category && (
                        <span className="text-[9px] font-bold text-gray-400 truncate max-w-[70px]">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bulk Multipliers (+1, +2, +5) */}
                  <div
                    className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => handleBulkAdd(item, 1, e)}
                      className="flex-1 py-1 rounded bg-gray-100 hover:bg-black hover:text-white active:scale-90 font-extrabold text-[11px] text-gray-800 transition cursor-pointer text-center"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleBulkAdd(item, 2, e)}
                      className="flex-1 py-1 rounded bg-gray-100 hover:bg-black hover:text-white active:scale-90 font-extrabold text-[11px] text-gray-800 transition cursor-pointer text-center"
                    >
                      +2
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleBulkAdd(item, 5, e)}
                      className="flex-1 py-1 rounded bg-orange-100 hover:bg-orange-600 hover:text-white active:scale-90 font-extrabold text-[11px] text-orange-800 transition cursor-pointer text-center"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredMenu.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 text-gray-400">
            <Utensils className="w-10 h-10 mx-auto mb-2 opacity-30 text-orange-400" />
            <p className="text-xs sm:text-sm font-bold text-gray-700">کوئی چیز نہیں ملی (No items found)</p>
          </div>
        )}
      </div>
    </div>
  );
}
