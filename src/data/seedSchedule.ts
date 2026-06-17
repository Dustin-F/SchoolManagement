import type { ClassScheduleEvent, DayOfWeek } from "@/types";
import { toLocalDateString } from "@/lib/utils";

const SEED_TIME = "2026-05-28T08:00:00.000Z";

function ent<T extends { id: string; createdAt: string; updatedAt: string }>(
  id: string,
  data: Omit<T, "id" | "createdAt" | "updatedAt">
): T {
  return { id, createdAt: SEED_TIME, updatedAt: SEED_TIME, ...data } as T;
}

/** School year window for recurring seed events. */
const SERIES_START = "2025-09-01";
const SERIES_END = "2026-06-30";

function weekly(
  id: string,
  classId: string,
  day: DayOfWeek,
  startTime: string,
  endTime: string
): ClassScheduleEvent {
  return ent<ClassScheduleEvent>(id, {
    classId,
    startDate: SERIES_START,
    startTime,
    endTime,
    recurrence: {
      frequency: "weekly",
      interval: 1,
      daysOfWeek: [day],
      endType: "on_date",
      endDate: SERIES_END,
    },
  });
}

export const seedScheduleEvents: ClassScheduleEvent[] = [
  weekly("sch-9a-m1", "cls-9a-math", "monday", "08:00", "09:00"),
  weekly("sch-9a-m2", "cls-9a-math", "wednesday", "08:00", "09:00"),
  weekly("sch-9a-m3", "cls-9a-math", "friday", "08:00", "09:00"),
  weekly("sch-9b-e1", "cls-9b-eng", "tuesday", "09:30", "10:30"),
  weekly("sch-9b-e2", "cls-9b-eng", "thursday", "09:30", "10:30"),
  weekly("sch-10a-i1", "cls-10a-ielts", "monday", "08:00", "08:40"),
  weekly("sch-10a-i2", "cls-10a-ielts", "wednesday", "10:00", "10:40"),
  weekly("sch-10a-i3", "cls-10a-ielts", "friday", "11:00", "11:40"),
  weekly("sch-10b-i1", "cls-10b-ielts", "monday", "08:00", "08:40"),
  weekly("sch-10b-i2", "cls-10b-ielts", "tuesday", "09:40", "10:20"),
  weekly("sch-10b-i3", "cls-10b-ielts", "thursday", "09:40", "10:20"),
  weekly("sch-10a-s1", "cls-10a-sci", "tuesday", "13:00", "14:00"),
  weekly("sch-10a-s2", "cls-10a-sci", "thursday", "13:00", "14:00"),
  weekly("sch-10a-c1", "cls-10a-chi", "monday", "14:00", "15:00"),
  weekly("sch-10a-c2", "cls-10a-chi", "wednesday", "14:00", "15:00"),
  weekly("sch-11-h1", "cls-11-hist", "friday", "15:00", "16:00"),
  weekly("sch-po-1", "cls-9-pullout", "wednesday", "11:30", "12:00"),
  ent<ClassScheduleEvent>("sch-10a-revision", {
    classId: "cls-10a-ielts",
    title: "IELTS mock speaking",
    startDate: toLocalDateString(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)),
    startTime: "14:00",
    endTime: "15:30",
    recurrence: { frequency: "none", interval: 1, endType: "never" },
  }),
];

export const seedSessionExceptions: import("@/types").ClassSessionException[] = [];
