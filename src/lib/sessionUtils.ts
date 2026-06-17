import type { ClassSessionNote } from "@/types";
import { cn } from "@/lib/utils";

export type ClassSessionStatus = NonNullable<ClassSessionNote["status"]>;

export const SESSION_STATUS_LABELS: Record<ClassSessionStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const SESSION_STATUS_HINTS: Record<ClassSessionStatus, string> = {
  planned: "Scheduled — completes automatically after the session ends.",
  in_progress: "Session is underway.",
  completed: "Session finished. Click to change status.",
  cancelled: "Session will not run. Click to change status.",
};

/** Statuses teachers can pick from the session badge menu. */
export const MANUAL_SESSION_STATUSES = ["planned", "completed", "cancelled"] as const satisfies readonly ClassSessionStatus[];

export function sessionEndDateTime(date: string, endTime: string): Date {
  return new Date(`${date}T${endTime}`);
}

export function getEffectiveSessionStatus(
  record: Pick<ClassSessionNote, "status"> | undefined,
  occurrence: { date: string; endTime: string } | undefined,
  now = new Date()
): ClassSessionStatus {
  const stored = record?.status;
  if (stored === "cancelled") return "cancelled";
  if (stored === "completed") return "completed";
  if (occurrence?.endTime) {
    const end = sessionEndDateTime(occurrence.date, occurrence.endTime);
    if (now > end) return "completed";
  }
  return "planned";
}

export function shouldAutoCompleteSession(
  record: Pick<ClassSessionNote, "status"> | undefined,
  occurrence: { date: string; endTime: string } | undefined,
  now = new Date()
): boolean {
  if (!occurrence?.endTime) return false;
  const stored = record?.status;
  if (stored === "cancelled" || stored === "completed") return false;
  return now > sessionEndDateTime(occurrence.date, occurrence.endTime);
}

export function sessionStatusBadgeClass(status: ClassSessionStatus): string {
  switch (status) {
    case "in_progress":
      return "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300";
    case "completed":
      return "border-green-600/50 bg-green-500/15 text-green-800 dark:border-green-500/40 dark:bg-green-500/15 dark:text-green-300";
    case "cancelled":
      return "border-red-600/50 bg-red-500/15 text-red-800 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-300";
    default:
      return "";
  }
}

export function sessionStatusBadgeCn(
  status: ClassSessionStatus,
  clickable?: boolean,
  compact?: boolean
): string {
  return cn(
    compact ? "text-[10px] font-normal" : "text-[10px] font-normal sm:text-xs",
    sessionStatusBadgeClass(status),
    clickable && "cursor-pointer transition-opacity hover:opacity-80"
  );
}
