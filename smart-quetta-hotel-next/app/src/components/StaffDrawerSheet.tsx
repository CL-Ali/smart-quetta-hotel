"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Hotel,
  Store,
  LayoutGrid,
  ChefHat,
  Utensils,
  LogOut,
  Globe,
  User,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { playTapSound } from "@/lib/sound";

interface StaffDrawerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  current: "admin" | "cashier" | "pos" | "kitchen" | "waiter";
}

export function StaffDrawerSheet({
  isOpen,
  onClose,
  current,
}: StaffDrawerSheetProps) {
  const { staff, permissions, logout } = useAuth();
  const { lang, setLang } = useLang();

  const WORKSPACES = [
    {
      key: "admin" as const,
      href: "/dashboard",
      label: lang === "ur" ? "ایڈمن ڈیش بورڈ" : "Admin Dashboard",
      desc: lang === "ur" ? "رپورٹس، کھاتہ و اسٹاف مینجمنٹ" : "Reports, accounts & staff management",
      icon: Hotel,
      allowed: !!permissions.canAdmin,
    },
    {
      key: "cashier" as const,
      href: "/cashier",
      label: lang === "ur" ? "کیشیئر کاؤنٹر" : "Cashier Counter",
      desc: lang === "ur" ? "آرڈرز، بلنگ و کھاتہ جات" : "Orders, billing & shopkeeper khata",
      icon: Store,
      allowed: !!permissions.canCashier,
    },
    {
      key: "kitchen" as const,
      href: "/kitchen",
      label: lang === "ur" ? "کچن کک ڈسپلے" : "Kitchen Cook Display",
      desc: lang === "ur" ? "لائیو آرڈر تیاری اور شعبہ جات" : "Live food preparation & KDS stations",
      icon: ChefHat,
      allowed: !!permissions.canKitchen,
    },
    {
      key: "waiter" as const,
      href: "/waiter",
      label: lang === "ur" ? "ویٹر ڈلیوری پینل" : "Waiter Service Panel",
      desc: lang === "ur" ? "میز ڈلیوری اور سرو کرنا" : "Table delivery & ready dish serving",
      icon: Utensils,
      allowed: !!permissions.canWaiter,
    },
  ];

  const allowedWorkspaces = WORKSPACES.filter((w) => w.allowed);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden"
          />

          {/* Slide-Up Bottom / Side Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="fixed bottom-0 inset-x-0 z-50 max-h-[88vh] bg-white dark:bg-[#121824] rounded-t-[32px] p-5 flex flex-col shadow-2xl border-t border-stone-200/40 dark:border-white/10 md:hidden overflow-hidden"
          >
            {/* Header Handle & Close */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#D98A3C]/15 text-[#D98A3C] flex items-center justify-center font-black">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#24180A] dark:text-white">
                    {lang === "ur" ? "ورک اسپیس مینو" : "Staff Workspace Menu"}
                  </h3>
                  <p className="text-[11px] text-[#786B5D] dark:text-stone-400">
                    {staff?.name || "Staff Member"} • {staff?.role?.toUpperCase()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-[#1A2234] text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer border-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto py-3 space-y-4 no-scrollbar flex-1">
              {/* Workspaces Switcher Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#786B5D] dark:text-stone-400 px-1">
                  {lang === "ur" ? "پینل منتخب کریں" : "Select Workspace"}
                </span>

                <div className="space-y-1.5">
                  {allowedWorkspaces.map((w) => {
                    const isActive = current === w.key;
                    const Icon = w.icon;

                    return (
                      <Link
                        key={w.key}
                        href={w.href}
                        prefetch={true}
                        onClick={() => {
                          playTapSound();
                          onClose();
                        }}
                        className={`flex items-center gap-3 p-3 rounded-2xl transition select-none ${
                          isActive
                            ? "bg-[#D98A3C] text-white shadow-xs"
                            : "bg-[#F8F3EC] dark:bg-[#1A2234] text-[#24180A] dark:text-stone-200 hover:bg-[#EFE7DC] dark:hover:bg-[#222C40]"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-white dark:bg-[#121824] text-[#D98A3C]"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs sm:text-sm leading-tight truncate">
                            {w.label}
                          </h4>
                          <p
                            className={`text-[10px] leading-tight truncate mt-0.5 ${
                              isActive
                                ? "text-white/80"
                                : "text-stone-500 dark:text-stone-400"
                            }`}
                          >
                            {w.desc}
                          </p>
                        </div>
                        {isActive && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/25 text-white shrink-0">
                            {lang === "ur" ? "فعال" : "Active"}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Language Selection */}
              <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-white/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#786B5D] dark:text-stone-400 px-1">
                  {lang === "ur" ? "زبان منتخب کریں" : "Language"}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setLang("en");
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border-0 transition cursor-pointer ${
                      lang === "en"
                        ? "bg-[#D98A3C] text-white shadow-xs"
                        : "bg-[#F8F3EC] dark:bg-[#1A2234] text-[#4A3E31] dark:text-stone-300"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>English</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playTapSound();
                      setLang("ur");
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border-0 transition cursor-pointer ${
                      lang === "ur"
                        ? "bg-[#D98A3C] text-white shadow-xs"
                        : "bg-[#F8F3EC] dark:bg-[#1A2234] text-[#4A3E31] dark:text-stone-300"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span className="font-urdu">اردو</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Logout Footer */}
            <div className="pt-3 border-t border-stone-100 dark:border-white/5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  logout();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border-0"
              >
                <LogOut className="w-4 h-4" />
                <span>{lang === "ur" ? "لاگ آؤٹ کریں" : "Sign Out"}</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
