import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DayOfWeek, ScheduleEntry } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Local calendar date as YYYY-MM-DD (not UTC). */
export function getLocalToday(): string {
  return toLocalDateString(new Date());
}

export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isIsoDateString(value: string | null | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseIsoDateString(value: string | undefined | null): Date | undefined {
  if (!isIsoDateString(value)) return undefined;
  return new Date(`${value}T00:00:00`);
}

export function formatDate(date: string | Date): string {
  const d =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? new Date(date + "T00:00:00")
      : new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const DAY_SHORT: Record<DayOfWeek, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed",
  thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
};

export const DAY_ORDER: DayOfWeek[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

export function formatScheduleSummary(schedule: ScheduleEntry[]): string {
  if (schedule.length === 0) return "No schedule";
  return [...schedule]
    .sort((a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek))
    .map((s) => `${DAY_SHORT[s.dayOfWeek]} ${s.startTime}–${s.endTime}`)
    .join(", ");
}
