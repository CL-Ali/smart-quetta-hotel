"use client";

import React from "react";
import Link from "next/link";
import { Hotel, Store, ChefHat, Utensils } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { playTapSound } from "@/lib/sound";

interface Props {
  current: "admin" | "cashier" | "kitchen" | "waiter";
}

export function StaffWorkspaceSwitcher({ current }: Props) {
  const { permissions } = useAuth();

  const WORKSPACES = [
    {
      key: "admin" as const,
      href: "/dashboard",
      label: "Admin",
      icon: Hotel,
      allowed: !!permissions.canAdmin,
    },
    {
      key: "cashier" as const,
      href: "/cashier",
      label: "Cashier",
      icon: Store,
      allowed: !!permissions.canCashier,
    },
    {
      key: "kitchen" as const,
      href: "/kitchen",
      label: "Kitchen",
      icon: ChefHat,
      allowed: !!permissions.canKitchen,
    },
    {
      key: "waiter" as const,
      href: "/waiter",
      label: "Waiter",
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
    <div className="hidden sm:flex items-center gap-1 bg-[#F4EFEA] dark:bg-[#1A2234] p-1.5 rounded-full border-0 shadow-none">
      {allowedWorkspaces.map((w) => {
        const isActive = current === w.key;
        const Icon = w.icon;

        if (isActive) {
          return (
            <span
              key={w.key}
              className="px-3.5 py-1.5 bg-white dark:bg-[#121824] text-[#24180A] dark:text-white shadow-none text-xs font-extrabold rounded-full flex items-center gap-1.5 cursor-default select-none border-0"
            >
              <Icon className="w-3.5 h-3.5 text-[#D98A3C]" />
              <span>{w.label}</span>
            </span>
          );
        }

        return (
          <Link
            key={w.key}
            href={w.href}
            prefetch={true}
            onClick={() => playTapSound()}
            className="px-3 py-1.5 hover:bg-white/60 dark:hover:bg-[#121824]/60 text-xs font-bold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-full transition flex items-center gap-1.5 border-0"
            title={`Switch to ${w.label}`}
          >
            <Icon className="w-3.5 h-3.5 text-stone-400" />
            <span>{w.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
