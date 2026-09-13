"use client";

import React, { useState, useRef } from "react";
import { FaUsers, FaChair, FaUtensils, FaSpinner, FaArrowRight, FaUser, FaCircleExclamation } from "react-icons/fa6";
import { Input } from "@/components/ui/input";
import { LangSwitcher } from "@/components/LangSwitcher";
import { useLang } from "@/contexts/LangContext";
import { playTapSound, unlockAudio } from "@/lib/sound";
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
    unlockAudio();
    playTapSound();
    setSeatOrTableNo(num);
    if (seatError) setSeatError(false);
  };

  const handleSelectParty = (num: number) => {
    unlockAudio();
    playTapSound();
    setPeopleCount(num);
  };

  const handleFormSubmit = () => {
    unlockAudio();
    if (!displaySeatVal.trim()) {
      setSeatError(true);
      seatInputRef.current?.focus();
      toast.error(t.seatRequiredError || "Please enter or select your seat / table number");
      return;
    }
    setSeatError(false);
    playTapSound();
    onSubmit();
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 text-stone-900 dark:text-stone-100">
      <div className="w-full max-w-sm">
        
        {/* Minimal Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-stone-200 dark:border-zinc-800">
          
          {/* Header */}
          <div className="pb-4 mb-4 border-b border-stone-100 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center shrink-0">
                  {isSingle ? (
                    <FaChair className="w-3.5 h-3.5" />
                  ) : (
                    <FaUtensils className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  {t.hotelName}
                </span>
              </div>
              <div className="shrink-0">
                <LangSwitcher />
              </div>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white">
              {t.welcomeBack || "Welcome back"}, <span className="text-amber-600 dark:text-amber-400">{guestName || "Guest"}</span>
            </h1>
            <p className="text-xs text-stone-500 dark:text-zinc-400 font-normal mt-0.5">
              {isSingle ? (t.singlePerson || "Single Seating") : (t.partySize || "Table Seating")} • {t.selectSeatingTitle || "Confirm table number"}
            </p>
          </div>

          {/* Form Content */}
          <div className="space-y-4">
            
            {/* 1. Party Size */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <FaUsers className="w-3 h-3 text-stone-400" />
                  <span>{t.peopleCountLabel || "Party Size"}</span>
                </label>
                <span className="text-xs text-stone-500 dark:text-zinc-400 font-medium">
                  {isSingle
                    ? t.singlePerson || "1 Person"
                    : `${peopleCount} ${t.partySize || "People"}`}
                </span>
              </div>

              <div className="grid grid-cols-6 gap-1 p-1 bg-stone-100 dark:bg-zinc-800 rounded-xl border border-stone-200 dark:border-zinc-700">
                {PEOPLE_OPTIONS.map((num) => {
                  const selected = peopleCount === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleSelectParty(num)}
                      className={`h-9 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                        selected
                          ? "bg-stone-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs"
                          : "text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-white"
                      }`}
                    >
                      <span>{num === 6 ? "6+" : num}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Seat vs Table Number Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  {isSingle ? (
                    <>
                      <FaChair className="w-3 h-3 text-stone-400" />
                      <span>{t.seatNo || "Seat Number"}</span>
                    </>
                  ) : (
                    <>
                      <FaUtensils className="w-3 h-3 text-stone-400" />
                      <span>{t.tableNo || "Table Number"}</span>
                    </>
                  )}
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-stone-400">
                  {isSingle ? "Solo / Counter" : "Dine-in"}
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
                  className={`h-11 text-sm px-3.5 bg-stone-50 dark:bg-zinc-800/80 rounded-xl font-medium transition-all text-center ${
                    seatError
                      ? "border-red-500 ring-1 ring-red-500/30"
                      : "border-stone-200 dark:border-zinc-700 focus:border-stone-900 dark:focus:border-stone-100"
                  }`}
                  disabled={isBusy}
                  autoFocus
                />
              </div>

              {seatError && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <FaCircleExclamation className="w-3 h-3 shrink-0" />
                  <span>{t.seatRequiredError || "Please enter seat or table number"}</span>
                </p>
              )}

              {/* Minimal Table Presets */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {(isSingle 
                  ? ["S-1", "S-2", "S-3", "Counter"] 
                  : ["T-1", "T-2", "T-3", "T-4", "T-5", "Hall"]
                ).map((quick) => {
                  const isMatch = displaySeatVal.toLowerCase() === quick.toLowerCase();
                  return (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => handleQuickSeat(quick)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        isMatch
                          ? "bg-stone-900 text-white dark:bg-white dark:text-zinc-950 border-stone-900 dark:border-white font-semibold"
                          : "bg-white dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 border-stone-200 dark:border-zinc-700 hover:border-stone-400"
                      }`}
                    >
                      {quick}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Confirm CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleFormSubmit}
                disabled={isBusy}
                className="w-full h-12 bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-100 dark:text-zinc-950 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {isBusy ? (
                  <FaSpinner className="animate-spin w-4 h-4" />
                ) : (
                  <>
                    <span>{t.confirmSeatingBtn || "Open Menu"}</span>
                    <FaArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Change Name Option */}
          <div className="mt-4 pt-3 text-center border-t border-stone-100 dark:border-zinc-800">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => {
                unlockAudio();
                playTapSound();
                onChangeName();
              }}
              className="text-xs text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 font-medium transition cursor-pointer inline-flex items-center gap-1.5 p-1"
            >
              <FaUser className="w-3 h-3 text-stone-400" />
              <span>{t.differentPerson || "Not you? Change name"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



