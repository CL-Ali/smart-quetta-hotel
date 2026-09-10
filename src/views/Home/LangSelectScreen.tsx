"use client";

import React from "react";
import { Hotel, Check } from "lucide-react";
import { useLang, LANG_OPTIONS } from "@/contexts/LangContext";

interface LangSelectScreenProps {
  onDone: () => void;
}

/**
 * Full-screen language selection presented on initial customer arrival.
 */
export function LangSelectScreen({ onDone }: LangSelectScreenProps) {
  const { lang, setLang } = useLang();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Brand header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-full mb-3 shadow-inner">
            <Hotel className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Quetta Hotel</h1>
          <p className="text-sm text-gray-500 mt-1">Choose your language / زبان منتخب کریں</p>
        </div>

        {/* Language choices */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLang(opt.value)}
              className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer ${
                lang === opt.value
                  ? "border-orange-500 bg-orange-50 text-orange-800"
                  : "border-gray-200 text-gray-700 hover:border-orange-300"
              }`}
            >
              <span className="text-lg">{opt.flag}</span>
              <span className="flex-1 text-left">{opt.label}</span>
              {lang === opt.value && <Check className="w-4 h-4 text-orange-600 shrink-0" />}
            </button>
          ))}
        </div>

        {/* Continue button */}
        <button
          onClick={onDone}
          className="w-full h-14 bg-black hover:bg-black/90 active:scale-[0.98] transition-transform text-white text-lg font-semibold rounded-xl flex items-center justify-center cursor-pointer shadow-sm"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
