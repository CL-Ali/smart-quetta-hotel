"use client";

import React from "react";
import { Users, Armchair, UtensilsCrossed, Loader2, ArrowRight, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LangSwitcher } from "@/components/LangSwitcher";
import { useLang } from "@/contexts/LangContext";

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
  const isSingle = peopleCount === 1;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 sm:px-6 py-8">
      <div className="w-full max-w-sm">
        {/* Header & Personal Greeting */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
            {isSingle ? (
              <Armchair className="w-8 h-8 text-amber-600" />
            ) : (
              <UtensilsCrossed className="w-8 h-8 text-amber-600" />
            )}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 mb-1.5">
            {t.hotelName}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {t.welcomeBack}, <span className="text-amber-600">{guestName || "Guest"}</span>!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
            {t.selectSeatingTitle || "Party Size & Seating"}
          </p>
        </div>

        <LangSwitcher className="justify-center mb-6" />

        <div className="space-y-5 bg-gray-50/80 p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          {/* 1. Number of People / Party Size Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                {t.peopleCountLabel || "How many people?"}
              </span>
              <span className="text-[11px] font-extrabold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                {isSingle
                  ? t.singlePerson || "1 Person"
                  : `${peopleCount} ${t.partySize || "People"}`}
              </span>
            </label>

            <div className="grid grid-cols-6 gap-1.5">
              {PEOPLE_OPTIONS.map((num) => {
                const selected = peopleCount === num;
                return (
                  <button
                    key={num}
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                      setPeopleCount(num);
                    }}
                    className={`h-12 rounded-xl text-base font-black transition-all cursor-pointer flex flex-col items-center justify-center ${
                      selected
                        ? "bg-amber-600 text-white shadow-md shadow-amber-600/30 scale-102 border-2 border-amber-600"
                        : "bg-white text-gray-700 hover:bg-amber-50 hover:text-amber-800 border border-gray-200"
                    }`}
                  >
                    <span>{num === 6 ? "6+" : num}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Dynamic Seat No vs Table No Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
              {isSingle ? (
                <>
                  <Armchair className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t.seatNo || "Seat No / Chair #"}</span>
                </>
              ) : (
                <>
                  <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t.tableNo || "Table Number"}</span>
                </>
              )}
            </label>
            <Input
              placeholder={
                isSingle
                  ? t.seatNoPlaceholder || "e.g. S-1 or Counter"
                  : t.tableNoPlaceholder || "e.g. Table 4 or Hall"
              }
              value={seatOrTableNo}
              onChange={(e) => setSeatOrTableNo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isBusy && onSubmit()}
              className="h-13 text-base text-center bg-white font-bold"
              disabled={isBusy}
              autoFocus
            />
          </div>

          {/* 3. Confirm & View Menu Button */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={isBusy}
            className="w-full h-13 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all text-white text-base font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/20 disabled:opacity-60"
          >
            {isBusy ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>
                <span>{t.confirmSeatingBtn || "Confirm & View Menu ✓"}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </>
            )}
          </button>
        </div>

        {/* Change Name / Different Person Switcher */}
        <div className="mt-4 text-center">
          <button
            type="button"
            disabled={isBusy}
            onClick={onChangeName}
            className="text-xs text-gray-500 hover:text-gray-800 font-semibold underline transition cursor-pointer flex items-center gap-1 mx-auto"
          >
            <User className="w-3.5 h-3.5" />
            <span>{t.differentPerson || "Not you? Change name"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
