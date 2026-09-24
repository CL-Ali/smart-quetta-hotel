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
    <div className="min-h-screen bg-[#F8F3EC] dark:bg-[#0B0F17] flex flex-col items-center justify-center p-4 sm:p-6 text-[#24180A] dark:text-[#F8FAFC]">
      <div className="w-full max-w-sm">
        
        {/* Floating Squircle Card */}
        <div className="bg-white dark:bg-[#121824] rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 border-0 shadow-none">
          
          {/* Header */}
          <div className="pb-4 mb-4 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#D98A3C] text-white font-bold text-xs flex items-center justify-center shrink-0">
                  <FaUtensils className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-[#24180A] dark:text-stone-200">
                  {t.hotelName}
                </span>
              </div>
              <div className="shrink-0">
                <LangSwitcher />
              </div>
            </div>

            <h1 className="text-xl font-black tracking-tight text-[#24180A] dark:text-white">
              {t.welcome || "Welcome"}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-1">
              {t.enterName || "Enter details to proceed to menu"}
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            
            {/* 1. Full Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <FaUser className="w-3 h-3 text-[#D98A3C]" />
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
                    className="text-[11px] text-[#D98A3C] hover:underline cursor-pointer font-bold"
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
                  className={`h-12 text-sm px-4 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl font-bold transition-all border-0 focus:ring-2 focus:ring-amber-500/30 ${
                    nameError
                      ? "ring-2 ring-red-500/50"
                      : ""
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <FaUsers className="w-3 h-3 text-[#D98A3C]" />
                  <span>{t.peopleCountLabel || "Party Size"}</span>
                </label>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-bold">
                  {isSingle ? (t.singlePerson || "1 Person") : `${peopleCount} ${t.partySize || "People"}`}
                </span>
              </div>

              <div className="grid grid-cols-6 gap-1.5 p-1 bg-[#F8F3EC] dark:bg-[#182030] rounded-full">
                {PEOPLE_OPTIONS.map((num) => {
                  const selected = peopleCount === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleSelectParty(num)}
                      className={`h-9 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center border-0 ${
                        selected
                          ? "bg-[#D98A3C] text-white shadow-none font-black"
                          : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  {isSingle ? (
                    <>
                      <FaChair className="w-3 h-3 text-[#D98A3C]" />
                      <span>{t.seatNo || "Seat Number"}</span>
                    </>
                  ) : (
                    <>
                      <FaUtensils className="w-3 h-3 text-[#D98A3C]" />
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
                  className={`h-12 text-sm px-4 bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl font-bold transition-all border-0 focus:ring-2 focus:ring-amber-500/30 ${
                    seatError
                      ? "ring-2 ring-red-500/50"
                      : ""
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
                      className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer border-0 ${
                        isMatch
                          ? "bg-[#D98A3C] text-white font-black shadow-none"
                          : "bg-[#F8F3EC] dark:bg-[#182030] text-stone-600 dark:text-stone-300 hover:bg-stone-200/60"
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <FaPhone className="w-3 h-3 text-[#D98A3C]" />
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
                  className="h-12 text-sm px-4 font-mono bg-[#F8F3EC] dark:bg-[#182030] rounded-2xl focus:ring-2 focus:ring-amber-500/30 transition-all pr-10 border-0"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer p-1"
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
                className="w-full h-12 bg-[#D98A3C] hover:bg-[#c27931] text-white text-sm font-bold rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-none transition-all active:scale-[0.99] disabled:opacity-50"
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


