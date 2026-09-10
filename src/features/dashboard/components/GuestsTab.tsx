"use client";

import React, { useState } from "react";
import { Search, Users, Phone, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { fmtDate } from "@/lib/time";

interface GuestRecord {
  id: number;
  name: string;
  phone?: string | null;
  visitCount: number;
  orderCount: number;
  totalSpend: number;
  lastVisit?: string | null;
}

interface GuestsTabProps {
  guests?: GuestRecord[];
  isLoading: boolean;
}

export function GuestsTab({ guests, isLoading }: GuestsTabProps) {
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin h-7 w-7 text-orange-500" />
      </div>
    );
  }

  if (!guests || guests.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No guests yet</p>
        <p className="text-xs mt-1 text-gray-400">
          Guests appear here after they place their first order
        </p>
      </div>
    );
  }

  const q = search.toLowerCase().trim();
  const filtered = q
    ? guests.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          (g.phone ?? "").includes(q)
      )
    : guests;

  return (
    <div className="space-y-3 pb-8">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-11 bg-white"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No guests match "{search}"</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 text-center">
              <p className="text-lg font-black text-blue-700">{filtered.length}</p>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                Guests
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-2.5 text-center">
              <p className="text-lg font-black text-purple-700">
                {filtered.filter((g) => g.visitCount > 1).length}
              </p>
              <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider">
                Repeat
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-2.5 text-center">
              <p className="text-lg font-black text-orange-700">
                {filtered.filter((g) => g.phone).length}
              </p>
              <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wider">
                With Phone
              </p>
            </div>
          </div>

          {filtered.map((guest) => (
            <div
              key={guest.id}
              className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xs"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                  guest.visitCount > 2
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {guest.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-sm text-gray-900 truncate">{guest.name}</p>
                  {guest.visitCount > 1 && (
                    <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                      Repeat
                    </span>
                  )}
                </div>
                {guest.phone ? (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 shrink-0" />
                    {guest.phone}
                  </p>
                ) : (
                  <p className="text-xs text-gray-300 mt-0.5">No phone</p>
                )}
                {guest.lastVisit && (
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Last visit: {fmtDate(guest.lastVisit)}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-orange-600">
                  Rs. {guest.totalSpend.toFixed(0)}
                </p>
                <p className="text-[10px] text-gray-400">
                  {guest.visitCount} visit{guest.visitCount !== 1 ? "s" : ""}
                  {" · "}
                  {guest.orderCount} order{guest.orderCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
