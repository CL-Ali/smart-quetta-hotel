"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { playOrderSuccessSound, playTapSound } from "@/lib/sound";

export interface StaffUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "cashier" | "waiter" | "kitchen";
  stationName?: string | null;
  assignedCashierId?: number | null;
  permissions?: string[] | null;
  allowedIp?: string | null;
  currentIp?: string | null;
}

export interface Permissions {
  canAdmin: boolean;
  canCashier: boolean;
  canKitchen: boolean;
  canWaiter: boolean;
}

interface AuthContextType {
  staff: StaffUser | null;
  clientIp: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: Permissions;
  login: (emailOrUsername: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refetchAuth: () => Promise<void>;
}

const defaultPermissions: Permissions = {
  canAdmin: false,
  canCashier: false,
  canKitchen: false,
  canWaiter: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [clientIp, setClientIp] = useState<string>("127.0.0.1");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
  });

  const loginMutation = trpc.auth.login.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const refreshMutation = trpc.auth.refresh.useMutation();

  useEffect(() => {
    if (!meQuery.isLoading) {
      if (meQuery.data?.isAuthenticated && meQuery.data.staff) {
        setStaff({
          id: meQuery.data.staff.staffId,
          name: meQuery.data.staff.name,
          email: meQuery.data.staff.email,
          role: meQuery.data.staff.role,
          stationName: meQuery.data.staff.stationName ?? null,
          assignedCashierId: meQuery.data.staff.assignedCashierId ?? null,
          permissions: meQuery.data.staff.permissions ?? [],
          allowedIp: meQuery.data.staff.allowedIp,
          currentIp: meQuery.data.clientIp,
        });
      } else {
        setStaff(null);
      }
      if (meQuery.data?.clientIp) {
        setClientIp(meQuery.data.clientIp);
      }
      setIsLoading(false);
    }
  }, [meQuery.isLoading, meQuery.data]);

  // Periodic sliding 2-hour auto-refresh heartbeat (runs every 15 minutes if active)
  useEffect(() => {
    if (!staff) return;

    const interval = setInterval(async () => {
      try {
        await refreshMutation.mutateAsync();
      } catch (_) {}
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [staff, refreshMutation]);

  const userPerms = staff?.permissions || meQuery.data?.staff?.permissions || [];
  const permissions: Permissions = {
    canAdmin: meQuery.data?.permissions?.canAdmin ?? (staff?.role === "admin"),
    canCashier:
      meQuery.data?.permissions?.canCashier ??
      (staff?.role === "admin" ||
        staff?.role === "cashier" ||
        userPerms.includes("can_access_cashier")),
    canKitchen:
      meQuery.data?.permissions?.canKitchen ??
      (staff?.role === "admin" ||
        staff?.role === "cashier" ||
        staff?.role === "kitchen" ||
        userPerms.includes("can_access_kitchen")),
    canWaiter:
      meQuery.data?.permissions?.canWaiter ??
      (staff != null || userPerms.includes("can_access_waiter")),
  };

  const login = useCallback(
    async (emailOrUsername: string, pass: string) => {
      try {
        playTapSound();
        const res = await loginMutation.mutateAsync({
          emailOrUsername: emailOrUsername.trim(),
          password: pass.trim(),
        });

        if (res.success && res.staff) {
          setStaff({
            ...res.staff,
            role: res.staff.role as StaffUser["role"],
          });
          if (res.clientIp) setClientIp(res.clientIp);
          playOrderSuccessSound();
          await meQuery.refetch();
          return { success: true };
        }
        return { success: false, error: "Login failed" };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || "Invalid credentials or IP mismatch",
        };
      }
    },
    [loginMutation, meQuery]
  );

  const logout = useCallback(async () => {
    try {
      playTapSound();
      await logoutMutation.mutateAsync();
    } catch (_) {}
    setStaff(null);
    await meQuery.refetch();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, [logoutMutation, meQuery]);

  const refetchAuth = useCallback(async () => {
    await meQuery.refetch();
  }, [meQuery]);

  return (
    <AuthContext.Provider
      value={{
        staff,
        clientIp,
        isAuthenticated: !!staff,
        isLoading,
        permissions,
        login,
        logout,
        refetchAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
