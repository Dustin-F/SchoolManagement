import type { ClassTask, StudentTaskRecord } from "@/types";
import { effectivePercent, resolveScoreMode } from "@/lib/taskScoringUtils";

export function formatTaskAverage(
  task: ClassTask,
  avgScore: number | null,
  avgPercent: number | null
): string | null {
  if (resolveScoreMode(task) === "points" && avgScore != null) return `Avg ${avgScore}`;
  if (avgPercent != null) return `Avg ${avgPercent}%`;
  if (avgScore != null) return `Avg ${avgScore}`;
  return null;
}

export function deadlineDay(deadline: string): string {
  return deadline.includes("T") ? deadline.split("T")[0] : deadline;
}

export function isTaskOverdue(task: ClassTask, todayStr: string): boolean {
  const d = deadlineDay(task.deadline);
  return d < todayStr;
}

export function taskProgressForEnrolled(
  task: ClassTask,
  records: StudentTaskRecord[],
  enrolledStudentIds: string[]
): {
  completed: number;
  missing: number;
  avgScore: number | null;
  avgPercent: number | null;
} {
  const enrolled = new Set(enrolledStudentIds);
  const relevant = records.filter((r) => r.taskId === task.id && enrolled.has(r.studentId));
  const completed = relevant.filter((r) => r.status === "completed").length;
  const missing = relevant.filter((r) => r.status === "missing").length;
  const scored = relevant.filter((r) => r.score != null && !Number.isNaN(r.score as number));
  const avgScore =
    scored.length > 0
      ? Math.round((scored.reduce((s, r) => s + (r.score as number), 0) / scored.length) * 10) / 10
      : null;

  const percents = relevant
    .map((r) => effectivePercent(task, r))
    .filter((p): p is number => p != null);
  const avgPercent =
    percents.length > 0
      ? Math.round(percents.reduce((s, p) => s + p, 0) / percents.length)
      : null;

  return { completed, missing, avgScore, avgPercent };
}

/** Short progress line for task lists (e.g. "18/24 graded · 3 missing"). */
export function formatTaskListProgress(
  task: ClassTask,
  records: StudentTaskRecord[],
  enrolledStudentIds: string[]
): string {
  const total = enrolledStudentIds.length;
  if (total === 0) return "No students";

  const enrolled = new Set(enrolledStudentIds);
  const relevant = records.filter((r) => r.taskId === task.id && enrolled.has(r.studentId));
  const graded = relevant.filter(
    (r) => r.score != null && !Number.isNaN(r.score as number)
  ).length;
  const { completed, missing } = taskProgressForEnrolled(task, records, enrolledStudentIds);

  const parts: string[] = [`${graded}/${total} graded`];
  if (completed > 0) parts.push(`${completed} done`);
  if (missing > 0) parts.push(`${missing} missing`);
  return parts.join(" · ");
}
