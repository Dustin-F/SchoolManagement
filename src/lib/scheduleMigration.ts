import type {
  ClassScheduleEvent,
  ClassSessionException,
  ClassSessionNote,
  DayOfWeek,
  RecurrenceRule,
  ScheduleEntry,
  SchoolClass,
} from "@/types";
import { dayOfWeekFromDate } from "@/lib/scheduleUtils";
import { getLocalToday, toLocalDateString } from "@/lib/utils";

function nextDateForDayOfWeek(day: DayOfWeek, from = getLocalToday()): string {
  const dayIndex: Record<DayOfWeek, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  const target = dayIndex[day];
  const start = new Date(`${from}T12:00:00`);
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d.getDay() === target) return toLocalDateString(d);
  }
  return from;
}

export function scheduleEntryToEvent(
  classId: string,
  entry: ScheduleEntry,
  ts: string
): ClassScheduleEvent {
  const recurrence: RecurrenceRule = {
    frequency: "weekly",
    interval: 1,
    daysOfWeek: [entry.dayOfWeek],
    endType: "never",
  };
  return {
    id: entry.id,
    classId,
    startDate: nextDateForDayOfWeek(entry.dayOfWeek),
    startTime: entry.startTime,
    endTime: entry.endTime,
    recurrence,
    createdAt: ts,
    updatedAt: ts,
  };
}

export interface ScheduleMigrationResult {
  classes: SchoolClass[];
  classScheduleEvents: ClassScheduleEvent[];
  classSessionNotes: ClassSessionNote[];
}

/** Migrate legacy `class.schedule` slots into schedule events and strip schedule from classes. */
export function migrateLegacyClassSchedules(
  classes: SchoolClass[],
  existingEvents: ClassScheduleEvent[],
  sessionNotes: ClassSessionNote[],
  ts: string
): ScheduleMigrationResult {
  if (existingEvents.length > 0) {
    const stripped = classes.map(({ schedule: _s, ...rest }) => rest as SchoolClass);
    return {
      classes: stripped,
      classScheduleEvents: existingEvents,
      classSessionNotes: migrateSessionNoteIds(sessionNotes),
    };
  }

  const migratedEvents: ClassScheduleEvent[] = [];
  const strippedClasses: SchoolClass[] = [];

  for (const cls of classes) {
    const schedule = cls.schedule ?? [];
    for (const entry of schedule) {
      migratedEvents.push(scheduleEntryToEvent(cls.id, entry, ts));
    }
    const { schedule: _removed, ...rest } = cls;
    strippedClasses.push(rest as SchoolClass);
  }

  return {
    classes: strippedClasses,
    classScheduleEvents: migratedEvents,
    classSessionNotes: migrateSessionNoteIds(sessionNotes),
  };
}

function migrateSessionNoteIds(notes: ClassSessionNote[]): ClassSessionNote[] {
  return notes.map((note) => {
    const legacy = note as ClassSessionNote & {
      scheduleEntryId?: string;
      isExtra?: boolean;
    };
    if (!legacy.scheduleEntryId && !legacy.eventId) return note;
    const { scheduleEntryId, isExtra: _extra, ...rest } = legacy;
    return {
      ...rest,
      eventId: rest.eventId ?? scheduleEntryId,
    };
  });
}

export function defaultRecurrence(): RecurrenceRule {
  return {
    frequency: "none",
    interval: 1,
    endType: "never",
  };
}

export function defaultWeeklyRecurrence(day: DayOfWeek = dayOfWeekFromDate(getLocalToday())): RecurrenceRule {
  return {
    frequency: "weekly",
    interval: 1,
    daysOfWeek: [day],
    endType: "never",
  };
}

export function emptyExceptions(): ClassSessionException[] {
  return [];
}
