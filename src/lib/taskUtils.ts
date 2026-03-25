import type { ClassTask, StudentTaskRecord } from "@/types";

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
  return { completed, missing, avgScore };
}
