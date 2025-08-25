"use client";

import { useState } from "react";
import { useEntries } from "../providers/EntriesProvider";
import { exportData, exportToCSV, importData } from "@/lib/export-import";

interface DataManagementProps {
  className?: string;
}

export function DataManagement({ className = "" }: DataManagementProps) {
  const { entries, importEntries } = useEntries();
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleExportJSON = () => {
    try {
      // For now, we'll use empty settings and taper plans
      // In a full implementation, these would come from their respective providers
      exportData(entries, {}, []);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleExportCSV = () => {
    try {
      exportToCSV(entries);
    } catch (error) {
      console.error("CSV export failed:", error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(false);

    try {
      const importedData = await importData(file);

      // Import entries
      if (importedData.entries && importedData.entries.length > 0) {
        importEntries(importedData.entries);
        setImportSuccess(true);
      } else {
        setImportError("No valid entries found in the file");
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Import failed");
    } finally {
      setIsImporting(false);
      // Reset the input
      event.target.value = "";
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Data Management
        </h3>

        <div className="grid gap-4">
          {/* Export Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
              Export Data
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Export all data as JSON (includes settings and taper plans)
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {entries.length} entries available
                  </p>
                </div>
                <button
                  onClick={handleExportJSON}
                  disabled={entries.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Export JSON
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Export entries as CSV (spreadsheet format)
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Compatible with Excel, Google Sheets
                  </p>
                </div>
                <button
                  onClick={handleExportCSV}
                  disabled={entries.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
              Import Data
            </h4>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Import data from a previously exported JSON file
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  This will replace your current entries
                </p>

                <label className="block">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    disabled={isImporting}
                    className="hidden"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Select JSON file to import
                    </span>
                    <button
                      type="button"
                      disabled={isImporting}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      onClick={() =>
                        document.querySelector('input[type="file"]')?.click()
                      }
                    >
                      {isImporting ? "Importing..." : "Import JSON"}
                    </button>
                  </div>
                </label>
              </div>

              {/* Import Status */}
              {importError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {importError}
                  </p>
                </div>
              )}

              {importSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Data imported successfully!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Data Summary */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
              Data Summary
            </h4>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">
                  Total Entries
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {entries.length}
                </p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">Total Grams</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {entries
                    .reduce((sum, entry) => sum + entry.grams, 0)
                    .toFixed(2)}
                  g
                </p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">Total Spent</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  €
                  {entries
                    .reduce((sum, entry) => sum + (entry.priceEUR || 0), 0)
                    .toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">Avg Buzz</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {entries.length > 0
                    ? (
                        entries.reduce((sum, entry) => sum + entry.buzz, 0) /
                        entries.length
                      ).toFixed(1)
                    : "0"}
                  /10
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
