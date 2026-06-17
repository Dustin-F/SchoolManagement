import type { AttendanceStatus, Student, Teacher } from "@/types";
import {
  getExtraNameLine,
  getPersonNameLines,
  getPrimaryName,
  migratePersonNames,
} from "@/lib/personNames";

export { getExtraNameLine, getPersonNameLines, migratePersonNames };

export function getStudentSeatNames(student: Student): {
  name1?: string;
  name2?: string;
  name3?: string;
} {
  const lines = getPersonNameLines(student);
  return {
    name1: lines[0],
    name2: lines[1],
    name3: lines[2],
  };
}

export function getStudentDisplayName(student: Student): string {
  return getPrimaryName(student) || "Unnamed student";
}

export function getTeacherDisplayName(teacher: Teacher): string {
  return getPrimaryName(teacher) || "Unnamed teacher";
}

export function getPersonInitials(person: {
  firstName?: string;
  lastName?: string;
  name2First?: string;
  name2Last?: string;
  name3First?: string;
  name3Last?: string;
}): string {
  const first = (person.firstName ?? "").trim();
  const last = (person.lastName ?? "").trim();
  if (first || last) {
    return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "??";
  }
  const n2f = (person.name2First ?? "").trim();
  if (n2f) return n2f.slice(0, 1);
  const n3f = (person.name3First ?? "").trim();
  if (n3f) return n3f.slice(0, 1).toUpperCase();
  return "??";
}

export function getStudentName(id: string, students: Student[]): string {
  const s = students.find((st) => st.id === id);
  return s ? getStudentDisplayName(s) : "Unknown";
}

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-800",
  absent: "bg-red-100 text-red-800",
  late: "bg-amber-100 text-amber-800",
  excused: "bg-blue-100 text-blue-800",
};
