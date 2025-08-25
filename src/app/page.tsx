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
import { ValidatedEntryForm } from "./components/ValidatedEntryForm";

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

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
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
              <div className="text-lg font-semibold">Add Entry</div>
              <button onClick={() => setIsModalOpen(false)} aria-label="Close">
                <XMarkIcon className="size-6" />
              </button>
            </div>

            <ValidatedEntryForm
              onSuccess={() => setIsModalOpen(false)}
              onCancel={() => setIsModalOpen(false)}
            />
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
    </div>
  );
}
