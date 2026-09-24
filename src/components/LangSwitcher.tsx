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
  const { lang, setLang } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOpt = LANG_OPTIONS.find((opt) => opt.value === lang) || LANG_OPTIONS[0];

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
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer select-none text-xs font-bold shadow-2xs ${
          isOpen
            ? "border-amber-500 bg-amber-50 text-stone-900 ring-2 ring-amber-500/20"
            : "border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50 text-stone-700"
        }`}
      >
        <Globe className="h-3.5 w-3.5 text-amber-600 shrink-0" />
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-black text-stone-900 leading-none truncate">{currentOpt.nativeName}</span>
          <span className="text-[10px] text-stone-600 font-extrabold font-mono uppercase bg-stone-100 px-1 py-0.5 rounded leading-none">
            {currentOpt.shortCode}
          </span>
        </div>
        <ChevronDown
          className={`h-3 w-3 text-stone-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-stone-700" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Language selection"
          className="absolute end-0 mt-1.5 w-56 sm:w-64 bg-white rounded-2xl border border-stone-200 shadow-xl py-2 z-[100] animate-in fade-in-0 zoom-in-95 duration-150 origin-top-right focus:outline-none"
        >
          {/* Header */}
          <div className="px-3.5 py-1.5 border-b border-stone-100 flex items-center justify-between mb-1">
            <span className="text-[11px] font-extrabold text-stone-400 uppercase tracking-wider">
              Language / زبان
            </span>
            <span className="text-[10px] text-stone-400 font-bold">
              8 Available
            </span>
          </div>

          {/* Languages List */}
          <div className="max-h-72 overflow-y-auto px-1.5 space-y-1">
            {LANG_OPTIONS.map((opt) => {
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
                      ? "bg-amber-500 text-stone-950 font-black shadow-2xs"
                      : "text-stone-700 hover:bg-stone-100 hover:text-stone-900 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm font-bold leading-tight">{opt.nativeName}</span>
                    <span
                      className={`text-[11px] ${
                        isSelected ? "text-stone-900 font-extrabold" : "text-stone-400"
                      }`}
                    >
                      ({opt.englishName})
                    </span>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-stone-950 text-white flex items-center justify-center shrink-0 shadow-2xs">
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
