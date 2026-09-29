"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  onAdd: (item: MenuItem, qty?: number) => void;
  onDec: (id: number) => void;
  onRemoveItem?: (id: number) => void;
}

import { getAccurateItemImageByName } from "../utils/itemImage";
import { getItemDisplayName } from "../utils/itemTranslation";
import { trpc } from "@/lib/trpc";

function getAccurateItemImage(item: MenuItem): string {
  return getAccurateItemImageByName(item.name, item.imageUrl);
}

// Map live department name to clean localized display text
function getLiveDeptDisplayName(deptName: string, lang: string = "en"): string {
  if (!deptName) return "";
  const n = deptName.toLowerCase().trim();
  if (lang === "ur") {
    if (n === "tea") return "چائے و قہوہ";
    if (n === "drinks") return "مشروبات و لسی";
    if (n === "paratha") return "پراٹھا و نان";
    if (n === "kitchen") return "کچن و سالن";
    return deptName;
  }
  return deptName;
}

// Match any menu item strictly to the Live Departments configured in the database
function resolveItemDepartment(
  item: {
    name: string;
    departmentId?: number | null;
  },
  liveDepts: any[],
  lang: string = "en"
): { key: string; name: string; label: string } {
  // Direct departmentId match with Live Departments from DB
  if (item.departmentId && liveDepts.length > 0) {
    const matched = liveDepts.find((d) => d.id === item.departmentId);
    if (matched) {
      return {
        key: `dept-${matched.id}`,
        name: matched.name,
        label: getLiveDeptDisplayName(matched.name, lang),
      };
    }
  }

  // Fallback to item name
  return {
    key: `dept-all`,
    name: item.name,
    label: getItemDisplayName(item.name, lang) || item.name,
  };
}

