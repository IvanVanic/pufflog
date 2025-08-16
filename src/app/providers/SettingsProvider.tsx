"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface AppSettings {
  // Pricing
  defaultPricePerGram: number;
  currency: string;

  // Usage defaults
  defaultPresetAmounts: number[];
  defaultBuzzLevel: number;
  defaultMethods: string[];

  // Units
  measurementUnit: "g" | "oz";

  // Notifications
  enableNotifications: boolean;
  dailyReminder: boolean;
  reminderTime: string;

  // Data management
  autoBackup: boolean;
  dataRetentionDays: number;

  // Display preferences
  showPriceInLogs: boolean;
  showBuzzInLogs: boolean;
  compactMode: boolean;

  // Taper preferences
  roundTaperTargets: boolean; // round preview and weekly targets to friendly increments
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultPricePerGram: 10.0,
  currency: "EUR",
  defaultPresetAmounts: [0.1, 0.2, 0.3],
  defaultBuzzLevel: 5,
  defaultMethods: ["Joint", "Pipe", "Bong", "Vape"],
  measurementUnit: "g",

  enableNotifications: false,
  dailyReminder: false,
  reminderTime: "20:00",
  autoBackup: true,
  dataRetentionDays: 365,
  showPriceInLogs: true,
  showBuzzInLogs: true,
  compactMode: false,
  roundTaperTargets: true,
};

type SettingsContextValue = {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  getPricePerGram: () => number;
  getPresetAmounts: () => number[];
};

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "pufflog.settings";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setSettings({ ...DEFAULT_SETTINGS, ...saved });
      }
    } catch (error) {
      console.warn("Failed to load settings:", error);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn("Failed to save settings:", error);
    }
  }, [settings]);

  // Apply dark theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const getPricePerGram = useCallback(() => {
    return settings.defaultPricePerGram;
  }, [settings.defaultPricePerGram]);

  const getPresetAmounts = useCallback(() => {
    return settings.defaultPresetAmounts;
  }, [settings.defaultPresetAmounts]);

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      resetSettings,
      getPricePerGram,
      getPresetAmounts,
    }),
    [settings, updateSettings, resetSettings, getPricePerGram, getPresetAmounts]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
