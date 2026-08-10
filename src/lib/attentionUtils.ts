import type {
  AttendanceRecord,
  ClassTask,
  Student,
  StudentTaskRecord,
} from "@/types";
import { getStudentDisplayName } from "@/lib/displayHelpers";
import { isTaskOverdue } from "@/lib/taskUtils";

export type AttentionReason =
  | "no_attendance"
  | "overdue_task"
  | "missing_task"
  | "negative_points";

export interface StudentAttentionFlag {
  studentId: string;
  studentName: string;
  reasons: AttentionReason[];
}

export function getStudentAttentionFlags(
  students: Student[],
  _sessionDate: string,
  todayStr: string,
  dayAttendance: AttendanceRecord[],
  activeTasks: ClassTask[],
  studentTaskRecords: StudentTaskRecord[],
  pointsTodayByStudent: Map<string, number>
): StudentAttentionFlag[] {
  const flags: StudentAttentionFlag[] = [];

  for (const student of students) {
    const reasons: AttentionReason[] = [];
    const attended = dayAttendance.some((a) => a.studentId === student.id);
    if (!attended) reasons.push("no_attendance");

    for (const task of activeTasks) {
      const rec = studentTaskRecords.find(
        (r) => r.taskId === task.id && r.studentId === student.id
      );
      if (!rec) continue;
      if (rec.status === "missing") reasons.push("missing_task");
      else if (isTaskOverdue(task, todayStr) && rec.status !== "completed") {
        reasons.push("overdue_task");
      }
    }

    const pts = pointsTodayByStudent.get(student.id) ?? 0;
    if (pts < 0) reasons.push("negative_points");

    if (reasons.length > 0) {
      flags.push({
        studentId: student.id,
        studentName: getStudentDisplayName(student),
        reasons: [...new Set(reasons)],
      });
    }
  }

  return flags;
}

export const ATTENTION_LABELS: Record<AttentionReason, string> = {
  no_attendance: "No attendance",
  overdue_task: "Overdue task",
  missing_task: "Missing work",
  negative_points: "Negative points",
};

export function getAttendanceRate(
  studentId: string,
  classId: string,
  attendance: AttendanceRecord[]
): { rate: number; total: number; present: number } {
  const rows = attendance.filter(
    (a) => a.studentId === studentId && a.classId === classId
  );
  if (rows.length === 0) return { rate: 100, total: 0, present: 0 };
  const present = rows.filter((a) => a.status === "present" || a.status === "late").length;
  return { rate: Math.round((present / rows.length) * 100), total: rows.length, present };
}

export function getConsecutiveAbsences(
  studentId: string,
  classId: string,
  attendance: AttendanceRecord[],
  sessionDates: string[]
): number {
  const sorted = [...sessionDates].sort().reverse();
  let count = 0;
  for (const date of sorted) {
    const rec = attendance.find(
      (a) => a.studentId === studentId && a.classId === classId && a.date === date
    );
    if (rec?.status === "absent") count++;
    else if (rec) break;
  }
  return count;
}

export interface AttendanceAlert {
  studentId: string;
  studentName: string;
  message: string;
}

export function getAttendanceAlerts(
  students: Student[],
  classId: string,
  attendance: AttendanceRecord[],
  options: { minRatePercent?: number; maxConsecutiveAbsences?: number } = {}
): AttendanceAlert[] {
  const minRate = options.minRatePercent ?? 80;
  const maxStreak = options.maxConsecutiveAbsences ?? 3;
  const dates = [...new Set(attendance.filter((a) => a.classId === classId).map((a) => a.date))];
  const alerts: AttendanceAlert[] = [];

  for (const student of students) {
    const { rate, total } = getAttendanceRate(student.id, classId, attendance);
    if (total >= 5 && rate < minRate) {
      alerts.push({
        studentId: student.id,
        studentName: getStudentDisplayName(student),
        message: `Attendance ${rate}% (below ${minRate}%)`,
      });
    }
    const streak = getConsecutiveAbsences(student.id, classId, attendance, dates);
    if (streak >= maxStreak) {
      alerts.push({
        studentId: student.id,
        studentName: getStudentDisplayName(student),
        message: `${streak} absences in a row`,
      });
    }
  }

  return alerts;
}
