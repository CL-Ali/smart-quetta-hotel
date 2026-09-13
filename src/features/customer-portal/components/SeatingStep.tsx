"use client";

import React, { useState, useRef } from "react";
import { Users, Armchair, UtensilsCrossed, Loader2, ArrowRight, User, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LangSwitcher } from "@/components/LangSwitcher";
import { useLang } from "@/contexts/LangContext";
import { playTapSound } from "@/lib/sound";
import { toast } from "sonner";

interface SeatingStepProps {
  guestName: string;
  peopleCount: number;
  seatOrTableNo: string;
  isBusy: boolean;
  setPeopleCount: (count: number) => void;
  setSeatOrTableNo: (val: string) => void;
  onSubmit: () => void;
  onChangeName: () => void;
}

const PEOPLE_OPTIONS = [1, 2, 3, 4, 5, 6];

export function SeatingStep({
  guestName,
  peopleCount,
  seatOrTableNo,
  isBusy,
  setPeopleCount,
  setSeatOrTableNo,
  onSubmit,
  onChangeName,
}: SeatingStepProps) {
  const { t } = useLang();
  const [seatError, setSeatError] = useState(false);
  const seatInputRef = useRef<HTMLInputElement>(null);
  const isSingle = peopleCount === 1;

  // Clean initial seat/table number if it contains extra labels
  const displaySeatVal = seatOrTableNo.replace(/\(\d+p\)/gi, "").trim();

  const handleQuickSeat = (num: string) => {
    playTapSound();
    setSeatOrTableNo(num);
    if (seatError) setSeatError(false);
  };

  const handleFormSubmit = () => {
    if (!displaySeatVal.trim()) {
      setSeatError(true);
      seatInputRef.current?.focus();
      toast.error(t.seatRequiredError || "Please enter or select your seat / table number");
      return;
    }
    setSeatError(false);
    onSubmit();
  };

  return (
    <div className="min-h-screen bg-stone-100/70 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 text-stone-900 dark:text-stone-100">
      <div className="w-full max-w-md">
        {/* Main Clean Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-stone-200/50 dark:shadow-none border border-stone-200/80 dark:border-zinc-800">
          
          {/* Card Top Header */}
          <div className="pb-5 border-b border-stone-100 dark:border-zinc-800/80">
            {/* Top Row: Brand Icon, Hotel Name & Language Switcher */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                  {isSingle ? (
                    <Armchair className="w-4 h-4 stroke-[2.2]" />
                  ) : (
                    <UtensilsCrossed className="w-4 h-4 stroke-[2.2]" />
                  )}
                </div>
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  {t.hotelName}
                </span>
              </div>
              <div className="shrink-0">
                <LangSwitcher />
              </div>
            </div>

            {/* Main Greeting (Full Card Width - Never Truncated) */}
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-stone-900 dark:text-white leading-tight">
                {t.welcomeBack}, <span className="text-amber-600 dark:text-amber-400">{guestName || "Guest"}</span>
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                {isSingle ? (t.singlePerson || "Single Seating") : (t.partySize || "Table Seating")} • {t.selectSeatingTitle || "Confirm your seating"}
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="space-y-4 pt-5">
            
            {/* 1. Party Size (Sleek Single-Row Segmented Control) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t.peopleCountLabel || "Party Size"}</span>
                </label>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  {isSingle
                    ? t.singlePerson || "1 Person"
                    : `${peopleCount} ${t.partySize || "People"}`}
                </span>
              </div>

              {/* Single row segmented control */}
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

            {/* 2. Seat vs Table Number Input (Compulsory *) */}
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
                  className={`h-12 text-sm sm:text-base px-3.5 bg-stone-50 dark:bg-zinc-800/80 rounded-xl font-medium transition-all text-center ${
                    seatError
                      ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/30"
                      : "border-stone-200 dark:border-zinc-700 focus:border-stone-900 dark:focus:border-amber-500 focus:bg-white dark:focus:bg-zinc-800"
                  }`}
                  disabled={isBusy}
                  autoFocus
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

            {/* 3. Confirm & View Menu CTA */}
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
                    <span>{t.confirmSeatingBtn || "Confirm & View Menu"}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Change Name Option */}
          <div className="mt-5 pt-4 text-center border-t border-stone-100 dark:border-zinc-800/80">
            <button
              type="button"
              disabled={isBusy}
              onClick={onChangeName}
              className="text-xs text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 font-medium transition cursor-pointer inline-flex items-center gap-1.5 p-1 rounded-lg"
            >
              <User className="w-3.5 h-3.5 text-stone-400" />
              <span>{t.differentPerson || "Not you? Change name"}</span>
            </button>
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

