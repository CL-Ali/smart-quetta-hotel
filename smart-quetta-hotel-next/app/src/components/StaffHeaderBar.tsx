"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Hotel, LogOut, Menu, Zap, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { StaffWorkspaceSwitcher } from "@/components/StaffWorkspaceSwitcher";
import { StaffDrawerSheet } from "@/components/StaffDrawerSheet";
import { LangSwitcher } from "@/components/LangSwitcher";
import { playTapSound } from "@/lib/sound";

export interface StaffHeaderBarProps {
  current: "admin" | "cashier" | "pos" | "kitchen" | "waiter";
  title?: string;
  subtitle?: string;
  icon?: React.ElementType;
  centerContent?: React.ReactNode;
  rightExtra?: React.ReactNode;
  onOpenDrawer?: () => void;
}

export function StaffHeaderBar({
  current,
  title = "Smart Hotel",
  subtitle,
  icon: IconComponent = Hotel,
  centerContent,
  rightExtra,
  onOpenDrawer,
}: StaffHeaderBarProps) {
  const { staff, permissions, logout } = useAuth();
  const { lang } = useLang();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleToggleDrawer = () => {
    playTapSound();
    if (onOpenDrawer) {
      onOpenDrawer();
    } else {
      setDrawerOpen(true);
    }
  };

  // Determine return route & label when user is inside POS view
  const getRoleHome = () => {
    const role = staff?.role;
    if (role === "admin") {
      return { href: "/dashboard", label: lang === "ur" ? "ایڈمن" : "Admin" };
    }
    if (role === "waiter") {
      return { href: "/waiter", label: lang === "ur" ? "ویٹر" : "Waiter" };
    }
    if (role === "kitchen") {
      return { href: "/kitchen", label: lang === "ur" ? "کچن" : "Kitchen" };
    }
    // Default to cashier / dashboard
    return { href: "/cashier", label: lang === "ur" ? "کیشیئر" : "Cashier" };
  };

  const roleHome = getRoleHome();
  const showPosButton = !!permissions.canPos && current !== "pos";
  const showReturnButton = current === "pos";

  return (
    <>
      <header className="bg-white dark:bg-[#121824] rounded-2xl sm:rounded-[28px] border-0 shadow-none px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shrink-0 gap-2 sm:gap-4 static sm:sticky top-0 sm:top-3 z-30 mx-2 sm:mx-4 my-2 select-none transition-all">
        {/* Left: Branding & Station Identity + View Child Tabs */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          {/* Logo and Station/View Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#D98A3C] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-none">
              <IconComponent className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm sm:text-base font-black text-[#24180A] dark:text-white leading-none truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[10px] text-[#D98A3C] dark:text-amber-400 font-extrabold uppercase tracking-widest leading-none mt-1 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Subtle Vertical Divider */}
          {centerContent && (
            <div className="hidden md:block w-px h-6 bg-stone-200 dark:bg-stone-800 shrink-0 mx-0.5" />
          )}

          {/* View Child Tabs / Sub-Heading Navigation (Desktop / Tablet) */}
          {centerContent && (
            <div className="hidden md:flex items-center min-w-0 overflow-x-auto no-scrollbar">
              {centerContent}
            </div>
          )}
        </div>

        {/* Right: Workspaces Switcher + POS/Role Return Button + Profile + Language + Logout / Mobile Drawer Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {rightExtra}

          {/* Quick POS Button in Header (shown only on mobile, hidden on desktop and tablet) */}
          {showPosButton && (
            <Link
              href="/pos"
              onClick={() => playTapSound()}
              className="sm:hidden flex items-center gap-1.5 px-2.5 h-8 rounded-full bg-[#D98A3C] hover:bg-[#c27931] text-white text-xs font-black transition cursor-pointer border-0 shadow-xs active:scale-95 shrink-0"
              title="Open POS Terminal"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{lang === "ur" ? "پی او ایس" : "POS"}</span>
            </Link>
          )}

          {/* Return To Workspace Role Button (shown only on mobile, hidden on desktop and tablet) */}
          {showReturnButton && (
            <Link
              href={roleHome.href}
              onClick={() => playTapSound()}
              className="sm:hidden flex items-center gap-1.5 px-3 h-8 rounded-full bg-[#F4EFEA] dark:bg-[#1A2234] hover:bg-stone-200 dark:hover:bg-[#253147] text-[#24180A] dark:text-white text-xs font-black transition cursor-pointer border-0 shadow-xs active:scale-95 shrink-0"
              title={`Return to ${roleHome.label}`}
            >
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{roleHome.label}</span>
            </Link>
          )}

          {/* Desktop/Tablet Global Staff Workspace Switcher */}
          <StaffWorkspaceSwitcher current={current} />

          {/* Staff User Profile Badge */}
          {staff && (
            <div className="hidden md:flex items-center gap-1.5 bg-[#F4EFEA] dark:bg-[#1A2234] px-3 h-8 sm:h-9 rounded-full text-xs font-bold border-0 text-[#24180A] dark:text-stone-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate max-w-[120px]">
                {staff.name}
              </span>
            </div>
          )}

          {/* Language Switcher (Desktop / Tablet) */}
          <div className="hidden sm:block">
            <LangSwitcher variant="compact" />
          </div>

          {/* Desktop Logout Action */}
          <button
            type="button"
            onClick={() => logout()}
            className="hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 items-center justify-center bg-[#F4EFEA] dark:bg-[#1A2234] text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full transition cursor-pointer shrink-0 border-0"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Drawer Button */}
          <button
            type="button"
            onClick={handleToggleDrawer}
            className="sm:hidden w-8 h-8 flex items-center justify-center bg-[#F4EFEA] dark:bg-[#1A2234] text-[#24180A] dark:text-white rounded-full transition cursor-pointer shrink-0 border-0"
            title="Open Workspace Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Sheet */}
      <StaffDrawerSheet
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        current={current}
      />
    </>
  );
}
