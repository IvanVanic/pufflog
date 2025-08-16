"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { LogEntry } from "@/types/log";

type EntriesContextValue = {
  entries: LogEntry[];
  addEntry: (e: LogEntry) => void;
  deleteEntry: (id: string) => void;
  clearAll: () => void;
  seedSampleEntries: () => void;
};

const EntriesContext = createContext<EntriesContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "pufflog.entries";

export function EntriesProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Validate that parsed data is an array
        if (Array.isArray(parsed)) {
          setEntries(parsed);
        } else {
          console.warn('Invalid entries data in localStorage, resetting');
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load entries from localStorage:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save entries to localStorage:', error);
    }
  }, [entries]);

  const addEntry = useCallback(
    (e: LogEntry) => setEntries((prev) => [e, ...prev]),
    []
  );
  const deleteEntry = useCallback(
    (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id)),
    []
  );
  const clearAll = useCallback(() => setEntries([]), []);

  const seedSampleEntries = useCallback(() => {
    const now = new Date();
    const randoms: LogEntry[] = [];
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const perDayUses = Math.floor(Math.random() * 3); // 0-2 uses per day
      for (let u = 0; u < perDayUses; u++) {
        const dt = new Date(now);
        dt.setDate(now.getDate() - dayOffset);
        dt.setHours(Math.floor(Math.random() * 24));
        dt.setMinutes(Math.floor(Math.random() * 60));
        const grams = parseFloat((0.1 + Math.random() * 0.6).toFixed(2));
        const price = parseFloat((grams * (8 + Math.random() * 6)).toFixed(2));
        randoms.push({
          id: crypto.randomUUID(),
          grams,
          priceEUR: price,
          buzz: Math.floor(3 + Math.random() * 7),
          date: dt.toISOString(),
        });
      }
    }
    setEntries((prev) => [...randoms, ...prev]);
  }, []);

  const value = useMemo(
    () => ({ entries, addEntry, deleteEntry, clearAll, seedSampleEntries }),
    [entries, addEntry, deleteEntry, clearAll, seedSampleEntries]
  );

  return (
    <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>
  );
}

export function useEntries() {
  const ctx = useContext(EntriesContext);
  if (!ctx) throw new Error("useEntries must be used within EntriesProvider");
  return ctx;
}
