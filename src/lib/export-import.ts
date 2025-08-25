import { validateExportData, type ExportData } from "./validation";
import type { LogEntry } from "@/types/log";

// Export data to JSON file
export const exportData = (
  entries: LogEntry[],
  settings: any,
  taperPlans?: any[]
) => {
  const exportData: ExportData = {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    entries,
    settings,
    taperPlans: taperPlans || [],
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pufflog-backup-${
    new Date().toISOString().split("T")[0]
  }.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export data to CSV
export const exportToCSV = (entries: LogEntry[]) => {
  const headers = ["Date", "Grams", "Price (EUR)", "Buzz", "Method", "Note"];
  const csvContent = [
    headers.join(","),
    ...entries.map((entry) =>
      [
        new Date(entry.date).toLocaleDateString(),
        entry.grams,
        entry.priceEUR || "",
        entry.buzz,
        entry.method || "",
        entry.note || "",
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pufflog-entries-${
    new Date().toISOString().split("T")[0]
  }.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Import data from JSON file
export const importData = async (file: File): Promise<ExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        const validation = validateExportData(data);
        if (!validation.success) {
          reject(new Error(`Invalid data format: ${validation.error.message}`));
          return;
        }

        resolve(validation.data);
      } catch (error) {
        reject(new Error("Failed to parse JSON file"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
};

// Auto-backup functionality
export const setupAutoBackup = (
  entries: LogEntry[],
  settings: any,
  taperPlans: any[],
  interval: "daily" | "weekly" | "monthly"
) => {
  const now = new Date();
  let nextBackup: Date;

  switch (interval) {
    case "daily":
      nextBackup = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      break;
    case "weekly":
      nextBackup = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case "monthly":
      nextBackup = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate()
      );
      break;
  }

  // Store next backup time in localStorage
  localStorage.setItem("pufflog.nextBackup", nextBackup.toISOString());

  // Schedule the backup
  const timeUntilBackup = nextBackup.getTime() - now.getTime();
  setTimeout(() => {
    exportData(entries, settings, taperPlans);
    // Schedule next backup
    setupAutoBackup(entries, settings, taperPlans, interval);
  }, timeUntilBackup);
};

// Check if auto-backup is due
export const checkAutoBackup = (): boolean => {
  const nextBackup = localStorage.getItem("pufflog.nextBackup");
  if (!nextBackup) return false;

  const nextBackupDate = new Date(nextBackup);
  const now = new Date();

  return now >= nextBackupDate;
};

// Get backup status
export const getBackupStatus = () => {
  const nextBackup = localStorage.getItem("pufflog.nextBackup");
  if (!nextBackup) return null;

  const nextBackupDate = new Date(nextBackup);
  const now = new Date();
  const timeUntilBackup = nextBackupDate.getTime() - now.getTime();

  if (timeUntilBackup <= 0) {
    return { status: "due" as const, nextBackup: nextBackupDate };
  }

  const days = Math.floor(timeUntilBackup / (24 * 60 * 60 * 1000));
  const hours = Math.floor(
    (timeUntilBackup % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
  );

  return {
    status: "scheduled" as const,
    nextBackup: nextBackupDate,
    timeRemaining: { days, hours },
  };
};
