"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, Loader2, ArrowRight, LogOut, Home } from "lucide-react";
import { playTapSound } from "@/lib/sound";
import Link from "next/link";

interface Props {
  children: React.ReactNode;
  allowedRoles?: Array<"admin" | "cashier" | "waiter" | "kitchen">;
  requiredPermission?: "canAdmin" | "canCashier" | "canKitchen" | "canWaiter";
}

export function StaffAuthGuard({
  children,
  allowedRoles,
  requiredPermission,
}: Props) {
  const { staff, isAuthenticated, isLoading, permissions, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (typeof window !== "undefined") {
        router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      }
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-stone-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Loader2 className="animate-spin h-6 w-6 text-amber-600" />
          </div>
          <p className="text-sm font-bold text-stone-600">Verifying session & terminal IP…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !staff) {
    return null; // Will redirect in useEffect
  }

  // Check Role Permissions
  let isAuthorized = true;
  if (allowedRoles && allowedRoles.length > 0) {
    isAuthorized = allowedRoles.includes(staff.role);
  } else if (requiredPermission) {
    isAuthorized = !!permissions[requiredPermission];
  }

  if (!isAuthorized) {
    const defaultWorkspace =
      staff.role === "waiter"
        ? "/waiter"
        : staff.role === "kitchen"
        ? "/kitchen"
        : staff.role === "cashier"
        ? "/cashier"
        : "/dashboard";

    const roleName =
      staff.role === "admin"
        ? "Master Admin"
        : staff.role === "cashier"
        ? "Cashier"
        : staff.role === "kitchen"
        ? "Kitchen Staff"
        : "Floor Waiter";

    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 text-center shadow-xl text-stone-900">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 bg-stone-100 border border-stone-200 rounded-full text-xs font-bold text-stone-700 mb-2">
            Logged in as {roleName}
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-stone-900 mb-2">
            Restricted Access
          </h2>
          <p className="text-sm text-stone-600 mb-6 leading-relaxed">
            Your current account (<span className="text-stone-900 font-bold">{staff.name}</span>) does not have permission to access this terminal view.
          </p>

          <div className="space-y-3">
            <Link
              href={defaultWorkspace}
              onClick={() => playTapSound()}
              className="w-full h-12 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] transition text-stone-950 font-black rounded-xl flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
            >
              <span>Go to Your Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/"
              onClick={() => playTapSound()}
              className="w-full h-12 bg-stone-100 hover:bg-stone-200 active:scale-[0.98] transition text-stone-800 font-bold rounded-xl flex items-center justify-center gap-2 border border-stone-200"
            >
              <Home className="w-4 h-4" />
              <span>Customer Portal (Home)</span>
            </Link>

            <button
              type="button"
              onClick={() => logout()}
              className="w-full h-12 bg-transparent hover:bg-red-50 active:scale-[0.98] transition text-red-600 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer border border-stone-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Switch Account / Logout</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
