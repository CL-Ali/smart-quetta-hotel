"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Hotel, Store, LayoutGrid, ChefHat, Utensils } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { playTapSound } from "@/lib/sound";

interface Props {
  current: "admin" | "cashier" | "pos" | "kitchen" | "waiter";
}

export function StaffWorkspaceSwitcher({ current }: Props) {
  const { permissions } = useAuth();
  const { lang, t } = useLang();

  const WORKSPACES = [
    {
      key: "admin" as const,
      href: "/dashboard",
      label: lang === "ur" ? "ایڈمن" : "Admin",
      icon: Hotel,
      allowed: !!permissions.canAdmin,
    },
    {
      key: "cashier" as const,
      href: "/cashier",
      label: lang === "ur" ? "کیشیئر" : "Cashier",
      icon: Store,
      allowed: !!permissions.canCashier,
    },
    {
      key: "pos" as const,
      href: "/pos",
      label: lang === "ur" ? "پی او ایس" : "POS Terminal",
      icon: LayoutGrid,
      allowed: !!permissions.canPos,
    },
    {
      key: "kitchen" as const,
      href: "/kitchen",
      label: lang === "ur" ? "کچن" : "Kitchen",
      icon: ChefHat,
      allowed: !!permissions.canKitchen,
    },
    {
      key: "waiter" as const,
      href: "/waiter",
      label: lang === "ur" ? "ویٹر" : "Waiter",
      icon: Utensils,
      allowed: !!permissions.canWaiter,
    },
  ];

  const allowedWorkspaces = WORKSPACES.filter((w) => w.allowed);

  // If staff only has access to 1 workspace, no need for switcher
  if (allowedWorkspaces.length <= 1) {
    return null;
  }

  return (
    <div className="hidden sm:inline-flex items-center bg-[#F4EFEA] dark:bg-[#1A2234] p-1 rounded-full border-0 shadow-none relative">
      {allowedWorkspaces.map((w) => {
        const isActive = current === w.key;
        const Icon = w.icon;

        return (
          <Link
            key={w.key}
            href={w.href}
            prefetch={true}
            onClick={() => {
              if (!isActive) playTapSound();
            }}
            className={`relative px-3.5 h-8 text-xs font-extrabold rounded-full inline-flex items-center gap-1.5 transition-colors duration-200 select-none border-0 ${
              isActive
                ? "text-[#24180A] dark:text-white"
                : "text-stone-600 dark:text-stone-400 hover:text-[#24180A] dark:hover:text-white"
            }`}
            title={`Switch to ${w.label}`}
          >
            {isActive && (
              <motion.div
                layoutId="workspaceActiveIndicator"
                className="absolute inset-0 bg-white dark:bg-[#121824] rounded-full shadow-xs -z-0"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}
            <Icon
              className={`w-3.5 h-3.5 relative z-10 transition-colors ${
                isActive ? "text-[#D98A3C]" : "text-stone-400"
              }`}
            />
            <span className="relative z-10">{w.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
