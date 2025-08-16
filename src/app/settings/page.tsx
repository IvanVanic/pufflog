"use client";

import { useState } from "react";
import { useSettings } from "../providers/SettingsProvider";
import { useEntries } from "../providers/EntriesProvider";
import {
  TrashIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  CurrencyEuroIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const POPULAR_STRAINS = [
  "Blue Dream",
  "OG Kush",
  "Girl Scout Cookies",
  "Sour Diesel",
  "White Widow",
  "Northern Lights",
  "Jack Herer",
  "Purple Haze",
  "AK-47",
  "Super Silver Haze",
];

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { entries, clearAll } = useEntries();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [selectedStrain] = useState(
    () => POPULAR_STRAINS[Math.floor(Math.random() * POPULAR_STRAINS.length)]
  );

  const handlePricePerGramChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      updateSettings({ defaultPricePerGram: num });
    }
  };

  const handlePresetAmountsChange = (index: number, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      const newAmounts = [...settings.defaultPresetAmounts];
      newAmounts[index] = num;
      updateSettings({ defaultPresetAmounts: newAmounts });
    }
  };

  const handleResetSettings = () => {
    if (resetConfirmation.toLowerCase() === selectedStrain.toLowerCase()) {
      resetSettings();
      setShowResetConfirm(false);
      setResetConfirmation("");
    }
  };

  const handleClearData = () => {
    clearAll();
    setShowClearDataConfirm(false);
  };

  const getStats = () => {
    const totalEntries = entries.length;
    const totalGrams = entries.reduce((sum, e) => sum + e.grams, 0);
    const totalSpent = entries.reduce((sum, e) => sum + (e.priceEUR ?? 0), 0);
    const avgGramsPerEntry = totalEntries > 0 ? totalGrams / totalEntries : 0;

    // Calculate additional stats for better insights
    const entriesWithPrice = entries.filter(
      (e) => e.priceEUR !== null && e.priceEUR !== undefined
    );
    const avgPricePerGram =
      entriesWithPrice.length > 0
        ? entriesWithPrice.reduce((sum, e) => sum + (e.priceEUR ?? 0), 0) /
          entriesWithPrice.reduce((sum, e) => sum + e.grams, 0)
        : 0;

    return {
      totalEntries,
      totalGrams,
      totalSpent,
      avgGramsPerEntry,
      avgPricePerGram: parseFloat(avgPricePerGram.toFixed(2)),
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground overflow-hidden">
      <main className="flex-1 p-4 pt-8 max-w-md w-full mx-auto pb-24 overflow-y-auto overflow-x-hidden">
        <div className="space-y-6">
          {/* Pricing Section */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Pricing</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">
                  Default price per {settings.measurementUnit} (
                  {settings.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.defaultPricePerGram}
                  onChange={(e) => handlePricePerGramChange(e.target.value)}
                  className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none"
                  placeholder="10.00"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => updateSettings({ currency: e.target.value })}
                  className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Measurement Unit</label>
                <select
                  value={settings.measurementUnit}
                  onChange={(e) =>
                    updateSettings({
                      measurementUnit: e.target.value as "g" | "oz",
                    })
                  }
                  className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none"
                >
                  <option value="g">Grams (g)</option>
                  <option value="oz">Ounces (oz)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Log Entry Display Section */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Log Entry Display</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.showPriceInLogs}
                  onChange={(e) =>
                    updateSettings({ showPriceInLogs: e.target.checked })
                  }
                  className="rounded accent-emerald-600"
                />
                <span className="text-sm">Show price in entry cards</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.showBuzzInLogs}
                  onChange={(e) =>
                    updateSettings({ showBuzzInLogs: e.target.checked })
                  }
                  className="rounded accent-emerald-600"
                />
                <span className="text-sm">Show buzz level in entry cards</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.compactMode}
                  onChange={(e) =>
                    updateSettings({ compactMode: e.target.checked })
                  }
                  className="rounded accent-emerald-600"
                />
                <span className="text-sm">Compact entry cards</span>
              </label>
            </div>
          </section>

          {/* Taper Preferences */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Taper</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.roundTaperTargets}
                  onChange={(e) =>
                    updateSettings({ roundTaperTargets: e.target.checked })
                  }
                  className="rounded accent-emerald-600"
                />
                <span className="text-sm">
                  Round projected usage and weekly goals
                </span>
              </label>
            </div>
          </section>

          {/* Usage Defaults Section */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Usage Defaults</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">
                  Quick add amounts ({settings.measurementUnit})
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {settings.defaultPresetAmounts.map((amount, index) => (
                    <input
                      key={index}
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) =>
                        handlePresetAmountsChange(index, e.target.value)
                      }
                      className="rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none text-center"
                      placeholder="0.1"
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Default methods</label>
                <div className="space-y-2">
                  {settings.defaultMethods.map((method, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={method}
                        onChange={(e) => {
                          const newMethods = [...settings.defaultMethods];
                          newMethods[index] = e.target.value;
                          updateSettings({ defaultMethods: newMethods });
                        }}
                        className="flex-1 rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none"
                        placeholder="Method name"
                      />
                      <button
                        onClick={() => {
                          const newMethods = settings.defaultMethods.filter(
                            (_, i) => i !== index
                          );
                          updateSettings({ defaultMethods: newMethods });
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newMethods = [...settings.defaultMethods, ""];
                      updateSettings({ defaultMethods: newMethods });
                    }}
                    className="w-full px-3 py-2 border border-dashed border-black/20 dark:border-white/20 rounded-lg hover:bg-black/[.02] dark:hover:bg-white/[.02] transition-colors text-sm"
                  >
                    + Add method
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Your Data</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg p-3 bg-black/[.04] dark:bg-white/[.04] text-center">
                <div className="text-2xl font-bold">{stats.totalEntries}</div>
                <div className="text-sm text-foreground/60">Total entries</div>
              </div>
              <div className="rounded-lg p-3 bg-black/[.04] dark:bg-white/[.04] text-center">
                <div className="text-2xl font-bold">
                  {stats.totalGrams.toFixed(1)}g
                </div>
                <div className="text-sm text-foreground/60">Total grams</div>
              </div>
              <div className="rounded-lg p-3 bg-black/[.04] dark:bg-white/[.04] text-center">
                <div className="text-2xl font-bold">
                  €{stats.totalSpent.toFixed(2)}
                </div>
                <div className="text-sm text-foreground/60">Total spent</div>
              </div>
              <div className="rounded-lg p-3 bg-black/[.04] dark:bg-white/[.04] text-center">
                <div className="text-2xl font-bold">
                  {stats.avgGramsPerEntry.toFixed(2)}g
                </div>
                <div className="text-sm text-foreground/60">Avg per entry</div>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
            <div className="space-y-3">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
              >
                <ArrowPathIcon className="size-4" />
                Reset all settings
              </button>

              <button
                onClick={() => setShowClearDataConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
              >
                <TrashIcon className="size-4" />
                Clear all data
              </button>
            </div>
          </section>
        </div>

        {/* Reset Settings Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-hidden">
            <div className="w-full max-w-sm bg-background rounded-2xl p-4 mx-4">
              <h3 className="text-lg font-semibold mb-2">Reset Settings?</h3>
              <p className="text-foreground/60 mb-4">
                This will reset all settings to their default values. This
                action cannot be undone.
              </p>
              <div className="mb-4">
                <label className="block text-sm mb-2">
                  Type{" "}
                  <span className="font-semibold text-emerald-600">
                    "{selectedStrain}"
                  </span>{" "}
                  to confirm:
                </label>
                <input
                  type="text"
                  value={resetConfirmation}
                  onChange={(e) => setResetConfirmation(e.target.value)}
                  className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none"
                  placeholder="Enter strain name..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowResetConfirm(false);
                    setResetConfirmation("");
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-black/[.04] dark:bg-white/[.04] hover:bg-black/[.08] dark:hover:bg-white/[.08] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetSettings}
                  disabled={
                    resetConfirmation.toLowerCase() !==
                    selectedStrain.toLowerCase()
                  }
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clear Data Confirmation Modal */}
        {showClearDataConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-hidden">
            <div className="w-full max-w-sm bg-background rounded-2xl p-4 mx-4">
              <h3 className="text-lg font-semibold mb-2">Clear All Data?</h3>
              <p className="text-foreground/60 mb-4">
                This will permanently delete all your log entries and cannot be
                undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowClearDataConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-black/[.04] dark:bg-white/[.04] hover:bg-black/[.08] dark:hover:bg-white/[.08] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearData}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear Data
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
