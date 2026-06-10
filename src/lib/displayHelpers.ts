import type { AttendanceStatus, Student, Teacher } from "@/types";

function compact(value?: string): string {
  return (value ?? "").trim();
}

export function getStudentDisplayName(student: Student): string {
  const english = `${compact(student.firstName)} ${compact(student.lastName)}`.trim();
  if (english) return english;
  if (compact(student.chineseName)) return compact(student.chineseName);
  if (compact(student.pinyinName)) return compact(student.pinyinName);
  return "Unnamed student";
}

export function getTeacherDisplayName(teacher: Teacher): string {
  const english = `${compact(teacher.firstName)} ${compact(teacher.lastName)}`.trim();
  if (english) return english;
  if (compact(teacher.chineseName)) return compact(teacher.chineseName);
  if (compact(teacher.pinyinName)) return compact(teacher.pinyinName);
  return "Unnamed teacher";
}

export function getPersonInitials(person: {
  firstName?: string;
  lastName?: string;
  chineseName?: string;
  pinyinName?: string;
}): string {
  const first = compact(person.firstName);
  const last = compact(person.lastName);
  if (first || last) return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "??";
  const chinese = compact(person.chineseName);
  if (chinese) return chinese.slice(0, 1);
  const pinyin = compact(person.pinyinName);
  if (pinyin) return pinyin.slice(0, 1).toUpperCase();
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

