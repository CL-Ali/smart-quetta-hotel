"use client";

import React from "react";
import { playTapSound } from "@/lib/sound";

export interface BottomNavItem {
  key: string;
  label: string;
  icon?: React.ElementType;
  badge?: number | string;
}

interface StaffBottomNavProps {
  current?: "admin" | "cashier" | "pos" | "kitchen" | "waiter";
  items?: BottomNavItem[];
  activeItem?: string;
  onSelectItem?: (key: string) => void;
  onOpenDrawer?: () => void;
}

export function StaffBottomNav({
  items = [],
  activeItem,
  onSelectItem,
}: StaffBottomNavProps) {
  // If there's 1 or 0 tabs, don't render redundant bottom navigation bar
  if (!items || items.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Staff Sub Navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#121824]/95 backdrop-blur-md border-t border-stone-200/60 dark:border-white/10 md:hidden px-3 py-1.5 flex items-center justify-around gap-1 shadow-lg select-none"
    >
      <div className="flex items-center justify-around w-full overflow-x-auto no-scrollbar gap-1">
        {items.map((item) => {
          const isActive = activeItem === item.key;
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                playTapSound();
                onSelectItem?.(item.key);
              }}
              className={`flex-1 flex flex-col items-center justify-center min-w-[52px] max-w-[85px] py-1.5 px-1 rounded-xl transition cursor-pointer shrink-0 border-0 ${
                isActive
                  ? "bg-[#D98A3C] text-white shadow-xs font-bold"
                  : "text-[#786B5D] dark:text-stone-400 hover:text-[#24180A] dark:hover:text-white font-medium"
              }`}
            >
              {Icon && (
                <div className="relative">
                  <Icon className="w-4 h-4" />
                  {item.badge !== undefined && item.badge !== 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
              <span className="text-[10px] truncate max-w-full mt-0.5 leading-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
