"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building2,
  Globe,
  Eye,
  EyeOff,
  Check,
  Loader2,
  ShieldCheck,
  Smartphone,
  Volume2,
  VolumeX,
  Sparkles,
  Server,
  Layers,
  Store,
  RefreshCw,
  LayoutGrid,
} from "lucide-react";
import { useLang, LANG_OPTIONS, Lang } from "@/contexts/LangContext";
import { playTapSound, playOrderSuccessSound, unlockAudio } from "@/lib/sound";
import { toast } from "sonner";

interface SettingsTabProps {
  operationMode: "unified" | "segregated";
  showCustomerQueue: boolean;
  soundEnabled: boolean;
  defaultPosAccess: boolean;
  allowedLanguages: string[];
  defaultLanguage: string;
  onToggleMode: () => Promise<void>;
  onToggleCustomerQueue: () => Promise<void>;
  onToggleSound: () => Promise<void>;
  onToggleDefaultPosAccess: () => Promise<void>;
  onSaveLanguages: (allowed: string[], defLang: string) => Promise<void>;
  isSaving: boolean;
  clientIp?: string;
  staffName?: string;
}

export function SettingsTab({
  operationMode,
  showCustomerQueue,
  soundEnabled,
  defaultPosAccess,
  allowedLanguages,
  defaultLanguage,
  onToggleMode,
  onToggleCustomerQueue,
  onToggleSound,
  onToggleDefaultPosAccess,
  onSaveLanguages,
  isSaving,
  clientIp = "127.0.0.1",
  staffName = "Admin",
}: SettingsTabProps) {
  const { lang, t } = useLang();

  // Local state for language management
  const [selectedAllowedLangs, setSelectedAllowedLangs] = useState<string[]>(allowedLanguages);
  const [selectedDefaultLang, setSelectedDefaultLang] = useState<string>(defaultLanguage);

  useEffect(() => {
    setSelectedAllowedLangs(allowedLanguages);
    setSelectedDefaultLang(defaultLanguage);
  }, [allowedLanguages, defaultLanguage]);

  const toggleLanguage = (code: string) => {
    playTapSound();
    if (selectedAllowedLangs.includes(code)) {
      if (selectedAllowedLangs.length === 1) {
        toast.error(lang === "ur" ? "کم از کم ایک زبان فعال ہونی چاہیے" : "At least one language must remain active");
        return;
      }
      const updated = selectedAllowedLangs.filter((l) => l !== code);
      setSelectedAllowedLangs(updated);
      if (selectedDefaultLang === code) {
        setSelectedDefaultLang(updated[0] || "ur");
      }
    } else {
      setSelectedAllowedLangs([...selectedAllowedLangs, code]);
    }
  };

  const handleSaveLangs = async () => {
    playTapSound();
    await onSaveLanguages(selectedAllowedLangs, selectedDefaultLang);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#121824] rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 border-0 shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#D98A3C]/15 text-[#D98A3C] flex items-center justify-center font-black">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#24180A] dark:text-white">
              {lang === "ur" ? "سسٹم ترتیبات و کنٹرول" : "System Settings & Configuration"}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              {lang === "ur"
                ? "آپریشن موڈ، لائیو کیو، زبانوں کا انتخاب اور نیٹ ورک ترتیبات"
                : "Manage operational architecture, customer portal queue, multilingual access, and network"}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Main Setting Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CARD 1: Operation Mode (Pods vs Unified) */}
        <div className="bg-white dark:bg-[#121824] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 border-0 shadow-none flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#D98A3C]" />
                <span>{lang === "ur" ? "کاؤنٹر آپریشن موڈ" : "POS Operation Mode"}</span>
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                  operationMode === "segregated"
                    ? "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300"
                    : "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    operationMode === "segregated" ? "bg-purple-600" : "bg-[#D98A3C]"
                  }`}
                />
                <span>
                  {operationMode === "segregated"
                    ? lang === "ur"
                      ? "الگ کاؤنٹرز (Pods Mode)"
                      : "Counter-Segregated Pods"
                    : lang === "ur"
                    ? "مشترکہ رجسٹر (Unified)"
                    : "Unified Shared Register"}
                </span>
              </span>
            </div>

            <h3 className="text-sm font-black text-[#24180A] dark:text-white mb-1.5">
              {operationMode === "segregated"
                ? lang === "ur"
                  ? "ہر کاؤنٹر کا الگ بل و کیش ڈراور"
                  : "Independent Counter Cash Drawers"
                : lang === "ur"
                ? "مشترکہ سینٹرلائزڈ کیش رجسٹر"
                : "Centralized Global Register"}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {operationMode === "segregated"
                ? lang === "ur"
                  ? "اس موڈ میں ہر کاؤنٹر انچارج کیشیئر صرف اپنے کاؤنٹر کے آرڈرز اور کیش حساب کتاب کو مینیج کرتا ہے۔"
                  : "In Pods mode, each cashier manages their assigned counter's individual billing, order items, and cash sessions."
                : lang === "ur"
                ? "اس موڈ میں تمام کیشیئرز ایک مشترکہ ہوٹل رجسٹر اور لیجر کے تحت آرڈرز پنچ کرتے ہیں۔"
                : "In Unified mode, all cashiers share the central hotel orders ledger and collective closing balance."}
            </p>
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-zinc-800/80 flex items-center justify-between">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              {lang === "ur" ? "موڈ تبدیل کریں:" : "Switch Mode:"}
            </span>
            <button
              type="button"
              onClick={onToggleMode}
              disabled={isSaving}
              className="px-4 py-2 bg-[#D98A3C] hover:bg-[#C27930] active:scale-95 transition text-white text-xs font-black rounded-full flex items-center gap-2 cursor-pointer border-0 shadow-none disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>
                {operationMode === "segregated"
                  ? lang === "ur"
                    ? "مشترکہ رجسٹر موڈ آن کریں"
                    : "Switch to Unified Mode"
                  : lang === "ur"
                  ? "الگ کاؤنٹرز موڈ آن کریں"
                  : "Switch to Pods Mode"}
              </span>
            </button>
          </div>
        </div>

        {/* CARD 2: Customer Live Queue Visibility */}
        <div className="bg-white dark:bg-[#121824] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 border-0 shadow-none flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#D98A3C]" />
                <span>{lang === "ur" ? "کسٹمر لائیو قطار" : "Customer Live Queue"}</span>
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                  showCustomerQueue
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                    : "bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    showCustomerQueue ? "bg-emerald-500 animate-pulse" : "bg-stone-400"
                  }`}
                />
                <span>
                  {showCustomerQueue
                    ? lang === "ur"
                      ? "کسٹمرز کے لیے فعال"
                      : "Visible to Customers"
                    : lang === "ur"
                    ? "پوشیدہ (Hidden)"
                    : "Hidden from Portal"}
                </span>
              </span>
            </div>

            <h3 className="text-sm font-black text-[#24180A] dark:text-white mb-1.5">
              {showCustomerQueue
                ? lang === "ur"
                  ? "کسٹمر موبائل پر لائیو کچن اسٹیٹس دکھایا جا رہا ہے"
                  : "Live Kitchen Progress Displayed on Guest Phones"
                : lang === "ur"
                ? "لائیو قطار کسٹمر موبائل پر چھپا دی گئی ہے"
                : "Queue Display Hidden on Guest Phones"}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {lang === "ur"
                ? "کسٹمر پورٹل پر بیٹھ کر کھانا کھانے والے مہمانوں کو اپنے آرڈر کا لائیو کچن اسٹیٹس (تیاری، مکمل) دکھانے یا چھپانے کی ترتیبات۔"
                : "Controls whether dining guests see the live kitchen order status bar and queue countdown on their smartphones."}
            </p>
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-zinc-800/80 flex items-center justify-between">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              {lang === "ur" ? "اسٹیٹس تبدیل کریں:" : "Toggle Visibility:"}
            </span>
            <button
              type="button"
              onClick={onToggleCustomerQueue}
              disabled={isSaving}
              className={`px-4 py-2 active:scale-95 transition text-xs font-black rounded-full flex items-center gap-2 cursor-pointer border-0 shadow-none disabled:opacity-50 ${
                showCustomerQueue
                  ? "bg-stone-200 dark:bg-zinc-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {showCustomerQueue ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>{lang === "ur" ? "قطار چھپائیں" : "Hide Queue"}</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>{lang === "ur" ? "قطار دکھائیں" : "Show Queue"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CARD 3: Default POS Access for New Staff */}
        <div className="bg-white dark:bg-[#121824] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 border-0 shadow-none flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-[#D98A3C]" />
                <span>{lang === "ur" ? "نئے عملے کے لیے ڈیفالٹ POS رسائی" : "Default POS Access for Staff"}</span>
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                  defaultPosAccess
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                    : "bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    defaultPosAccess ? "bg-emerald-500 animate-pulse" : "bg-stone-400"
                  }`}
                />
                <span>
                  {defaultPosAccess
                    ? (lang === "ur" ? "بائی ڈیفالٹ آن (Auto Check)" : "Auto-Checked on Create")
                    : (lang === "ur" ? "بائی ڈیفالٹ آف (Manual)" : "Disabled by Default")}
                </span>
              </span>
            </div>

            <h3 className="text-sm font-black text-[#24180A] dark:text-white mb-1.5">
              {defaultPosAccess
                ? (lang === "ur"
                  ? "نیا عملہ بناتے وقت POS ٹرمینل خودکار منتخب ہوگا"
                  : "POS Terminal Ordering permission is automatically selected when creating staff")
                : (lang === "ur"
                  ? "نیا عملہ بناتے وقت POS ٹرمینل خودکار بند رہے گا"
                  : "POS Terminal permission must be manually granted per staff member")}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {lang === "ur"
                ? "اگر آن ہوگا تو جب بھی نیا کیشیر یا ویٹر رجسٹر کریں گے تو اسے POS آرڈرنگ کا اختیار پہلے سے ملا ہوگا۔ اگر بند ہوگا تو بغیر اجازت POS نہیں ملے گا جب تک خود نہ دیں۔"
                : "When enabled, newly registered cashiers and waiters automatically receive live POS register access. When disabled, the POS permission remains unselected by default during creation."}
            </p>
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-zinc-800/80 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              {lang === "ur" ? "ڈیفالٹ ترجیح تبدیل کریں:" : "Toggle Default Policy:"}
            </span>
            <button
              type="button"
              onClick={onToggleDefaultPosAccess}
              disabled={isSaving}
              className={`px-4 py-2 active:scale-95 transition text-xs font-black rounded-full flex items-center gap-2 cursor-pointer border-0 shadow-none disabled:opacity-50 ${
                defaultPosAccess
                  ? "bg-stone-200 dark:bg-zinc-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-zinc-700"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>
                {defaultPosAccess
                  ? (lang === "ur" ? "ڈیفالٹ آف کریں (Disable Default)" : "Disable Auto-Select")
                  : (lang === "ur" ? "ڈیفالٹ آن کریں (Enable Default)" : "Enable Auto-Select")}
              </span>
            </button>
          </div>
        </div>

        {/* CARD 4: Global App Audio Sound Effects */}
        <div className="bg-white dark:bg-[#121824] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 border-0 shadow-none flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-[#D98A3C]" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-stone-400" />
                )}
                <span>{lang === "ur" ? "پوری ایپ کی ساؤنڈ و آڈیو ایفیکٹس" : "Global App Audio & Sound Feedback"}</span>
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                  soundEnabled
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                    : "bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    soundEnabled ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                  }`}
                />
                <span>
                  {soundEnabled
                    ? lang === "ur"
                      ? "تمام ڈیوائسز پر آن (Active)"
                      : "Sound Active Globally"
                    : lang === "ur"
                    ? "تمام ڈیوائسز پر بند (Muted)"
                    : "Sound Muted Globally"}
                </span>
              </span>
            </div>

            <h3 className="text-sm font-black text-[#24180A] dark:text-white mb-1.5">
              {soundEnabled
                ? lang === "ur"
                  ? "بٹن دبانے، مینو سلیکشن، اور آرڈر فائنل ہونے پر آواز فعال ہے"
                  : "Tactile Taps, Cart Additions & Order Confirmation Fanfare Enabled"
                : lang === "ur"
                ? "تمام ٹرمینلز اور کسٹمر فونز پر آواز مکمل خاموش (Silent) کر دی گئی ہے"
                : "All Audio Effects Silenced Across POS, Kitchen, Waiter & Customer Portals"}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {lang === "ur"
                ? "یہاں سے بند کرنے پر تمام کیشیئرز، ویٹرز، کچن اسکرینز اور گیسٹ کسٹمرز کے موبائل پر ساؤنڈ بند ہو جائے گی۔ دوبارہ آن کرنے پر سب کے پاس فوری آن ہو جائے گا۔"
                : "When turned off, audio feedback is instantly silenced across all cashier POS, waiter handhelds, kitchen screens, and guest smartphone orders. Turning it on restores sound universally."}
            </p>
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-zinc-800/80 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              {lang === "ur" ? "ساؤنڈ کنٹرول تبدیل کریں:" : "Audio Control:"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onToggleSound}
                disabled={isSaving}
                className={`px-4 py-2 active:scale-95 transition text-xs font-black rounded-full flex items-center gap-2 cursor-pointer border-0 shadow-none disabled:opacity-50 ${
                  soundEnabled
                    ? "bg-stone-200 dark:bg-zinc-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-zinc-700"
                    : "bg-[#D98A3C] hover:bg-[#C27930] text-white"
                }`}
              >
                {soundEnabled ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>{lang === "ur" ? "ساؤنڈ بند کریں (Mute All)" : "Mute Globally"}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{lang === "ur" ? "ساؤنڈ آن کریں (Enable All)" : "Enable Globally"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 5: Comprehensive Language Governance & Permissions */}
      <div className="bg-white dark:bg-[#121824] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 border-0 shadow-none space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#D98A3C]" />
              <h3 className="text-sm sm:text-base font-black text-[#24180A] dark:text-white">
                {lang === "ur" ? "سسٹم کی زبانیں اور ملٹی لینگویج کنٹرول" : "System Languages & Multilingual Access"}
              </h3>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">
              {lang === "ur"
                ? "یہاں سے وہ زبانیں منتخب کریں جو عملے اور کسٹمرز کو ہیڈر ڈراپ ڈاؤن میں دستیاب ہوں گی"
                : "Select allowed languages displayed in the header dropdown for staff and customer portals"}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
              {lang === "ur" ? "بنیادی ڈیفالٹ زبان:" : "Default Language:"}
            </span>
            <select
              value={selectedDefaultLang}
              onChange={(e) => {
                playTapSound();
                setSelectedDefaultLang(e.target.value);
                if (!selectedAllowedLangs.includes(e.target.value)) {
                  setSelectedAllowedLangs([...selectedAllowedLangs, e.target.value]);
                }
              }}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#F8F3EC] dark:bg-[#1A2232] text-[#24180A] dark:text-white border-0 focus:outline-none focus:ring-2 focus:ring-[#D98A3C] cursor-pointer"
            >
              {LANG_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#121824] text-black dark:text-white">
                  {opt.nativeName} ({opt.englishName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {LANG_OPTIONS.map((opt) => {
            const isAllowed = selectedAllowedLangs.includes(opt.value);
            const isDefault = selectedDefaultLang === opt.value;

            return (
              <div
                key={opt.value}
                onClick={() => toggleLanguage(opt.value)}
                className={`p-3.5 rounded-2xl transition cursor-pointer flex items-center justify-between border-0 ${
                  isAllowed
                    ? "bg-amber-500/10 dark:bg-amber-500/15 ring-1.5 ring-[#D98A3C]"
                    : "bg-[#F8F3EC] dark:bg-[#1A2232] opacity-60 hover:opacity-100"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#24180A] dark:text-white truncate">
                      {opt.nativeName}
                    </span>
                    {isDefault && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#D98A3C] text-white">
                        {lang === "ur" ? "ڈیفالٹ" : "Default"}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium block mt-0.5">
                    {opt.englishName} • {opt.dir.toUpperCase()}
                  </span>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold transition ${
                    isAllowed ? "bg-[#D98A3C] text-white" : "bg-stone-300 dark:bg-stone-700 text-transparent"
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Language Settings Action */}
        <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {selectedAllowedLangs.length} {lang === "ur" ? "زبانیں منتخب شدہ ہیں" : "languages active out of 8"}
          </p>
          <button
            type="button"
            onClick={handleSaveLangs}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-full text-xs font-black bg-[#D98A3C] hover:bg-[#C27930] active:scale-95 text-white transition cursor-pointer flex items-center gap-2 border-0 shadow-none disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{lang === "ur" ? "زبانوں کی ترتیبات محفوظ کریں" : "Save Language Settings"}</span>
          </button>
        </div>
      </div>

      {/* CARD 4: Network & System Diagnostic Info */}
      <div className="bg-white dark:bg-[#121824] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 border-0 shadow-none">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-100 dark:border-zinc-800/80">
          <Server className="w-4 h-4 text-[#D98A3C]" />
          <h3 className="text-sm font-black text-[#24180A] dark:text-white">
            {lang === "ur" ? "سسٹم معلومات و نیٹ ورک سٹیٹس" : "System Environment & Network Status"}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-2xl">
            <span className="text-stone-500 dark:text-stone-400 font-bold block mb-1">
              {lang === "ur" ? "کلائنٹ آئی پی ایڈریس" : "Client IP Address"}
            </span>
            <span className="font-mono font-black text-[#24180A] dark:text-white text-sm">
              {clientIp || "127.0.0.1"}
            </span>
          </div>

          <div className="p-3 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-2xl">
            <span className="text-stone-500 dark:text-stone-400 font-bold block mb-1">
              {lang === "ur" ? "ڈیٹا بیس سٹیٹس" : "Database Engine"}
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SQLite WAL (Ultra-Fast)</span>
            </span>
          </div>

          <div className="p-3 bg-[#F8F3EC] dark:bg-[#1A2232] rounded-2xl">
            <span className="text-stone-500 dark:text-stone-400 font-bold block mb-1">
              {lang === "ur" ? "ایکٹو ایڈمن سیشن" : "Logged-in Admin"}
            </span>
            <span className="font-black text-[#24180A] dark:text-white text-sm truncate block">
              {staffName} (Full Access)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
