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
    <div className="hidden sm:flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/60">
      {allowedWorkspaces.map((w) => {
        const isActive = current === w.key;
        const Icon = w.icon;

        if (isActive) {
          return (
            <span
              key={w.key}
              className="px-2.5 py-1 bg-white text-stone-950 shadow-2xs text-xs font-black rounded-lg flex items-center gap-1.5 cursor-default select-none border border-stone-200/60"
            >
              <Icon className="w-3.5 h-3.5 text-amber-600" />
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
            className="px-2.5 py-1 hover:bg-white text-xs font-extrabold text-stone-600 hover:text-stone-900 rounded-lg transition flex items-center gap-1.5"
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
