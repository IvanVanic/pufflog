"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  context?: "log" | "datetime";
}

export function CalendarModal({
  isOpen,
  onClose,
  selectedDate,
  onDateSelect,
  context = "log",
}: CalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();

    // Get the last date of the month
    const lastDate = lastDay.getDate();

    // Create array of all days to display
    const days = [];

    // Add days from previous month to fill first week
    const prevMonth = new Date(year, month - 1, 0);
    const prevMonthLastDate = prevMonth.getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDate - i),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      });
    }

    // Add days from current month
    const today = new Date();
    for (let i = 1; i <= lastDate; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: date.toDateString() === selectedDate.toDateString(),
      });
    }

    // Add days from next month to fill last week
    const remainingDays = 42 - days.length; // 6 rows * 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      });
    }

    return days;
  }, [currentMonth, selectedDate]);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
    onClose();
  };

  const getTitle = () => {
    return context === "datetime" ? "Select Date" : "Select Date";
  };

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in overflow-hidden"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-background rounded-2xl p-6 mx-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{getTitle()}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-black/[.04] dark:hover:bg-white/[.04] transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="size-5" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg hover:bg-black/[.04] dark:hover:bg-white/[.04] transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="size-5" />
          </button>

          <h3 className="text-lg font-semibold">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>

          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-black/[.04] dark:hover:bg-white/[.04] transition-colors"
            aria-label="Next month"
          >
            <ChevronRightIcon className="size-5" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="h-8 flex items-center justify-center text-sm font-medium text-foreground/60"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {calendarDays.map((day, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(day.date)}
              className={`
                h-10 rounded-lg text-sm font-medium transition-colors
                ${
                  day.isCurrentMonth
                    ? "hover:bg-emerald-100 dark:hover:bg-emerald-900/20"
                    : "text-foreground/30"
                }
                ${
                  day.isToday
                    ? "border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                    : ""
                }
                ${
                  day.isSelected && !day.isToday
                    ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-600"
                    : ""
                }
              `}
            >
              {day.date.getDate()}
            </button>
          ))}
        </div>

        {/* Today Button */}
        <button
          onClick={goToToday}
          className="w-full py-3 px-4 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors font-medium"
        >
          Go to Today
        </button>
      </div>
    </div>
  );
}
