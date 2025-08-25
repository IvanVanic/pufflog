"use client";

import { useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import { useEntries } from "../providers/EntriesProvider";
import type { LogEntry } from "@/types/log";

interface EntryRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    entries: LogEntry[];
    onDelete: (id: string) => void;
  };
}

const EntryRow = ({ index, style, data }: EntryRowProps) => {
  const entry = data.entries[index];

  if (!entry) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      style={style}
      className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {entry.grams}g
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(entry.date)}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">⭐</span>
            <span>{entry.buzz}/10</span>
          </div>

          {entry.priceEUR && (
            <div className="flex items-center gap-1">
              <span className="text-green-500">€</span>
              <span>{entry.priceEUR.toFixed(2)}</span>
            </div>
          )}

          {entry.method && (
            <div className="flex items-center gap-1">
              <span className="text-blue-500">💨</span>
            </div>
          )}
        </div>

        {entry.note && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
            {entry.note}
          </p>
        )}
      </div>

      <button
        onClick={() => data.onDelete(entry.id)}
        className="ml-4 p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
        aria-label="Delete entry"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
};

interface VirtualizedEntryListProps {
  height?: number;
  itemSize?: number;
  className?: string;
}

export function VirtualizedEntryList({
  height = 400,
  itemSize = 80,
  className = "",
}: VirtualizedEntryListProps) {
  const { entries, deleteEntry } = useEntries();

  const sortedEntries = useMemo(() => {
    return [...entries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [entries]);

  const listData = useMemo(
    () => ({
      entries: sortedEntries,
      onDelete: deleteEntry,
    }),
    [sortedEntries, deleteEntry]
  );

  if (sortedEntries.length === 0) {
    return (
      <div
        className={`flex items-center justify-center p-8 text-gray-500 dark:text-gray-400 ${className}`}
      >
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-lg font-medium">No entries yet</p>
          <p className="text-sm">
            Start tracking your usage to see your history here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <List
        height={height}
        itemCount={sortedEntries.length}
        itemSize={itemSize}
        itemData={listData}
        className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
      >
        {EntryRow}
      </List>
    </div>
  );
}
