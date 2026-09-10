"use client";

import React from "react";
import { Hotel, X, Loader2, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LangSwitcher } from "@/components/LangSwitcher";
import { useLang } from "@/contexts/LangContext";

interface NameEntryStepProps {
  guestName: string;
  guestPhone: string;
  previousName: string;
  isBusy: boolean;
  isResuming: boolean;
  setGuestName: (name: string) => void;
  setGuestPhone: (phone: string) => void;
  onSubmit: () => void;
}

/**
 * Customer Name & Phone onboarding screen
 */
export function NameEntryStep({
  guestName,
  guestPhone,
  previousName,
  isBusy,
  isResuming,
  setGuestName,
  setGuestPhone,
  onSubmit,
}: NameEntryStepProps) {
  const { t } = useLang();

  if (isResuming) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin h-10 w-10 text-orange-500" />
          <p className="text-sm text-gray-500">Resuming your visit…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-full mb-3 shadow-inner">
            <Hotel className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t.hotelName}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.enterName}</p>
        </div>

        {/* Language switch button */}
        <LangSwitcher className="justify-center mb-6" />

        {/* Inputs & Form */}
        <div className="space-y-3">
          <Input
            placeholder={t.namePlaceholder}
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isBusy && onSubmit()}
            className="h-14 text-lg text-center"
            autoFocus
            disabled={isBusy}
          />

          <div className="relative">
            <Input
              type="tel"
              inputMode="tel"
              placeholder="Phone number (optional — for loyalty)"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isBusy && onSubmit()}
              className="h-12 text-sm text-center pr-10"
              disabled={isBusy}
            />
            {guestPhone && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setGuestPhone("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick autofill for returning customer */}
          {previousName && guestName.trim() !== previousName.trim() && (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setGuestName(previousName)}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200/50 rounded-lg shadow-sm transition cursor-pointer group disabled:opacity-50"
              >
                <span>{t.tapToAutofill}</span>
                <span className="font-semibold underline group-hover:text-orange-950">{previousName}</span>
              </button>
            </div>
          )}

          {/* Continue button */}
          <button
            onClick={onSubmit}
            disabled={isBusy}
            className="w-full h-14 bg-black hover:bg-black/90 active:scale-[0.98] transition-transform text-white text-lg font-semibold rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-60 shadow-sm"
          >
            {isBusy ? <Loader2 className="animate-spin" /> : t.continueBtn}
          </button>
        </div>

        {/* Ghap Shap live teaser */}
        <div className="mt-6 p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-center gap-2">
          <Flame className="w-4 h-4 text-orange-600 animate-pulse shrink-0" />
          <p className="text-xs text-gray-600">Cricket Live: Pakistan needs 40 runs in 5 overs</p>
        </div>
      </div>
    </div>
  );
}
