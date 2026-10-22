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
    <div className="min-h-screen bg-[#F8F3EC] dark:bg-[#0B0F17] flex flex-col items-center justify-center p-4 sm:p-6 text-[#24180A] dark:text-stone-100">
      <div className="w-full max-w-md">
        
        {/* Floating Squircle Card */}
        <div className="bg-white dark:bg-[#121824] rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 border-0 shadow-none transition-all">
          
          {/* Header */}
          <div className="pb-5 mb-5 border-b border-[#F0E6D8]/60 dark:border-white/5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#D98A3C]/15 text-[#D98A3C] font-bold text-sm flex items-center justify-center shrink-0">
                  {isSingle ? (
                    <FaChair className="w-4 h-4" />
                  ) : (
                    <FaUtensils className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#24180A] dark:text-white uppercase tracking-wider block">
                    {t.hotelName}
                  </span>
                  <span className="text-[11px] text-[#786B5D] dark:text-zinc-400 font-medium">Smart Dining Portal</span>
                </div>
              </div>
              <div className="shrink-0">
                <LangSwitcher />
              </div>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-[#24180A] dark:text-white">
              {t.welcomeBack || "Welcome back"}, <span className="text-[#D98A3C]">{guestName || "Guest"}</span>
            </h1>
            <p className="text-xs text-[#786B5D] dark:text-zinc-400 font-medium mt-1">
              {isSingle ? (t.singlePerson || "Single Seating") : (t.partySize || "Table Seating")} • {t.selectSeatingTitle || "Confirm table number"}
            </p>
          </div>

          {/* Form Content */}
          <div className="space-y-5">
            
            {/* 1. Party Size */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#4A3E31] dark:text-zinc-300 flex items-center gap-1.5">
                  <FaUsers className="w-3.5 h-3.5 text-[#D98A3C]" />
                  <span>{t.peopleCountLabel || "Party Size"}</span>
                </label>
                <span className="text-xs text-[#786B5D] dark:text-zinc-400 font-semibold">
                  {isSingle
                    ? t.singlePerson || "1 Person"
                    : `${peopleCount} ${t.partySize || "People"}`}
                </span>
              </div>

              <div className="grid grid-cols-6 gap-1.5 p-1.5 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-2xl border-0">
                {PEOPLE_OPTIONS.map((num) => {
                  const selected = peopleCount === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleSelectParty(num)}
                      className={`h-10 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center border-0 ${
                        selected
                          ? "bg-[#D98A3C] text-white shadow-none font-extrabold scale-[1.02]"
                          : "text-[#4A3E31] dark:text-zinc-300 hover:text-[#24180A] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#4A3E31] dark:text-zinc-300 flex items-center gap-1.5">
                  {isSingle ? (
                    <>
                      <FaChair className="w-3.5 h-3.5 text-[#D98A3C]" />
                      <span>{t.seatNo || "Seat Number"}</span>
                    </>
                  ) : (
                    <>
                      <FaUtensils className="w-3.5 h-3.5 text-[#D98A3C]" />
                      <span>{t.tableNo || "Table Number"}</span>
                    </>
                  )}
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-[#786B5D] dark:text-zinc-400 font-semibold">
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
                  className={`h-12 text-sm px-4 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-2xl font-bold transition-all text-center border-0 placeholder:text-[#786B5D]/60 dark:placeholder:text-zinc-500 text-[#24180A] dark:text-white ${
                    seatError
                      ? "ring-2 ring-red-500"
                      : "focus-visible:ring-2 focus-visible:ring-[#D98A3C]"
                  }`}
                  disabled={isBusy}
                  autoFocus
                />
              </div>

              {seatError && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1.5 font-medium">
                  <FaCircleExclamation className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.seatRequiredError || "Please enter seat or table number"}</span>
                </p>
              )}

              {/* Minimal Table Presets */}
              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
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
                      className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 transition-all cursor-pointer ${
                        isMatch
                          ? "bg-[#D98A3C] text-white shadow-none font-extrabold"
                          : "bg-[#F8F3EC] dark:bg-[#1A2232] text-[#4A3E31] dark:text-zinc-300 hover:bg-[#EFE6DC] dark:hover:bg-[#222C40]"
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
                className="w-full h-13 bg-[#D98A3C] hover:bg-[#C27930] text-white text-sm font-black rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-none transition-all active:scale-[0.98] disabled:opacity-50"
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
          <div className="mt-5 pt-4 text-center border-t border-[#F0E6D8]/60 dark:border-white/5">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => {
                unlockAudio();
                playTapSound();
                onChangeName();
              }}
              className="text-xs text-[#786B5D] dark:text-zinc-400 hover:text-[#D98A3C] dark:hover:text-[#D98A3C] font-semibold transition cursor-pointer inline-flex items-center gap-1.5 p-1"
            >
              <FaUser className="w-3 h-3 text-[#786B5D]" />
              <span>{t.differentPerson || "Not you? Change name"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



