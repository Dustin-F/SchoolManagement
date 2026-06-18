import type {
  AcademicTerm,
  AttendanceRecord,
  AttendanceStatus,
  BehaviourSkill,
  PointEvent,
  SchoolClass,
} from "@/types";

export const REPORT_SCHOOL_NAME = "SchoolHub International School";
export const REPORT_SCHOOL_TAGLINE = "Student progress report";

export function isDateInTerm(date: string, term: AcademicTerm): boolean {
  return date >= term.startDate && date <= term.endDate;
}

export interface AttendanceStatusCounts {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

export interface AttendanceSummary extends AttendanceStatusCounts {
  ratePercent: number;
  byClass: Array<{
    classId: string;
    className: string;
    counts: AttendanceStatusCounts;
    ratePercent: number;
  }>;
}

function emptyAttendanceCounts(): AttendanceStatusCounts {
  return { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
}

function tallyAttendance(records: AttendanceRecord[]): AttendanceStatusCounts {
  const counts = emptyAttendanceCounts();
  for (const r of records) {
    counts[r.status] += 1;
    counts.total += 1;
  }
  return counts;
}

function attendanceRate(counts: AttendanceStatusCounts): number {
  if (counts.total === 0) return 0;
  const attended = counts.present + counts.late;
  return Math.round((attended / counts.total) * 100);
}

export function buildTermAttendanceSummary(
  studentId: string,
  term: AcademicTerm,
  attendance: AttendanceRecord[],
  classes: SchoolClass[]
): AttendanceSummary {
  const termRecords = attendance.filter(
    (a) => a.studentId === studentId && isDateInTerm(a.date, term)
  );
  const overall = tallyAttendance(termRecords);
  const classIds = [...new Set(termRecords.map((r) => r.classId))];

  const byClass = classIds
    .map((classId) => {
      const cls = classes.find((c) => c.id === classId);
      const records = termRecords.filter((r) => r.classId === classId);
      const counts = tallyAttendance(records);
      return {
        classId,
        className: cls?.name ?? "Unknown class",
        counts,
        ratePercent: attendanceRate(counts),
      };
    })
    .sort((a, b) => a.className.localeCompare(b.className));

  return {
    ...overall,
    ratePercent: attendanceRate(overall),
    byClass,
  };
}

export interface SkillPointsRollup {
  skillId: string;
  name: string;
  emoji?: string;
  type: BehaviourSkill["type"];
  totalPoints: number;
  eventCount: number;
}

export interface BehaviourSummary {
  totalPoints: number;
  positivePoints: number;
  negativePoints: number;
  eventCount: number;
  bySkill: SkillPointsRollup[];
  byClass: Array<{
    classId: string;
    className: string;
    totalPoints: number;
    positivePoints: number;
    negativePoints: number;
    eventCount: number;
  }>;
  events: PointEvent[];
}

export function buildTermBehaviourSummary(
  studentId: string,
  term: AcademicTerm,
  pointEvents: PointEvent[],
  behaviourSkills: BehaviourSkill[],
  classes: SchoolClass[]
): BehaviourSummary {
  const events = pointEvents
    .filter((e) => e.studentId === studentId && isDateInTerm(e.date, term))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  const skillById = new Map(behaviourSkills.map((s) => [s.id, s]));
  const skillMap = new Map<string, SkillPointsRollup>();

  let positivePoints = 0;
  let negativePoints = 0;

  for (const event of events) {
    if (event.points > 0) positivePoints += event.points;
    else negativePoints += event.points;

    const skill = skillById.get(event.skillId);
    const existing = skillMap.get(event.skillId);
    if (existing) {
      existing.totalPoints += event.points;
      existing.eventCount += 1;
    } else {
      skillMap.set(event.skillId, {
        skillId: event.skillId,
        name: skill?.name ?? "Unknown skill",
        emoji: skill?.emoji,
        type: skill?.type ?? "positive",
        totalPoints: event.points,
        eventCount: 1,
      });
    }
  }

  const classMap = new Map<
    string,
    { totalPoints: number; positivePoints: number; negativePoints: number; eventCount: number }
  >();
  for (const event of events) {
    const row = classMap.get(event.classId) ?? {
      totalPoints: 0,
      positivePoints: 0,
      negativePoints: 0,
      eventCount: 0,
    };
    row.totalPoints += event.points;
    if (event.points > 0) row.positivePoints += event.points;
    else row.negativePoints += event.points;
    row.eventCount += 1;
    classMap.set(event.classId, row);
  }

  const byClass = [...classMap.entries()]
    .map(([classId, row]) => ({
      classId,
      className: classes.find((c) => c.id === classId)?.name ?? "Unknown class",
      ...row,
    }))
    .sort((a, b) => a.className.localeCompare(b.className));

  const bySkill = [...skillMap.values()].sort(
    (a, b) => Math.abs(b.totalPoints) - Math.abs(a.totalPoints) || a.name.localeCompare(b.name)
  );

  return {
    totalPoints: positivePoints + negativePoints,
    positivePoints,
    negativePoints,
    eventCount: events.length,
    bySkill,
    byClass,
    events,
  };
}

export function countStudentPointsInTerm(
  studentId: string,
  term: AcademicTerm,
  pointEvents: PointEvent[]
): number {
  return pointEvents.filter(
    (e) => e.studentId === studentId && isDateInTerm(e.date, term)
  ).length;
}

export function countStudentPointsOutsideTerm(
  studentId: string,
  term: AcademicTerm,
  pointEvents: PointEvent[]
): number {
  return pointEvents.filter(
    (e) => e.studentId === studentId && !isDateInTerm(e.date, term)
  ).length;
}

export function behaviourReportSummary(b: BehaviourSummary): string {
  if (b.eventCount === 0) return "";

  const net =
    b.totalPoints > 0 ? `+${b.totalPoints}` : String(b.totalPoints);
  const classCount = b.byClass.length;
  const classPhrase =
    classCount === 1
      ? b.byClass[0]?.className ?? "class"
      : `${classCount} classes`;

  const topPositive = b.bySkill
    .filter((s) => s.totalPoints > 0)
    .slice(0, 3)
    .map((s) => s.name.toLowerCase());
  const topNegative = b.bySkill
    .filter((s) => s.totalPoints < 0)
    .slice(0, 2)
    .map((s) => s.name.toLowerCase());

  let text = `Net ${net} this term from ${b.eventCount} recognition${b.eventCount !== 1 ? "s" : ""} across ${classPhrase}.`;

  if (topPositive.length > 0) {
    text += ` Positive: ${topPositive.join(", ")}.`;
  }
  if (topNegative.length > 0) {
    text += ` Negative: ${topNegative.join(", ")}.`;
  }

  return text;
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
};
