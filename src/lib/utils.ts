import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DayOfWeek, ScheduleEntry } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
