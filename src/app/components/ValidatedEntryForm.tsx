"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { logEntryFormSchema, type LogEntryFormData } from "@/lib/validation";
import { useEntries } from "../providers/EntriesProvider";

interface ValidatedEntryFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function ValidatedEntryForm({
  onSuccess,
  onCancel,
  className = "",
}: ValidatedEntryFormProps) {
  const { addEntryFromForm } = useEntries();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<LogEntryFormData>({
    resolver: zodResolver(logEntryFormSchema),
    mode: "onChange",
    defaultValues: {
      grams: 0.1,
      buzz: 5,
      date: new Date().toISOString().slice(0, 16), // Format for datetime-local input
    },
  });

  const watchedGrams = watch("grams");
  const watchedPrice = watch("priceEUR");

  const onSubmit = async (data: LogEntryFormData) => {
    setIsSubmitting(true);

    try {
      const result = addEntryFromForm(data);

      if (result.success) {
        reset();
        onSuccess?.();
      } else {
        // Handle validation error
        console.error("Validation error:", result.error);
      }
    } catch (error) {
      console.error("Failed to add entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`space-y-4 ${className}`}
    >
      <div className="grid grid-cols-2 gap-4">
        {/* Grams */}
        <div>
          <label
            htmlFor="grams"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Grams *
          </label>
          <input
            {...register("grams", { valueAsNumber: true })}
            type="number"
            id="grams"
            step="0.01"
            min="0.01"
            max="100"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
              errors.grams
                ? "border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
            placeholder="0.1"
          />
          {errors.grams && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.grams.message}
            </p>
          )}
        </div>

        {/* Price */}
        <div>
          <label
            htmlFor="priceEUR"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Price (€)
          </label>
          <input
            {...register("priceEUR", { valueAsNumber: true })}
            type="number"
            id="priceEUR"
            step="0.01"
            min="0"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
              errors.priceEUR
                ? "border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
            placeholder="0.00"
          />
          {errors.priceEUR && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.priceEUR.message}
            </p>
          )}
        </div>
      </div>

      {/* Price per gram calculation */}
      {watchedGrams > 0 && watchedPrice && watchedPrice > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Price per gram: €{(watchedPrice / watchedGrams).toFixed(2)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Buzz */}
        <div>
          <label
            htmlFor="buzz"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Buzz Level *
          </label>
          <select
            {...register("buzz", { valueAsNumber: true })}
            id="buzz"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
              errors.buzz
                ? "border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <option key={level} value={level}>
                {level}/10
              </option>
            ))}
          </select>
          {errors.buzz && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.buzz.message}
            </p>
          )}
        </div>

        {/* Date */}
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Date & Time *
          </label>
          <input
            {...register("date")}
            type="datetime-local"
            id="date"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
              errors.date
                ? "border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.date.message}
            </p>
          )}
        </div>
      </div>

      {/* Method */}
      <div>
        <label
          htmlFor="method"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Method
        </label>
        <input
          {...register("method")}
          type="text"
          id="method"
          maxLength={100}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
            errors.method
              ? "border-red-500"
              : "border-gray-300 dark:border-gray-600"
          }`}
          placeholder="e.g., Vaporizer, Joint, etc."
        />
        {errors.method && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.method.message}
          </p>
        )}
      </div>

      {/* Note */}
      <div>
        <label
          htmlFor="note"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Note
        </label>
        <textarea
          {...register("note")}
          id="note"
          rows={3}
          maxLength={500}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white resize-none ${
            errors.note
              ? "border-red-500"
              : "border-gray-300 dark:border-gray-600"
          }`}
          placeholder="Optional notes about this session..."
        />
        {errors.note && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.note.message}
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Adding..." : "Add Entry"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
