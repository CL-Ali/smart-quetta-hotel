"use client";

import React from "react";
import { FaArrowRight, FaCheck, FaUtensils, FaGlobe } from "react-icons/fa6";
import { useLang, LANG_OPTIONS } from "@/contexts/LangContext";
import { playTapSound, unlockAudio } from "@/lib/sound";

interface LangSelectScreenProps {
  onDone: () => void;
}

export function LangSelectScreen({ onDone }: LangSelectScreenProps) {
  const { lang, setLang, t } = useLang();

  const handleSelectLang = (val: typeof lang) => {
    unlockAudio();
    playTapSound();
    setLang(val);
  };

  const handleContinue = () => {
    unlockAudio();
    playTapSound();
    onDone();
  };

  return (
    <div className="min-h-screen bg-[#F8F3EC] dark:bg-[#0B0F17] flex flex-col items-center justify-center p-4 sm:p-6 text-[#24180A] dark:text-[#F8FAFC]">
      <div className="w-full max-w-sm">
        {/* Floating Squircle Card */}
        <div className="bg-white dark:bg-[#121824] rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 border-0 shadow-none flex flex-col items-center">
          
          {/* Brand Header */}
          <div className="text-center mb-6 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-[#D98A3C] text-white flex items-center justify-center mb-3 shadow-none">
              <FaUtensils className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#24180A] dark:text-white tracking-tight">
              {t.hotelName || "Smart Hotel"}
            </h1>
            <p className="text-xs text-[#786B5D] dark:text-stone-400 font-medium mt-1">
              Choose Language / اپنی زبان منتخب کریں
            </p>
          </div>

          {/* Language Grid */}
          <div className="w-full grid grid-cols-2 gap-2.5 mb-6">
            {LANG_OPTIONS.map((opt) => {
              const isSelected = lang === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectLang(opt.value)}
                  className={`flex items-center justify-between p-3.5 min-h-[58px] rounded-2xl transition-all cursor-pointer select-none text-left border-0 ${
                    isSelected
                      ? "bg-[#D98A3C] text-white font-bold shadow-none scale-[1.02]"
                      : "bg-[#F8F3EC] dark:bg-[#1A2232] text-[#24180A] dark:text-zinc-200 hover:bg-[#EFE7DC] dark:hover:bg-[#222C40]"
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-sm sm:text-base font-black truncate leading-tight">
                      {opt.nativeName}
                    </span>
                    <span
                      className={`text-[11px] font-semibold mt-0.5 ${
                        isSelected ? "text-white/90 font-bold" : "text-[#786B5D] dark:text-zinc-400"
                      }`}
                    >
                      {opt.englishName}
                    </span>
                  </div>
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-white text-[#D98A3C] flex items-center justify-center shrink-0 shadow-none font-bold">
                      <FaCheck className="w-2.5 h-2.5" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-stone-300 dark:border-zinc-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Primary Button */}
          <button
            type="button"
            onClick={handleContinue}
            className="w-full h-12 bg-[#24180A] hover:bg-black dark:bg-[#D98A3C] dark:hover:bg-[#C27930] text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-none transition-all active:scale-[0.99]"
          >
            <span>{t.continueBtn || "Continue"}</span>
            <FaArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>

          {/* Footer Info */}
          <p className="text-[11px] text-[#786B5D] dark:text-stone-400 font-medium text-center mt-5">
            Smart Dining & Contactless Ordering
          </p>
        </div>
      </div>
    </div>
  );
}


