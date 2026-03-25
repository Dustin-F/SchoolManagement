import type { BehaviourSeverity, AttendanceStatus, Student } from "@/types";

export function getStudentName(id: string, students: Student[]): string {
  const s = students.find((st) => st.id === id);
  return s ? `${s.firstName} ${s.lastName}` : "Unknown";
}

export const SEVERITY_BADGE_VARIANT: Record<
  BehaviourSeverity,
  "success" | "warning" | "secondary" | "destructive"
> = {
  positive: "success",
  minor: "warning",
  moderate: "secondary",
  major: "destructive",
};

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-800",
  absent: "bg-red-100 text-red-800",
  late: "bg-amber-100 text-amber-800",
  excused: "bg-blue-100 text-blue-800",
};

