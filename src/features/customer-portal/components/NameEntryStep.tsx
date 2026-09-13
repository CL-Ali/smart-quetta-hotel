"use client";

import React, { useState, useRef } from "react";
import { User, Phone, Users, Armchair, UtensilsCrossed, ArrowRight, Loader2, AlertCircle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LangSwitcher } from "@/components/LangSwitcher";
import { useLang } from "@/contexts/LangContext";
import { playTapSound } from "@/lib/sound";
import { toast } from "sonner";

interface NameEntryStepProps {
  guestName: string;
  guestPhone: string;
  previousName: string;
  peopleCount: number;
  seatOrTableNo: string;
  isBusy: boolean;
  isResuming: boolean;
  setGuestName: (name: string) => void;
  setGuestPhone: (phone: string) => void;
  setPeopleCount: (count: number) => void;
  setSeatOrTableNo: (val: string) => void;
  onSubmit: () => void;
}

const PEOPLE_OPTIONS = [1, 2, 3, 4, 5, 6];

export function NameEntryStep({
  guestName,
  guestPhone,
  previousName,
  peopleCount,
  seatOrTableNo,
  isBusy,
  isResuming,
  setGuestName,
  setGuestPhone,
  setPeopleCount,
  setSeatOrTableNo,
  onSubmit,
}: NameEntryStepProps) {
  const { t } = useLang();
  const [nameError, setNameError] = useState(false);
  const [seatError, setSeatError] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const seatInputRef = useRef<HTMLInputElement>(null);
  const isSingle = peopleCount === 1;

  const displaySeatVal = seatOrTableNo.replace(/\(\d+p\)/gi, "").trim();

  const handleQuickSeat = (num: string) => {
    playTapSound();
    setSeatOrTableNo(num);
    if (seatError) setSeatError(false);
  };

  const handleFormSubmit = () => {
    if (!guestName.trim()) {
      setNameError(true);
      nameInputRef.current?.focus();
      toast.error(t.nameRequiredError || "Please enter your name to continue");
      return;
    }
    setNameError(false);

    if (!displaySeatVal.trim()) {
      setSeatError(true);
      seatInputRef.current?.focus();
      toast.error(t.seatRequiredError || "Please enter or select your seat / table number");
      return;
    }
    setSeatError(false);
    onSubmit();
  };

  if (isResuming) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin h-8 w-8 text-amber-600" />
          <p className="text-sm text-stone-500 font-medium">{t.resumingVisit || "Resuming your visit…"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100/70 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 text-stone-900 dark:text-stone-100">
      <div className="w-full max-w-md">
        {/* Main Clean Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-stone-200/50 dark:shadow-none border border-stone-200/80 dark:border-zinc-800">
          
          {/* Card Top Header */}
          <div className="pb-5 border-b border-stone-100 dark:border-zinc-800/80">
            {/* Top Row: Brand & Language Switcher */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                  Q
                </div>
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  {t.hotelName}
                </span>
              </div>
              <div className="shrink-0">
                <LangSwitcher />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-stone-900 dark:text-white leading-tight">
                {t.welcome || "Welcome"}
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                {t.enterName || "Enter your name to continue"}
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 pt-5">
            
            {/* 1. Full Name (Compulsory *) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span>{t.namePlaceholder || "Your Full Name"}</span>
                <span className="text-red-500 font-bold text-sm">*</span>
              </label>
              <div className="relative">
                <Input
                  ref={nameInputRef}
                  placeholder={t.namePlaceholder || "Enter your full name"}
                  value={guestName}
                  onChange={(e) => {
                    setGuestName(e.target.value);
                    if (nameError && e.target.value.trim()) setNameError(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && !isBusy && handleFormSubmit()}
                  className={`h-12 text-sm sm:text-base px-3.5 bg-stone-50 dark:bg-zinc-800/80 rounded-xl font-medium transition-all ${
                    nameError
                      ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/30"
                      : "border-stone-200 dark:border-zinc-700 focus:border-stone-900 dark:focus:border-amber-500 focus:bg-white dark:focus:bg-zinc-800"
                  }`}
                  autoFocus
                  disabled={isBusy}
                />
              </div>

              {/* Red Error Message if empty */}
              {nameError && (
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.nameRequiredError || "Please enter your name to continue"}</span>
                </p>
              )}

              {/* Autofill Previous Name pill */}
              {previousName && guestName.trim() !== previousName.trim() && (
                <div className="flex items-center gap-1 mt-1.5 text-xs text-stone-500">
                  <span>{t.tapToAutofill}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setGuestName(previousName);
                      setNameError(false);
                    }}
                    className="font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    {previousName}
                  </button>
                </div>
              )}
            </div>

            {/* 2. Party Size (Sleek Single-Row Segmented Control) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t.peopleCountLabel || "Party Size"}</span>
                </label>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  {isSingle ? t.singlePerson || "1 Person" : `${peopleCount} ${t.partySize || "People"}`}
                </span>
              </div>

              <div className="grid grid-cols-6 gap-1 p-1 bg-stone-100 dark:bg-zinc-800 rounded-2xl border border-stone-200/60 dark:border-zinc-700">
                {PEOPLE_OPTIONS.map((num) => {
                  const selected = peopleCount === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        playTapSound();
                        setPeopleCount(num);
                      }}
                      className={`h-10 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                        selected
                          ? "bg-stone-900 text-white dark:bg-amber-500 dark:text-stone-950 shadow-xs scale-[1.02]"
                          : "text-stone-600 dark:text-stone-400 hover:text-stone-900 hover:bg-white/60 dark:hover:bg-zinc-700"
                      }`}
                    >
                      <span>{num === 6 ? "6+" : num}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Table / Seat Number (Compulsory *) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  {isSingle ? (
                    <>
                      <Armchair className="w-3.5 h-3.5 text-stone-400" />
                      <span>{t.seatNo || "Seat Number"}</span>
                    </>
                  ) : (
                    <>
                      <UtensilsCrossed className="w-3.5 h-3.5 text-stone-400" />
                      <span>{t.tableNo || "Table Number"}</span>
                    </>
                  )}
                  <span className="text-red-500 font-bold text-sm">*</span>
                </label>
                <span className="text-[11px] text-stone-400">
                  {isSingle ? "Counter / Solo" : "Dine-in"}
                </span>
              </div>

              <div className="relative">
                <Input
                  ref={seatInputRef}
                  placeholder={
                    isSingle
                      ? t.seatNoPlaceholder || "e.g. S-1 or Counter"
                      : t.tableNoPlaceholder || "e.g. Table 4 or Hall"
                  }
                  value={displaySeatVal}
                  onChange={(e) => {
                    setSeatOrTableNo(e.target.value);
                    if (seatError && e.target.value.trim()) setSeatError(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && !isBusy && handleFormSubmit()}
                  className={`h-12 text-sm sm:text-base px-3.5 bg-stone-50 dark:bg-zinc-800/80 rounded-xl font-medium transition-all ${
                    seatError
                      ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/30"
                      : "border-stone-200 dark:border-zinc-700 focus:border-stone-900 dark:focus:border-amber-500 focus:bg-white dark:focus:bg-zinc-800"
                  }`}
                  disabled={isBusy}
                />
              </div>

              {/* Red Error Message if empty */}
              {seatError && (
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.seatRequiredError || "Please enter or select your seat / table number"}</span>
                </p>
              )}

              {/* Quick Preset Selector Chips */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {(isSingle ? ["S-1", "S-2", "S-3", "Counter"] : ["T-1", "T-2", "T-3", "T-4", "Hall"]).map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => handleQuickSeat(quick)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer active:scale-95 ${
                      displaySeatVal.toLowerCase() === quick.toLowerCase()
                        ? "bg-stone-900 text-white dark:bg-amber-500 dark:text-stone-950 border-stone-900 dark:border-amber-500"
                        : "bg-stone-50 dark:bg-zinc-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-zinc-700 hover:bg-stone-100"
                    }`}
                  >
                    {quick}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Phone Number (Optional - Right above Continue button) */}
            <div>
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{t.phoneLabel || "Phone Number"}</span>
                  <span className="text-stone-400 font-normal text-[11px]">({t.optionalLabel || "Optional"})</span>
                </label>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/40 shrink-0 whitespace-nowrap">
                  ⭐ {t.phoneVipTag || "VIP Rewards"}
                </span>
              </div>
              <div className="relative">
                <Input
                  type="tel"
                  inputMode="tel"
                  placeholder="0300-1234567"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isBusy && handleFormSubmit()}
                  className="h-12 text-sm sm:text-base px-3.5 font-mono bg-stone-50 dark:bg-zinc-800/80 border-stone-200 dark:border-zinc-700 rounded-xl focus:border-stone-900 dark:focus:border-amber-500 focus:bg-white dark:focus:bg-zinc-800 transition-all pr-9"
                  disabled={isBusy}
                />
                {guestPhone && (
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setGuestPhone("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* 5. Primary Action CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleFormSubmit}
                disabled={isBusy}
                className="w-full h-13 bg-stone-950 hover:bg-black dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-stone-950 text-white text-sm sm:text-base font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/10 dark:shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isBusy ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    <span>{t.continueBtn || "Continue to Menu"}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Subtle Live Ticker */}
        <div className="mt-4 text-center">
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t.liveTicker || "Fresh & Crispy Lachha Paratha & Karak Chai Live"}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
