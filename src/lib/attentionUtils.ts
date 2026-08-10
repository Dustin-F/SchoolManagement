import type {
  AttendanceRecord,
  ClassTask,
  SchoolClass,
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
      else if (
        isTaskOverdue(task, todayStr) &&
        rec.status !== "completed"
      ) {
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

const REASON_PRIORITY: Record<AttentionReason, number> = {
  no_attendance: 0,
  overdue_task: 1,
  missing_task: 2,
  negative_points: 3,
};

export interface IncompleteTodoItem {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  reasons: AttentionReason[];
  sessionDate: string;
}

/** @deprecated use IncompleteTodoItem */
export type DashboardIncompleteItem = IncompleteTodoItem;

export interface IncompleteTodoSummary {
  total: number;
  noAttendance: number;
  overdueTask: number;
  missingTask: number;
  negativePoints: number;
}

/** @deprecated use IncompleteTodoSummary */
export type DashboardIncompleteSummary = IncompleteTodoSummary;

export interface IncompleteTodoRow {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  reason: AttentionReason;
  sessionDate: string;
  detail?: string;
  taskId?: string;
  taskRecordId?: string;
}

export const ATTENTION_FILTER_OPTIONS: { value: AttentionReason | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "no_attendance", label: ATTENTION_LABELS.no_attendance },
  { value: "overdue_task", label: ATTENTION_LABELS.overdue_task },
  { value: "missing_task", label: ATTENTION_LABELS.missing_task },
];

function pointsTodayForClass(
  classId: string,
  pointEvents: { classId: string; studentId: string; date: string; points: number }[],
  todayStr: string
): Map<string, number> {
  const map = new Map<string, number>();
  for (const event of pointEvents) {
    if (event.classId !== classId || event.date !== todayStr) continue;
    map.set(event.studentId, (map.get(event.studentId) ?? 0) + event.points);
  }
  return map;
}

export function getIncompleteTodoItems(
  classes: SchoolClass[],
  students: Student[],
  classTasks: ClassTask[],
  studentTaskRecords: StudentTaskRecord[],
  attendance: AttendanceRecord[],
  pointEvents: { classId: string; studentId: string; date: string; points: number }[],
  todayStr: string,
  todaysClassIds: Set<string>
): IncompleteTodoItem[] {
  const studentById = new Map(students.map((s) => [s.id, s]));
  const items: IncompleteTodoItem[] = [];

  for (const cls of classes) {
    if (cls.archived) continue;
    const classStudents = cls.studentIds
      .map((id) => studentById.get(id))
      .filter((s): s is Student => !!s && !s.archived);
    if (classStudents.length === 0) continue;

    const lessonToday = todaysClassIds.has(cls.id);
    const dayAttendance = attendance.filter(
      (a) => a.classId === cls.id && a.date === todayStr
    );
    const activeTasks = classTasks.filter((t) => t.classId === cls.id && !t.archived);
    const pointsTodayByStudent = pointsTodayForClass(cls.id, pointEvents, todayStr);

    const flags = getStudentAttentionFlags(
      classStudents,
      todayStr,
      todayStr,
      dayAttendance,
      activeTasks,
      studentTaskRecords,
      pointsTodayByStudent
    );

    for (const flag of flags) {
      const reasons = flag.reasons.filter((reason) => {
        if (reason === "negative_points") return false;
        if (reason === "no_attendance") return lessonToday;
        return true;
      });
      if (reasons.length === 0) continue;
      items.push({
        studentId: flag.studentId,
        studentName: flag.studentName,
        classId: cls.id,
        className: cls.name,
        reasons,
        sessionDate: todayStr,
      });
    }
  }

  return items.sort((a, b) => {
    const aPri = Math.min(...a.reasons.map((r) => REASON_PRIORITY[r]));
    const bPri = Math.min(...b.reasons.map((r) => REASON_PRIORITY[r]));
    if (aPri !== bPri) return aPri - bPri;
    return a.className.localeCompare(b.className) || a.studentName.localeCompare(b.studentName);
  });
}

/** @deprecated use getIncompleteTodoItems */
export const getDashboardIncompleteItems = getIncompleteTodoItems;

export function expandIncompleteTodoRows(
  items: IncompleteTodoItem[],
  classTasks: ClassTask[],
  studentTaskRecords: StudentTaskRecord[],
  todayStr: string
): IncompleteTodoRow[] {
  const rows: IncompleteTodoRow[] = [];

  for (const item of items) {
    if (item.reasons.includes("no_attendance")) {
      rows.push({
        id: `${item.classId}-${item.studentId}-no_attendance`,
        studentId: item.studentId,
        studentName: item.studentName,
        classId: item.classId,
        className: item.className,
        reason: "no_attendance",
        sessionDate: item.sessionDate,
        detail: "Attendance not marked for today",
      });
    }

    const classTasksForStudent = classTasks.filter(
      (t) => t.classId === item.classId && !t.archived
    );
    for (const task of classTasksForStudent) {
      const rec = studentTaskRecords.find(
        (r) => r.taskId === task.id && r.studentId === item.studentId
      );
      if (!rec || rec.status === "completed") continue;

      if (item.reasons.includes("missing_task") && rec.status === "missing") {
        rows.push({
          id: `${item.classId}-${item.studentId}-missing-${task.id}`,
          studentId: item.studentId,
          studentName: item.studentName,
          classId: item.classId,
          className: item.className,
          reason: "missing_task",
          sessionDate: item.sessionDate,
          detail: task.title,
          taskId: task.id,
          taskRecordId: rec.id,
        });
      }
      if (
        item.reasons.includes("overdue_task") &&
        isTaskOverdue(task, todayStr) &&
        rec.status !== "missing"
      ) {
        rows.push({
          id: `${item.classId}-${item.studentId}-overdue-${task.id}`,
          studentId: item.studentId,
          studentName: item.studentName,
          classId: item.classId,
          className: item.className,
          reason: "overdue_task",
          sessionDate: item.sessionDate,
          detail: task.title,
          taskId: task.id,
          taskRecordId: rec.id,
        });
      }
    }
  }

  return rows.sort((a, b) => {
    const pri = REASON_PRIORITY[a.reason] - REASON_PRIORITY[b.reason];
    if (pri !== 0) return pri;
    return (
      a.className.localeCompare(b.className) ||
      a.studentName.localeCompare(b.studentName) ||
      (a.detail ?? "").localeCompare(b.detail ?? "")
    );
  });
}

export function filterIncompleteTodoRows(
  rows: IncompleteTodoRow[],
  options: { classId?: string; reason?: AttentionReason | "all" }
): IncompleteTodoRow[] {
  return rows.filter((row) => {
    if (options.classId && options.classId !== "all" && row.classId !== options.classId) {
      return false;
    }
    if (options.reason && options.reason !== "all" && row.reason !== options.reason) {
      return false;
    }
    return true;
  });
}

export function summarizeIncompleteTodo(items: IncompleteTodoItem[]): IncompleteTodoSummary {
  let noAttendance = 0;
  let overdueTask = 0;
  let missingTask = 0;

  for (const item of items) {
    if (item.reasons.includes("no_attendance")) noAttendance += 1;
    if (item.reasons.includes("overdue_task")) overdueTask += 1;
    if (item.reasons.includes("missing_task")) missingTask += 1;
  }

  return {
    total: items.length,
    noAttendance,
    overdueTask,
    missingTask,
    negativePoints: 0,
  };
}

/** @deprecated use summarizeIncompleteTodo */
export const summarizeDashboardIncomplete = summarizeIncompleteTodo;

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