// Clean Minimal Badge
function getItemBadge(item: any, liveDepts: any[], lang: string): { text: string } | null {
  if (item.departmentId && liveDepts.length > 0) {
    const dept = liveDepts.find((d: any) => d.id === item.departmentId);
    if (dept) {
      return { text: getLiveDeptDisplayName(dept.name, lang) };
    }
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
  const departmentsQuery = trpc.hotel.getDepartments.useQuery();
  const liveDepartments = departmentsQuery.data || [];
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  // Default view mode: list on mobile (< 768px), grid on tablets/desktop (>= 768px)
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setViewMode("list");
    }
  }, []);

  const getQty = (id: number) => cart.find((c) => c.id === id)?.quantity ?? 0;

  // Build Department Options from Live Database Departments
  const departmentOptions = useMemo(() => {
    const list: { key: string; name: string; label: string; count: number }[] = [];

    // 1. "All" Option
    list.push({
      key: "all",
      name: "All",
      label: lang === "ur" ? "تمام مینیو" : "All Menu",
      count: menu.length,
    });

    // 2. Live Database Departments
    if (liveDepartments.length > 0) {
      liveDepartments.forEach((dept: any) => {
        const key = `dept-${dept.id}`;
        const count = menu.filter(
          (item) => item.departmentId === dept.id
        ).length;
        list.push({
          key,
          name: dept.name,
          label: getLiveDeptDisplayName(dept.name, lang),
          count,
        });
      });
    }

    return list;
  }, [liveDepartments, menu, lang]);

  // Filter items based on selected Department & Search Query
  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      let matchesDept = true;
      if (selectedDepartment !== "all") {
        matchesDept = `dept-${item.departmentId}` === selectedDepartment;
      }
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesDept && matchesSearch;
    });
  }, [menu, selectedDepartment, searchQuery]);

  const handleFastAdd = (item: MenuItem, addQty: number = 1) => {
    unlockAudio();
    playCartAddSound();
    onAdd(item, addQty);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white dark:bg-[#121824] rounded-[28px]">
        <FaSpinner className="animate-spin h-8 w-8 text-[#D98A3C]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-3">
      {/* ── Unified Search & Filter Bar Card ─────────────────────────── */}
      <div className="bg-white dark:bg-[#121824] rounded-[24px] p-3 sm:p-3.5 space-y-2.5 shrink-0 border-0 shadow-none">
        {/* Top Row: Search Input (left) + Grid/List View Toggle (right) */}
        <div className="flex items-center gap-2.5 w-full">
          <div className="relative flex items-center flex-1 min-w-0">
            <FaMagnifyingGlass className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchFoodPlaceholder || "Search food or tea..."}
              className="w-full pl-9 pr-8 py-2 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-full text-xs font-semibold text-[#24180A] dark:text-white placeholder:text-stone-400 border-0 shadow-none focus:outline-none focus:ring-2 focus:ring-[#D98A3C]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
              >
                <FaXmark className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View Mode Toggle on right side of Searchbar */}
          <div className="flex items-center rounded-full p-1 bg-[#F8F3EC] dark:bg-[#1A2232] shrink-0 border-0">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setViewMode("grid");
              }}
              className={`p-1.5 rounded-full transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[#D98A3C] text-white shadow-none"
                  : "text-[#786B5D] hover:text-[#24180A] dark:hover:text-white"
              }`}
              title="Grid View"
            >
              <FaTableCellsLarge className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setViewMode("list");
              }}
              className={`p-1.5 rounded-full transition cursor-pointer ${
                viewMode === "list"
                  ? "bg-[#D98A3C] text-white shadow-none"
                  : "text-[#786B5D] hover:text-[#24180A] dark:hover:text-white"
              }`}
              title="List View"
            >
              <FaList className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Row: Department Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {departmentOptions.map((dept) => {
            const isSelected = selectedDepartment === dept.key;
            return (
              <button
                key={dept.key}
                type="button"
                onClick={() => {
                  playTapSound();
                  setSelectedDepartment(dept.key);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer select-none border-0 ${
                  isSelected
                    ? "bg-[#D98A3C] text-white shadow-none font-black"
                    : "bg-[#F8F3EC] dark:bg-[#1A2232] text-[#4A3E31] dark:text-zinc-300 hover:bg-[#EFE7DC] dark:hover:bg-[#222C40]"
                }`}
              >
                <span>{dept.label}</span>
                {dept.key !== "all" && dept.count > 0 && (
                  <span
                    dir="ltr"
                    className={`ml-1 rtl:mr-1 text-[10px] font-mono ${
                      isSelected ? "opacity-90 font-bold" : "opacity-60"
                    }`}
                  >
                    ({dept.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Menu Items Viewport ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-1 pt-1.5 pb-24 lg:pb-6 min-h-0 no-scrollbar">
        {/* 1. GRID VIEW MODE (Exact Match with Reference, Balanced Sizing) */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3.5">
            {filteredMenu.map((item) => {
              const qty = getQty(item.id);
              const isSelected = qty > 0;
              const badge = getItemBadge(item, liveDepartments, lang);
              const accurateImg = getAccurateItemImage(item);
              const displayName = getItemDisplayName(item.name, lang);

              return (
                <div
                  key={item.id}
                  onClick={() => handleFastAdd(item, 1)}
                  className={`bg-white dark:bg-[#121824] rounded-[20px] sm:rounded-[24px] p-3 sm:p-3.5 transition-all duration-200 flex flex-col justify-between select-none cursor-pointer border-0 shadow-none hover:-translate-y-0.5 ${
                    isSelected ? "ring-2 ring-inset ring-[#D98A3C]" : ""
                  }`}
                >
                  {/* Card Top: Photo + Title + Badge */}
                  <div>
                    {/* Food Photo Banner */}
                    <div className="aspect-[16/10] w-full bg-[#F8F3EC] dark:bg-[#1A2232] rounded-[14px] sm:rounded-[16px] overflow-hidden relative mb-2.5">
                      <img
                        src={accurateImg}
                        alt={displayName}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Selected Quantity Badge */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 bg-[#D98A3C] text-white font-black text-[11px] min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center shadow-none">
                          {qty}
                        </div>
                      )}
                    </div>

                    {/* Title & Popular Badge Row */}
                    <div className="flex items-center justify-between gap-1.5">
                      <h3 className="font-bold text-[#1C1917] dark:text-white text-xs sm:text-sm leading-tight truncate">
                        {displayName}
                      </h3>
                      {badge && (
                        <span className="shrink-0 border border-amber-300 dark:border-amber-700/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-[10px] font-semibold px-1.5 py-0.2 rounded">
                          {badge.text}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div className="border-t border-stone-100 dark:border-white/5 my-2" />

                  {/* Card Bottom: Orange Price on Left | + Add Pill on Right */}
                  <div className="flex items-center justify-between gap-1.5">
                    {/* Left: Bold Orange Price */}
                    <span className="text-xs sm:text-sm font-bold text-[#E65100] dark:text-[#FB8C00] font-mono">
                      Rs. {item.price}
                    </span>

                    {/* Right: Pill Button or Stepper */}
                    <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                      {isSelected ? (
                        <div className="h-8 sm:h-9 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-full px-1.5 sm:px-2 flex items-center gap-1.5 sm:gap-2 border-0">
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
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer ${
                              qty === 1
                                ? "bg-red-500 text-white"
                                : "bg-black text-white dark:bg-white dark:text-black"
                            }`}
                            title={qty === 1 ? "Remove from cart" : "Decrease quantity"}
                          >
                            {qty === 1 ? (
                              <FaTrashCan className="w-2.5 h-2.5" />
                            ) : (
                              <FaMinus className="w-2.5 h-2.5" />
                            )}
                          </button>
                          <span className="min-w-[16px] text-center text-xs font-mono font-bold text-[#24180A] dark:text-white">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFastAdd(item, 1);
                            }}
                            className="w-6 h-6 rounded-full bg-[#D98A3C] hover:bg-[#C27930] text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
                            title="Increase quantity"
                          >
                            <FaPlus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFastAdd(item, 1);
                          }}
                          className="h-8 sm:h-9 px-4 sm:px-5 rounded-full bg-[#D98A3C] hover:bg-[#C27930] text-black font-bold text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-1 shadow-none active:scale-95"
                        >
                          <FaPlus className="w-3 h-3" />
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

        {/* 2. LIST VIEW MODE (Compact, Sleek Space-Saving Rows) */}
        {viewMode === "list" && (
          <div className="space-y-1.5 sm:space-y-2">
            {filteredMenu.map((item) => {
              const qty = getQty(item.id);
              const isSelected = qty > 0;
              const badge = getItemBadge(item, liveDepartments, lang);
              const accurateImg = getAccurateItemImage(item);
              const displayName = getItemDisplayName(item.name, lang);

              return (
                <div
                  key={item.id}
                  onClick={() => handleFastAdd(item, 1)}
                  className={`bg-white dark:bg-[#121824] rounded-2xl sm:rounded-full p-2 sm:px-3.5 sm:py-2 flex items-center justify-between gap-2.5 sm:gap-3 transition-all select-none cursor-pointer border-0 shadow-none hover:bg-stone-50/80 dark:hover:bg-[#182030] ${
                    isSelected ? "ring-2 ring-inset ring-[#D98A3C]" : ""
                  }`}
                >
                  {/* Left: Compact Thumbnail */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-full bg-[#F8F3EC] dark:bg-[#1A2232] overflow-hidden relative shrink-0">
                    <img
                      src={accurateImg}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Middle: Details */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-[#24180A] dark:text-white text-xs sm:text-sm truncate">
                        {displayName}
                      </h4>
                      {badge && (
                        <span className="shrink-0 bg-amber-500/15 text-[#D98A3C] text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                          {badge.text}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] sm:text-xs font-bold text-[#E65100] dark:text-[#FB8C00] font-mono">
                      Rs. {item.price}
                    </div>
                  </div>

                  {/* Right: Stepper / Add Pill */}
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    {isSelected ? (
                      <div className="h-6.5 sm:h-7 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-full px-1.5 flex items-center gap-1 sm:gap-1.5 border-0">
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
                          className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer ${
                            qty === 1
                              ? "bg-red-500 text-white"
                              : "bg-black text-white dark:bg-white dark:text-black"
                          }`}
                          title={qty === 1 ? "Remove from cart" : "Decrease quantity"}
                        >
                          {qty === 1 ? (
                            <FaTrashCan className="w-2 h-2" />
                          ) : (
                            <FaMinus className="w-2 h-2" />
                          )}
                        </button>
                        <span className="min-w-[12px] text-center text-[11px] sm:text-xs font-mono font-bold text-[#24180A] dark:text-white">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFastAdd(item, 1);
                          }}
                          className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#D98A3C] hover:bg-[#C27930] text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
                          title="Increase quantity"
                        >
                          <FaPlus className="w-2 h-2" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFastAdd(item, 1);
                        }}
                        className="h-6.5 sm:h-7 px-3 bg-[#D98A3C] hover:bg-[#C27930] active:scale-95 text-black font-bold text-[11px] rounded-full shadow-none flex items-center justify-center gap-1 transition cursor-pointer"
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

        {/* Empty State */}
        {filteredMenu.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-[#786B5D] dark:text-zinc-400">
            <FaUtensils className="w-10 h-10 mb-2 opacity-30 text-[#D98A3C]" />
            <p className="text-sm font-bold text-[#24180A] dark:text-white">
              No matching items found
            </p>
            <p className="text-xs mt-0.5 font-medium">Try searching for something else or reset filter</p>
            <button
              type="button"
              onClick={() => {
                setSelectedDepartment("all");
                setSearchQuery("");
              }}
              className="mt-4 px-5 py-2 bg-[#D98A3C] text-white rounded-full text-xs font-bold transition cursor-pointer shadow-none"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
