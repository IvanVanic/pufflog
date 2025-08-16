export type LogEntry = {
  id: string;
  grams: number;
  priceEUR?: number;
  buzz: number; // 1-10
  method?: string;
  note?: string;
  date: string; // ISO string
};

export type TaperStrategy = 'linear' | 'fixed' | 'session' | 'hybrid';

export type TaperPreset = {
  id: string;
  name: string;
  description: string;
  reductionPercent: number;
  weeks: number;
  strategy: TaperStrategy;
};

export type TaperPlan = {
  id: string;
  baseline: number; // grams per day
  goal: number; // target grams per day (0 for abstinence)
  strategy: TaperStrategy;
  reductionPercent?: number; // for linear strategy
  fixedGrams?: number; // for fixed strategy
  fixedInterval?: number; // days between reductions for fixed
  sessionCap?: number; // max sessions per day for session strategy
  startDate: string; // ISO string
  endDate: string; // ISO string
  isActive: boolean;
  reminders: boolean;
  reminderTime?: string; // HH:MM format
  checkIns: 'daily' | 'weekly' | 'none';
  smartAdapt: boolean;
  copingTools: boolean;
};

export type TaperProgress = {
  planId: string;
  date: string;
  targetGrams: number;
  actualGrams: number;
  adherence: number; // percentage
  notes?: string;
};

export type UsageStats = {
  baseline: number; // 14-day average
  thisWeekAvg: number;
  todayTotal: number;
  sessionsThisWeek: number;
  avgGramsPerSession: number;
  moneySpentWeek: number;
  adherencePercent?: number; // only if on taper
  pricePerGram?: number;
};