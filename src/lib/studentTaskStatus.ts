import type { StudentTaskStatus } from "@/types";

/** Dropdown order: incomplete-style states first, then complete, then missing. */
export const STUDENT_TASK_STATUS_ORDER: StudentTaskStatus[] = [
  "not_started",
  "in_progress",
  "completed",
  "missing",
];

export const studentTaskStatusLabel: Record<StudentTaskStatus, string> = {
  not_started: "Incomplete",
  in_progress: "In progress",
  completed: "Complete",
  missing: "Missing",
};

/** Select trigger / row emphasis */
export function studentTaskStatusSelectClass(status: StudentTaskStatus): string {
  const map: Record<StudentTaskStatus, string> = {
    completed:
      "border-emerald-500/50 bg-emerald-500/10 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-100",
    not_started: "border-border bg-muted/70 text-foreground",
    in_progress:
      "border-amber-500/50 bg-amber-500/10 text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/35 dark:text-amber-100",
    missing:
      "border-red-500/50 bg-red-500/10 text-red-900 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-100",
  };
  return map[status];
}

export function studentTaskStatusItemClass(status: StudentTaskStatus): string {
  const map: Record<StudentTaskStatus, string> = {
    completed: "focus:bg-emerald-500/10",
    not_started: "focus:bg-muted",
    in_progress: "focus:bg-amber-500/10",
    missing: "focus:bg-red-500/10",
  };
  return map[status];
}

/** Badge on tables / cards */
export function studentTaskStatusBadgeClass(status: StudentTaskStatus): string {
  const map: Record<StudentTaskStatus, string> = {
    completed:
      "border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-100",
    not_started:
      "border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100",
    in_progress:
      "border-amber-200 bg-amber-100 text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100",
    missing:
      "border-red-200 bg-red-100 text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100",
  };
  return map[status];
}

export function isStatusCompleted(status: StudentTaskStatus): boolean {
  return status === "completed";
}
