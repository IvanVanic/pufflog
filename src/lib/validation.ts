import { z } from "zod";

// LogEntry validation schema
export const logEntrySchema = z.object({
  id: z.string().uuid(),
  grams: z
    .number()
    .positive("Grams must be a positive number")
    .max(100, "Grams cannot exceed 100"),
  priceEUR: z.number().positive("Price must be a positive number").optional(),
  buzz: z
    .number()
    .int()
    .min(1, "Buzz must be at least 1")
    .max(10, "Buzz cannot exceed 10"),
  method: z.string().max(100, "Method description too long").optional(),
  note: z.string().max(500, "Note too long").optional(),
  date: z.string().datetime("Invalid date format"),
});

// Form input schema (without id, for new entries)
export const logEntryFormSchema = logEntrySchema.omit({ id: true });

// Settings validation schema
export const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  reminderTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format")
    .optional(),
  autoBackup: z.boolean().default(false),
  backupInterval: z.enum(["daily", "weekly", "monthly"]).default("weekly"),
  notifications: z.boolean().default(true),
  hapticFeedback: z.boolean().default(true),
});

// Taper plan validation schema
export const taperPlanSchema = z.object({
  id: z.string().uuid(),
  baseline: z.number().positive("Baseline must be positive"),
  goal: z.number().min(0, "Goal cannot be negative"),
  strategy: z.enum(["linear", "exponential", "sigmoid", "fixed", "hybrid"]),
  reductionPercent: z.number().min(0).max(100).optional(),
  fixedGrams: z.number().positive().optional(),
  fixedInterval: z.number().positive().optional(),
  sessionCap: z.number().positive().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.boolean(),
  reminders: z.boolean(),
  reminderTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  checkIns: z.enum(["daily", "weekly", "none"]),
  smartAdapt: z.boolean(),
  copingTools: z.boolean(),
});

// Export/Import data schema
export const exportDataSchema = z.object({
  version: z.string(),
  timestamp: z.string().datetime(),
  entries: z.array(logEntrySchema),
  settings: settingsSchema,
  taperPlans: z.array(taperPlanSchema).optional(),
});

// Type exports
export type LogEntryFormData = z.infer<typeof logEntryFormSchema>;
export type SettingsData = z.infer<typeof settingsSchema>;
export type TaperPlanData = z.infer<typeof taperPlanSchema>;
export type ExportData = z.infer<typeof exportDataSchema>;

// Validation functions
export const validateLogEntry = (data: unknown) => {
  return logEntrySchema.safeParse(data);
};

export const validateLogEntryForm = (data: unknown) => {
  return logEntryFormSchema.safeParse(data);
};

export const validateSettings = (data: unknown) => {
  return settingsSchema.safeParse(data);
};

export const validateExportData = (data: unknown) => {
  return exportDataSchema.safeParse(data);
};

// Helper function to create a new log entry with validation
export const createLogEntry = (
  data: LogEntryFormData
): LogEntryFormData & { id: string } => {
  const validated = logEntryFormSchema.parse(data);
  return {
    ...validated,
    id: crypto.randomUUID(),
  };
};
