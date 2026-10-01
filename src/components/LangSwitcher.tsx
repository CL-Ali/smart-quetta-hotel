"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLang, LANG_OPTIONS, Lang } from "@/contexts/LangContext";
import { Globe, Check, ChevronDown } from "lucide-react";
import { playTapSound, unlockAudio } from "@/lib/sound";

interface LangSwitcherProps {
  className?: string;
  variant?: "pill" | "minimal" | "compact";
}

export function LangSwitcher({ className = "", variant = "pill" }: LangSwitcherProps) {
  const { lang, setLang, availableOptions } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOpt = availableOptions.find((opt) => opt.value === lang) || availableOptions[0] || LANG_OPTIONS[0];
  const isMultiple = availableOptions.length > 1;

  // Close on click outside or Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectLanguage = (selectedLang: Lang) => {
    try {
      unlockAudio();
      playTapSound();
    } catch {
      // Audio context unlock
    }
    setLang(selectedLang);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (!isMultiple) return;
    try {
      unlockAudio();
      playTapSound();
    } catch {}
    setIsOpen((prev) => !prev);
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={!isMultiple}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`flex items-center transition-all cursor-pointer select-none font-bold ${
          variant === "compact"
            ? "gap-1 px-2.5 h-8 sm:h-9 rounded-full text-xs bg-[#F4EFEA] dark:bg-[#1A2234] hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 border-0"
            : variant === "minimal"
            ? "gap-1 px-1.5 py-1 rounded-lg text-xs hover:bg-stone-100 text-stone-700 dark:text-stone-200 border-0"
            : "gap-1.5 px-2.5 py-1 rounded-full text-xs border border-stone-200 dark:border-stone-700 hover:border-stone-300 bg-white dark:bg-[#121824] text-stone-700 dark:text-stone-200"
        } ${
          isOpen
            ? "ring-2 ring-[#D98A3C]/30 bg-amber-50/60 dark:bg-amber-950/40"
            : ""
        } ${!isMultiple ? "cursor-default opacity-90" : ""}`}
      >
        <Globe className={`${variant === "compact" ? "h-3.5 w-3.5" : "h-3.5 w-3.5"} text-[#D98A3C] shrink-0`} />
        {variant === "compact" ? (
          <span className="font-extrabold font-mono uppercase leading-none">
            {currentOpt?.shortCode || "UR"}
          </span>
        ) : (
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-bold leading-none truncate">{currentOpt?.nativeName || "اردو"}</span>
            <span className="text-[10px] text-stone-500 font-extrabold font-mono uppercase bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded leading-none">
              {currentOpt?.shortCode || "UR"}
            </span>
          </div>
        )}
        {isMultiple && (
          <ChevronDown
            className={`${variant === "compact" ? "h-2.5 w-2.5" : "h-3 w-3"} text-stone-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-stone-700" : ""
            }`}
          />
        )}
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && isMultiple && (
        <div
          role="listbox"
          aria-label="Language selection"
          className="absolute end-0 mt-1.5 w-56 sm:w-64 bg-white dark:bg-[#121824] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl py-2 z-[100] animate-in fade-in-0 zoom-in-95 duration-150 origin-top-right focus:outline-none"
        >
          {/* Header */}
          <div className="px-3.5 py-1.5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between mb-1">
            <span className="text-[11px] font-extrabold text-stone-400 uppercase tracking-wider">
              Language / زبان
            </span>
            <span className="text-[10px] text-stone-400 font-bold">
              {availableOptions.length} Available
            </span>
          </div>

          {/* Languages List */}
          <div className="max-h-72 overflow-y-auto px-1.5 space-y-1">
            {availableOptions.map((opt) => {
              const isSelected = opt.value === lang;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectLanguage(opt.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer text-left select-none ${
                    isSelected
                      ? "bg-[#D98A3C] text-white font-black shadow-none"
                      : "text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/80 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm font-bold leading-tight">{opt.nativeName}</span>
                    <span
                      className={`text-[11px] ${
                        isSelected ? "text-white/80 font-extrabold" : "text-stone-400"
                      }`}
                    >
                      ({opt.englishName})
                    </span>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-white text-[#D98A3C] flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
