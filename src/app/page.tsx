"use client";

import { useMemo, useState, useEffect } from "react";
import {
  PlusIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useEntries } from "./providers/EntriesProvider";
import { useSettings } from "./providers/SettingsProvider";
import { CalendarModal } from "./components/CalendarModal";
import { useTaper } from "./providers/TaperProvider";
import { RelapseToast } from "./components/RelapseToast";

type LogEntry = {
  id: string;
  grams: number;
  priceEUR?: number;
  buzz: number; // 1-10
  method?: string;
  note?: string;
  date: string; // ISO
};

export default function LogPage() {
  const {
    entries,
    addEntry: addCtxEntry,
    deleteEntry: deleteCtxEntry,
  } = useEntries();
  const { derived } = useTaper();
  const { settings, getPresetAmounts } = useSettings();
  const presetAmountsDefault = getPresetAmounts();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [grams, setGrams] = useState<string>("");
  const [buzz, setBuzz] = useState<number>(5);
  const [price, setPrice] = useState<string>("");
  const [showExtras, setShowExtras] = useState(false);
  const [method, setMethod] = useState<string>("");
  const [customMethod, setCustomMethod] = useState<string>("");
  const [dateTime, setDateTime] = useState<string>(() =>
    new Date().toISOString().slice(0, 16)
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateButtonRef, setDateButtonRef] = useState<HTMLButtonElement | null>(
    null
  );
  const [showRelapse, setShowRelapse] = useState(false);

  // Listen for add button clicks from the navigation
  useEffect(() => {
    const handleOpenModal = () => setIsModalOpen(true);
    window.addEventListener("openAddModal", handleOpenModal);
    return () => window.removeEventListener("openAddModal", handleOpenModal);
  }, []);

  const selectedDateEntries = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth();
    const d = selectedDate.getDate();
    return entries
      .filter((e) => {
        const dt = new Date(e.date);
        return (
          dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first
  }, [entries, selectedDate]);

  const totals = useMemo(() => {
    const gramsTotal = selectedDateEntries.reduce((sum, e) => sum + e.grams, 0);
    const priceTotal = selectedDateEntries.reduce(
      (sum, e) => sum + (e.priceEUR ?? 0),
      0
    );
    return { gramsTotal, priceTotal };
  }, [selectedDateEntries]);

  function resetForm() {
    setGrams("");
    setPrice("");
    setBuzz(5);
    setMethod("");
    setCustomMethod("");
    setDateTime(new Date().toISOString().slice(0, 16));
    setShowExtras(false);
  }

  function addEntry() {
    const gramsNum = parseFloat(grams);
    if (!Number.isFinite(gramsNum) || gramsNum <= 0) return;
    const priceNum = price
      ? parseFloat(price)
      : gramsNum * settings.defaultPricePerGram;
    const finalMethod = method || undefined;
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      grams: gramsNum,
      priceEUR: priceNum,
      buzz,
      method: finalMethod,
      date: new Date(dateTime).toISOString(),
    };
    addCtxEntry(entry);
    setIsModalOpen(false);
    resetForm();
  }

  function deleteEntry(id: string) {
    deleteCtxEntry(id);
    if (expandedId === id) setExpandedId(null);
  }

  function goToPreviousDay() {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(prevDate);
  }

  function goToNextDay() {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(nextDate);
  }

  function goToToday() {
    setSelectedDate(new Date());
  }

  function handleDateSelect(date: Date) {
    setSelectedDate(date);
  }

  function handleDateTimeSelect(date: Date) {
    const newDateTime = new Date(dateTime);
    newDateTime.setFullYear(date.getFullYear());
    newDateTime.setMonth(date.getMonth());
    newDateTime.setDate(date.getDate());
    setDateTime(newDateTime.toISOString().slice(0, 16));
  }

  function formatDate(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "TODAY";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "YESTERDAY";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "TOMORROW";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground overflow-hidden">
      <main className="flex-1 p-4 pt-0 max-w-md w-full mx-auto pb-24 overflow-y-auto overflow-x-hidden">
        <section className="mb-6">
          <div className="rounded-xl p-6 text-center">
            {/* Date Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={goToPreviousDay}
                className="p-3 rounded-lg hover:bg-black/[.04] dark:hover:bg-white/[.04] transition-colors"
                aria-label="Previous day"
              >
                <ChevronLeftIcon className="size-5" />
              </button>

              <button
                ref={setDateButtonRef}
                onClick={() => setShowDatePicker(true)}
                className="px-6 py-3 rounded-lg hover:bg-black/[.04] dark:hover:bg-white/[.04] transition-colors"
              >
                <span
                  className="text-2xl font-bold tracking-wide text-emerald-500"
                  style={{ fontFamily: "var(--font-title)" }}
                >
                  {formatDate(selectedDate)}
                </span>
              </button>

              <button
                onClick={goToNextDay}
                className="p-3 rounded-lg hover:bg-black/[.04] dark:hover:bg-white/[.04] transition-colors"
                aria-label="Next day"
              >
                <ChevronRightIcon className="size-5" />
              </button>
            </div>

            {selectedDateEntries.length > 0 ? (
              <div className="space-y-3 animate-fade-in-up">
                <div
                  className="text-7xl sm:text-8xl font-bold leading-none"
                  style={{ fontFamily: "var(--font-title)" }}
                >
                  {totals.gramsTotal.toFixed(2)}
                  {settings.measurementUnit}
                </div>
                <div className="text-3xl text-foreground/70">
                  {settings.currency === "EUR"
                    ? "€"
                    : settings.currency === "USD"
                    ? "$"
                    : settings.currency === "GBP"
                    ? "£"
                    : "C$"}
                  {totals.priceTotal.toFixed(2)}
                </div>
              </div>
            ) : (
              <div className="space-y-2 animate-fade-in-up">
                <div className="text-lg text-foreground/60">
                  No entries for this date
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          {selectedDateEntries.map((e) => {
            const isExpanded = expandedId === e.id;
            const dt = new Date(e.date);
            const time = dt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <div
                key={e.id}
                className="bg-black/[.04] dark:bg-white/[.04] rounded-2xl overflow-hidden animate-fade-in-up shadow-sm"
              >
                <button
                  className="w-full px-6 py-5 flex items-center justify-between transition-colors hover:bg-black/[.02] dark:hover:bg-white/[.02]"
                  onClick={() =>
                    setExpandedId((prev) => (prev === e.id ? null : e.id))
                  }
                >
                  <div className="flex items-baseline gap-4">
                    <div className="text-3xl font-bold text-foreground">
                      {e.grams.toFixed(2)}
                      <span className="text-lg font-medium text-foreground/60 ml-1">
                        {settings.measurementUnit}
                      </span>
                    </div>
                    <div className="text-lg text-foreground/60">
                      {(e.priceEUR ?? 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-xl font-semibold text-foreground/70">
                    {time}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-6 pb-5 animate-fade-in-up">
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="text-lg font-medium text-foreground">
                          Buzz: {e.buzz}/10
                        </div>
                        <div className="text-lg font-medium text-foreground">
                          Method: {e.method || "N/A"}
                        </div>
                        <div className="text-lg font-medium text-foreground">
                          Note: {e.note || "N/A"}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteEntry(e.id)}
                        className="w-full px-3 py-2 rounded-lg border-2 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-semibold"
                      >
                        Delete Entry
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Log page does not include stats; see /stats */}
      </main>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in overflow-hidden"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-background text-foreground rounded-2xl p-6 mx-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="text-lg font-semibold">Add use</div>
              <button onClick={() => setIsModalOpen(false)} aria-label="Close">
                <XMarkIcon className="size-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm mb-1">
                  Amount ({settings.measurementUnit})
                </label>
                <div className="relative">
                  <input
                    inputMode="decimal"
                    value={grams}
                    onChange={(e) => setGrams(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent pl-3 pr-10 py-2 outline-none"
                  />
                  {grams && (
                    <button
                      type="button"
                      aria-label="Clear amount"
                      onClick={() => setGrams("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <XMarkIcon className="size-4" />
                    </button>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  {presetAmountsDefault.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setGrams((g) =>
                          g
                            ? (parseFloat(g || "0") + p).toFixed(2)
                            : p.toFixed(2)
                        )
                      }
                      className="px-2 py-1 rounded-full bg-black/5 dark:bg-white/10 text-sm"
                    >
                      +{p.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Buzz</label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={buzz}
                  onChange={(e) => setBuzz(parseInt(e.target.value))}
                  className="w-full appearance-none bg-gray-200 dark:bg-gray-700 rounded-lg h-2"
                  style={{
                    background: `linear-gradient(to right, ${
                      buzz <= 3 ? "#3b82f6" : buzz <= 6 ? "#10b981" : "#ef4444"
                    } 0%, ${
                      buzz <= 3 ? "#3b82f6" : buzz <= 6 ? "#10b981" : "#ef4444"
                    } ${(buzz / 10) * 100}%, #6b7280 ${
                      (buzz / 10) * 100
                    }%, #6b7280 100%)`,
                  }}
                />
                <div className="text-sm text-foreground/70">{buzz}/10</div>
              </div>

              <button
                type="button"
                onClick={() => setShowExtras((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                Extra options
                <ChevronDownIcon
                  className={`size-4 transition-transform ${
                    showExtras ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showExtras && (
                <div className="space-y-4 pt-2 animate-fade-in-up">
                  <div>
                    <label className="block text-sm mb-1">Date/Time</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDatePicker(true)}
                        className="flex-1 px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-left"
                      >
                        {new Date(dateTime).toLocaleDateString()}
                      </button>
                      <button
                        onClick={() => setShowTimePicker(true)}
                        className="flex-1 px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-left"
                      >
                        {new Date(dateTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Method</label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none"
                    >
                      <option value="">Select method...</option>
                      {settings.defaultMethods.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">
                      Price (
                      {settings.currency === "EUR"
                        ? "€"
                        : settings.currency === "USD"
                        ? "$"
                        : settings.currency === "GBP"
                        ? "£"
                        : "C$"}
                      )
                    </label>
                    <input
                      inputMode="decimal"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="optional"
                      className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={addEntry}
                className="w-full rounded-lg border-2 border-emerald-600 text-emerald-600 py-3 font-medium active:scale-[.99] text-base hover:bg-emerald-600 hover:text-white transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Relapse Toast */}
      <RelapseToast
        isOpen={showRelapse}
        overBy={Math.max(0, -(derived.remainingToday_g ?? 0))}
        onKeep={() => setShowRelapse(false)}
        onEase={() => {
          setShowRelapse(false);
        }}
        onStop={() => {
          setShowRelapse(false);
        }}
        onClose={() => setShowRelapse(false)}
      />

      {/* Calendar Modal */}
      <CalendarModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        context="log"
      />

      {/* Time Picker Modal */}
      {showTimePicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in overflow-hidden"
          onClick={() => setShowTimePicker(false)}
        >
          <div
            className="w-full max-w-sm bg-background rounded-2xl p-6 mx-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Select Time</h2>
              <button
                onClick={() => setShowTimePicker(false)}
                className="p-2 rounded-lg hover:bg-black/[.04] dark:hover:bg-white/[.04] transition-colors"
                aria-label="Close"
              >
                <XMarkIcon className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="time"
                value={new Date(dateTime).toTimeString().slice(0, 5)}
                onChange={(e) => {
                  const newDateTime = new Date(dateTime);
                  const [hours, minutes] = e.target.value.split(":");
                  newDateTime.setHours(parseInt(hours), parseInt(minutes));
                  setDateTime(newDateTime.toISOString().slice(0, 16));
                  setShowTimePicker(false);
                }}
                className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Date Picker Modal for Add Entry */}
      <CalendarModal
        isOpen={showDatePicker && isModalOpen}
        onClose={() => setShowDatePicker(false)}
        selectedDate={new Date(dateTime)}
        onDateSelect={handleDateTimeSelect}
        context="datetime"
      />
    </div>
  );
}
