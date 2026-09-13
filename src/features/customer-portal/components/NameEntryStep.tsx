"use client";

import React, { useState, useRef } from "react";
import { FaUser, FaPhone, FaUsers, FaUtensils, FaChair, FaArrowRight, FaSpinner, FaCircleExclamation, FaXmark } from "react-icons/fa6";
import { Input } from "@/components/ui/input";
import { LangSwitcher } from "@/components/LangSwitcher";
import { useLang } from "@/contexts/LangContext";
import { playTapSound, unlockAudio } from "@/lib/sound";
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
    playTapSound();
    onSubmit();
  };

  if (isResuming) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <FaSpinner className="animate-spin h-7 w-7 text-amber-500" />
          <p className="text-sm text-stone-500 dark:text-zinc-400 font-medium">{t.resumingVisit || "Resuming your visit…"}</p>
        </div>
      </div>
    );
  }

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
                  <FaUtensils className="w-3.5 h-3.5" />
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
              {t.welcome || "Welcome"}
            </h1>
            <p className="text-xs text-stone-500 dark:text-zinc-400 font-normal mt-0.5">
              {t.enterName || "Enter details to proceed to menu"}
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            
            {/* 1. Full Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <FaUser className="w-3 h-3 text-stone-400" />
                  <span>{t.namePlaceholder || "Your Full Name"}</span>
                  <span className="text-red-500">*</span>
                </label>

                {previousName && guestName.trim() !== previousName.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      unlockAudio();
                      playTapSound();
                      setGuestName(previousName);
                      setNameError(false);
                    }}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer font-medium"
                  >
                    Use &quot;{previousName}&quot;
                  </button>
                )}
              </div>

              <div className="relative">
                <Input
                  ref={nameInputRef}
                  placeholder={t.namePlaceholder || "e.g. Ali Khan"}
                  value={guestName}
                  onChange={(e) => {
                    setGuestName(e.target.value);
                    if (nameError && e.target.value.trim()) setNameError(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && !isBusy && handleFormSubmit()}
                  className={`h-11 text-sm px-3.5 bg-stone-50 dark:bg-zinc-800/80 rounded-xl font-medium transition-all ${
                    nameError
                      ? "border-red-500 ring-1 ring-red-500/30"
                      : "border-stone-200 dark:border-zinc-700 focus:border-stone-900 dark:focus:border-stone-100"
                  }`}
                  autoFocus
                  disabled={isBusy}
                />
              </div>

              {nameError && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <FaCircleExclamation className="w-3 h-3 shrink-0" />
                  <span>{t.nameRequiredError || "Please enter your name"}</span>
                </p>
              )}
            </div>

            {/* 2. Party Size */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <FaUsers className="w-3 h-3 text-stone-400" />
                  <span>{t.peopleCountLabel || "Party Size"}</span>
                </label>
                <span className="text-xs text-stone-500 dark:text-zinc-400 font-medium">
                  {isSingle ? (t.singlePerson || "1 Person") : `${peopleCount} ${t.partySize || "People"}`}
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

            {/* 3. Table / Seat Number */}
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
                  className={`h-11 text-sm px-3.5 bg-stone-50 dark:bg-zinc-800/80 rounded-xl font-medium transition-all ${
                    seatError
                      ? "border-red-500 ring-1 ring-red-500/30"
                      : "border-stone-200 dark:border-zinc-700 focus:border-stone-900 dark:focus:border-stone-100"
                  }`}
                  disabled={isBusy}
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

            {/* 4. Phone Number (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <FaPhone className="w-3 h-3 text-stone-400" />
                  <span>{t.phoneLabel || "Phone Number"}</span>
                </label>
                <span className="text-[11px] text-stone-400">
                  {t.optionalLabel || "Optional"}
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
                  className="h-11 text-sm px-3.5 font-mono bg-stone-50 dark:bg-zinc-800/80 border-stone-200 dark:border-zinc-700 rounded-xl focus:border-stone-900 dark:focus:border-stone-100 transition-all pr-8"
                  disabled={isBusy}
                />
                {guestPhone && (
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      unlockAudio();
                      playTapSound();
                      setGuestPhone("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    <FaXmark className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 5. Submit CTA */}
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
                    <span>{t.continueBtn || "Continue to Menu"}</span>
                    <FaArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


