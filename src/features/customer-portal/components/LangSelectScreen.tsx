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
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-4 sm:px-6 py-8">
      <div className="w-full max-w-sm flex flex-col items-center">
        
        {/* Minimal Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center mb-4 shadow-sm">
            <FaUtensils className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white tracking-tight">
            {t.hotelName || "Quetta Hotel"}
          </h1>
          <p className="text-xs text-stone-500 dark:text-zinc-400 font-medium mt-1">
            Choose Language / اپنی زبان منتخب کریں
          </p>
        </div>

        {/* Minimal Language Grid (No Emojis) */}
        <div className="w-full grid grid-cols-2 gap-2.5 mb-6">
          {LANG_OPTIONS.map((opt) => {
            const isSelected = lang === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectLang(opt.value)}
                className={`flex items-center justify-between p-3.5 min-h-[58px] rounded-2xl border transition-all cursor-pointer select-none text-left ${
                  isSelected
                    ? "border-amber-500 bg-amber-500 text-stone-950 font-bold shadow-xs scale-[1.02]"
                    : "border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-stone-700 dark:text-zinc-300 hover:border-stone-300 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-sm sm:text-base font-black truncate leading-tight">
                    {opt.nativeName}
                  </span>
                  <span
                    className={`text-[11px] font-semibold mt-0.5 ${
                      isSelected ? "text-stone-900 font-bold" : "text-stone-400 dark:text-zinc-500"
                    }`}
                  >
                    {opt.englishName}
                  </span>
                </div>
                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-stone-950 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <FaCheck className="w-2.5 h-2.5" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-stone-300 dark:border-zinc-700 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Minimal Primary Button */}
        <button
          type="button"
          onClick={handleContinue}
          className="w-full h-12 bg-stone-900 hover:bg-black dark:bg-white dark:hover:bg-stone-100 dark:text-zinc-950 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all active:scale-[0.99]"
        >
          <span>{t.continueBtn || "Continue"}</span>
          <FaArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>

        {/* Minimal Footer Info */}
        <p className="text-[11px] text-stone-400 dark:text-zinc-500 font-medium text-center mt-6">
          Smart Dining & Contactless Ordering
        </p>
      </div>
    </div>
  );
}


