"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { LangSwitcher } from "@/components/LangSwitcher";
import {
  Hotel,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  Smartphone,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { playTapSound } from "@/lib/sound";

function LoginForm() {
  const { login, isAuthenticated, staff, clientIp } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to workspace
  useEffect(() => {
    if (isAuthenticated && staff) {
      if (returnUrl) {
        router.push(returnUrl);
      } else if (staff.role === "admin") {
        router.push("/dashboard");
      } else if (staff.role === "cashier") {
        router.push("/cashier");
      } else if (staff.role === "kitchen") {
        router.push("/kitchen");
      } else {
        router.push("/waiter");
      }
    }
  }, [isAuthenticated, staff, returnUrl, router]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!username.trim()) {
      setError("Please enter your username or email");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password or PIN");
      return;
    }

    setError("");
    setLoading(true);

    const res = await login(username.trim(), password.trim());
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Login failed. Please check credentials or IP binding.");
    }
  };

  // Quick autofill buttons for easy terminal switching
  const handleQuickFill = (u: string, p: string) => {
    playTapSound();
    setUsername(u);
    setPassword(p);
    setError("");
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Decorative Accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="p-4 sm:p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
            <Hotel className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight leading-none text-stone-900">
              {t.hotelName || "Smart Quetta Hotel"}
            </h1>
            <p className="text-[10px] text-amber-600 font-extrabold uppercase tracking-widest mt-0.5">
              Staff Portal & Terminal Auth
            </p>
          </div>
        </div>
        <LangSwitcher />
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-md bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-stone-900/5">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">
              Staff Login
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Enter username & password to access your station
            </p>
          </div>

          {/* Quick Role Fill Pills */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-stone-500 mb-2">
              <span>Quick Login Accounts:</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="grid grid-cols-4 gap-1.5 bg-stone-100 p-1.5 rounded-2xl border border-stone-200/80">
              <button
                type="button"
                onClick={() => handleQuickFill("admin", "admin123")}
                className="py-2 px-1 text-[11px] font-black rounded-xl bg-white hover:bg-stone-50 text-amber-800 border border-stone-200 shadow-2xs transition active:scale-95 text-center flex flex-col items-center gap-0.5 cursor-pointer"
              >
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("cashier1", "1234")}
                className="py-2 px-1 text-[11px] font-black rounded-xl bg-white hover:bg-stone-50 text-emerald-800 border border-stone-200 shadow-2xs transition active:scale-95 text-center flex flex-col items-center gap-0.5 cursor-pointer"
              >
                <span>Cashier</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("kitchen1", "1234")}
                className="py-2 px-1 text-[11px] font-black rounded-xl bg-white hover:bg-stone-50 text-blue-800 border border-stone-200 shadow-2xs transition active:scale-95 text-center flex flex-col items-center gap-0.5 cursor-pointer"
              >
                <span>Kitchen</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("waiter1", "1234")}
                className="py-2 px-1 text-[11px] font-black rounded-xl bg-white hover:bg-stone-50 text-purple-800 border border-stone-200 shadow-2xs transition active:scale-95 text-center flex flex-col items-center gap-0.5 cursor-pointer"
              >
                <span>Waiter</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 block">
                Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g. admin, cashier1, waiter1"
                  className="w-full h-12 bg-stone-50 border border-stone-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl pl-10 pr-4 text-sm text-stone-900 placeholder-stone-400 outline-none transition"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 block">
                Password / PIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter password or PIN"
                  className="w-full h-12 bg-stone-50 border border-stone-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl pl-10 pr-11 text-sm text-stone-900 placeholder-stone-400 outline-none transition tracking-wider"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 text-center leading-relaxed">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="w-full h-12 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-black text-base rounded-xl flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing In…</span>
                </>
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Device IP Reassurance */}
          <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-stone-400" />
              <span>Current Device IP:</span>
            </div>
            <span className="font-mono font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
              {clientIp || "127.0.0.1"}
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-stone-400 z-10">
        <p>24-Hour Session • Auto-Refresh Active • Smart Quetta Hotel POS</p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
