"use client";

import React from "react";
import { Hotel, X, Loader2, Flame, Users, Armchair, UtensilsCrossed } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LangSwitcher } from "@/components/LangSwitcher";
import { useLang } from "@/contexts/LangContext";

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
  const isSingle = peopleCount === 1;

  if (isResuming) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin h-10 w-10 text-orange-500" />
          <p className="text-sm text-gray-500">{t.resumingVisit || "Resuming your visit…"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 sm:px-6 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl mb-3 shadow-inner border border-orange-200/50">
            <Hotel className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t.hotelName}</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">{t.enterName}</p>
        </div>

        <LangSwitcher className="justify-center mb-5" />

        <div className="space-y-4 bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          {/* Guest Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              {t.namePlaceholder || "Your Name"}
            </label>
            <Input
              placeholder={t.namePlaceholder || "Enter your name..."}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isBusy && onSubmit()}
              className="h-13 text-base text-center bg-white font-bold"
              autoFocus
              disabled={isBusy}
            />
          </div>

          {/* Guest Phone (VIP Rewards & Updates) */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label className="block text-xs font-bold text-gray-700">
                {t.phoneLabel || "Phone Number"}
              </label>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md">
                ⭐ {t.phoneVipTag || "VIP Member Rewards"}
              </span>
            </div>
            <div className="relative">
              <Input
                type="tel"
                inputMode="tel"
                placeholder="0300-1234567"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isBusy && onSubmit()}
                className="h-12 text-sm text-center bg-white pr-10 font-semibold"
                disabled={isBusy}
              />
              {guestPhone && (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setGuestPhone("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Party Size / Number of People */}
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
                    className={`h-11 rounded-xl text-sm font-black transition-all cursor-pointer flex items-center justify-center ${
                      selected
                        ? "bg-amber-600 text-white shadow-md shadow-amber-600/30 scale-102 border-2 border-amber-600"
                        : "bg-white text-gray-700 hover:bg-amber-50 border border-gray-200"
                    }`}
                  >
                    <span>{num === 6 ? "6+" : num}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Seat No vs Table No Input */}
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
              className="h-12 text-sm text-center bg-white font-bold"
              disabled={isBusy}
            />
          </div>

          {previousName && guestName.trim() !== previousName.trim() && (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setGuestName(previousName)}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200/50 rounded-lg shadow-sm transition cursor-pointer group disabled:opacity-50"
              >
                <span>{t.tapToAutofill}</span>
                <span className="font-semibold underline group-hover:text-orange-950">
                  {previousName}
                </span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={isBusy}
            className="w-full h-13 bg-black hover:bg-black/90 active:scale-[0.98] transition-transform text-white text-base font-bold rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-60 shadow-sm"
          >
            {isBusy ? <Loader2 className="animate-spin" /> : t.continueBtn}
          </button>
        </div>

        <div className="mt-5 p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-center gap-2">
          <Flame className="w-4 h-4 text-orange-600 animate-pulse shrink-0" />
          <p className="text-xs text-gray-600 font-medium">{t.liveTicker || "Fresh & Crispy Lachha Paratha & Karak Chai Live"}</p>
        </div>
      </div>
    </div>
  );
}
