import type { DayOfWeek, ScheduleEntry, SchoolClass, Subject } from "@/types";
import { getLocalToday } from "@/lib/utils";

const JS_DAY_TO_WEEKDAY: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function dayOfWeekFromDate(dateStr: string): DayOfWeek {
  const d = new Date(`${dateStr}T12:00:00`);
  return JS_DAY_TO_WEEKDAY[d.getDay()];
}

export interface TodaysLesson {
  classId: string;
  className: string;
  subjectName: string;
  classroomNumber?: string;
  entry: ScheduleEntry;
  studentCount: number;
  date: string;
}

export function getTodaysLessons(
  classes: SchoolClass[],
  subjects: Subject[],
  dateStr = getLocalToday()
): TodaysLesson[] {
  const day = dayOfWeekFromDate(dateStr);
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const lessons: TodaysLesson[] = [];

  for (const cls of classes) {
    for (const entry of cls.schedule) {
      if (entry.dayOfWeek !== day) continue;
      lessons.push({
        classId: cls.id,
        className: cls.name,
        subjectName: subjectById.get(cls.subjectId)?.name ?? "Subject",
        classroomNumber: cls.classroomNumber,
        entry,
        studentCount: cls.studentIds.length,
        date: dateStr,
      });
    }
  }

  return lessons.sort((a, b) => a.entry.startTime.localeCompare(b.entry.startTime));
}
