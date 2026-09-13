"use client";

import React from "react";
import { Hotel, Check, Sparkles, ArrowRight } from "lucide-react";
import { useLang, LANG_OPTIONS } from "@/contexts/LangContext";

interface LangSelectScreenProps {
  onDone: () => void;
}

export function LangSelectScreen({ onDone }: LangSelectScreenProps) {
  const { lang, setLang, t } = useLang();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-4 sm:px-6 py-8">
      <div className="w-full max-w-sm">
        {/* Material 3 Brand Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 shadow-inner">
            <Hotel className="w-10 h-10 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/60 px-3 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60 mb-2">
            Smart POS & Guest Portal
          </span>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight">
            {t.hotelName || "Quetta Hotel"}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400 mt-1 font-medium">
            Choose Language • اپنی زبان منتخب کریں
          </p>
        </div>

        {/* Material 3 Language Selection Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {LANG_OPTIONS.map((opt) => {
            const isSelected = lang === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setLang(opt.value)}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all cursor-pointer select-none active:scale-95 text-left shadow-2xs ${
                  isSelected
                    ? "border-amber-500 bg-amber-500/10 dark:bg-amber-500/20 text-stone-950 dark:text-amber-200 ring-2 ring-amber-500/30 font-black shadow-sm"
                    : "border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-stone-700 dark:text-zinc-300 hover:border-amber-300"
                }`}
              >
                <span className="text-xl shrink-0">{opt.flag}</span>
                <span className="flex-1 text-xs sm:text-sm font-bold truncate">{opt.label}</span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow-2xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={onDone}
          className="w-full h-14 bg-stone-950 hover:bg-black dark:bg-white dark:text-black active:scale-[0.98] transition-all text-white text-base sm:text-lg font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-black/10"
        >
          <span>{t.continueBtn || "Continue"}</span>
          <ArrowRight className="w-5 h-5 rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}
