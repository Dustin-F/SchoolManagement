import type { BehaviourSkill, PointEvent, SchoolClass, Student } from "@/types";
import { getStudentDisplayName } from "@/lib/displayHelpers";
import { getLocalToday } from "@/lib/utils";

export function getWeekStart(date = new Date()): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function getWeekEnd(weekStart: Date): Date {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  return end;
}

export function formatWeekRange(weekStart: Date): string {
  const end = getWeekEnd(weekStart);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const y = weekStart.getFullYear() === end.getFullYear() ? "" : `, ${end.getFullYear()}`;
  return `${weekStart.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}${y}`;
}

export function isDateInWeek(dateStr: string, weekStart: Date): boolean {
  const d = new Date(`${dateStr}T00:00:00`);
  const start = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
  const end = getWeekEnd(weekStart);
  end.setHours(23, 59, 59, 999);
  return d >= start && d <= end;
}

export function sumPoints(events: PointEvent[]): number {
  return events.reduce((sum, e) => sum + e.points, 0);
}

export function pointsByStudent(
  events: PointEvent[],
  studentIds?: string[]
): Map<string, number> {
  const map = new Map<string, number>();
  const allowed = studentIds ? new Set(studentIds) : null;
  for (const e of events) {
    if (allowed && !allowed.has(e.studentId)) continue;
    map.set(e.studentId, (map.get(e.studentId) ?? 0) + e.points);
  }
  return map;
}

export function activeSkillsSorted(skills: BehaviourSkill[]): BehaviourSkill[] {
  return [...skills]
    .filter((s) => s.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export function skillsForClassToolbar(
  skills: BehaviourSkill[],
  cls: SchoolClass
): BehaviourSkill[] {
  const active = activeSkillsSorted(skills);
  if (!cls.pinnedSkillIds?.length) {
    return active.slice(0, 8);
  }
  const byId = new Map(active.map((s) => [s.id, s]));
  const pinned = cls.pinnedSkillIds.map((id) => byId.get(id)).filter(Boolean) as BehaviourSkill[];
  return pinned.length > 0 ? pinned : active.slice(0, 8);
}

export function skillButtonClass(skill: BehaviourSkill): string {
  if (skill.points > 0) {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 dark:text-emerald-300";
  }
  return "border-amber-500/40 bg-amber-500/10 text-amber-900 hover:bg-amber-500/20 dark:text-amber-200";
}

export interface WeeklyReportRow {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  weekPoints: number;
  todayPoints: number;
  eventCount: number;
}

export function buildWeeklyReport(
  students: Student[],
  classes: SchoolClass[],
  events: PointEvent[],
  weekStart: Date,
  classFilterId?: string
): WeeklyReportRow[] {
  const today = getLocalToday();
  const weekEvents = events.filter((e) => isDateInWeek(e.date, weekStart));
  const filteredClasses = classFilterId
    ? classes.filter((c) => c.id === classFilterId)
    : classes;

  const rows: WeeklyReportRow[] = [];
  for (const cls of filteredClasses) {
    for (const studentId of cls.studentIds) {
      const student = students.find((s) => s.id === studentId);
      if (!student) continue;
      const studentEvents = weekEvents.filter(
        (e) => e.studentId === studentId && e.classId === cls.id
      );
      const todayEvents = studentEvents.filter((e) => e.date === today);
      rows.push({
        studentId,
        studentName: getStudentDisplayName(student),
        classId: cls.id,
        className: cls.name,
        weekPoints: sumPoints(studentEvents),
        todayPoints: sumPoints(todayEvents),
        eventCount: studentEvents.length,
      });
    }
  }
  return rows.sort(
    (a, b) => b.weekPoints - a.weekPoints || a.studentName.localeCompare(b.studentName)
  );
}

export function exportPointEventsCsv(
  events: PointEvent[],
  classes: SchoolClass[],
  skills: BehaviourSkill[],
  getStudentName: (id: string) => string
): string {
  const skillName = new Map(skills.map((s) => [s.id, s.name]));
  const className = new Map(classes.map((c) => [c.id, c.name]));
  const header = "Date,Student,Class,Skill,Points,Note";
  const lines = [...events]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((e) => {
      const cols = [
        e.date,
        getStudentName(e.studentId),
        className.get(e.classId) ?? "",
        skillName.get(e.skillId) ?? "Unknown skill",
        String(e.points),
        (e.note ?? "").replace(/"/g, '""'),
      ];
      return cols.map((c) => `"${c}"`).join(",");
    });
  return [header, ...lines].join("\n");
}

export function shiftWeek(weekStart: Date, deltaWeeks: number): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + deltaWeeks * 7);
  return d;
}

