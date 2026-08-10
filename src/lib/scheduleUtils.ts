import type {
  ClassScheduleEvent,
  ClassSessionException,
  DayOfWeek,
  SchoolClass,
  Subject,
} from "@/types";
import { activeClasses } from "@/lib/archiveUtils";
import { getLocalToday, toLocalDateString } from "@/lib/utils";

const JS_DAY_TO_WEEKDAY: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function scheduledDaysOfWeek(schedule: { dayOfWeek: DayOfWeek }[]): DayOfWeek[] {
  return [...new Set(schedule.map((entry) => entry.dayOfWeek))];
}

export function isDateOnScheduledWeekday(scheduledDays: DayOfWeek[], date: Date): boolean {
  if (scheduledDays.length === 0) return false;
  return scheduledDays.includes(JS_DAY_TO_WEEKDAY[date.getDay()]);
}

export function dayOfWeekFromDate(dateStr: string): DayOfWeek {
  const d = new Date(`${dateStr}T12:00:00`);
  return JS_DAY_TO_WEEKDAY[d.getDay()];
}

function parseIso(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function startOfWeekSunday(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function weeksBetween(start: Date, end: Date): number {
  const a = startOfWeekSunday(start).getTime();
  const b = startOfWeekSunday(end).getTime();
  return Math.round((b - a) / (7 * 24 * 60 * 60 * 1000));
}

export interface ScheduleOccurrence {
  eventId: string;
  classId: string;
  /** Actual calendar date for this session (after reschedule). */
  date: string;
  /** Original date in the recurrence series. */
  occurrenceDate: string;
  startTime: string;
  endTime: string;
  title?: string;
  cancelled: boolean;
}

export interface TodaysLesson {
  classId: string;
  className: string;
  subjectName: string;
  classroomNumber?: string;
  eventId: string;
  occurrenceDate: string;
  startTime: string;
  endTime: string;
  title?: string;
  studentCount: number;
  date: string;
}

function exceptionKey(eventId: string, originalDate: string): string {
  return `${eventId}:${originalDate}`;
}

function buildExceptionMap(exceptions: ClassSessionException[]): Map<string, ClassSessionException> {
  const map = new Map<string, ClassSessionException>();
  for (const ex of exceptions) {
    map.set(exceptionKey(ex.eventId, ex.originalDate), ex);
  }
  return map;
}

function pushOccurrence(
  event: ClassScheduleEvent,
  occurrenceDate: string,
  exMap: Map<string, ClassSessionException>,
  out: ScheduleOccurrence[]
): void {
  const ex = exMap.get(exceptionKey(event.id, occurrenceDate));
  if (ex?.type === "cancelled") return;

  if (ex?.type === "rescheduled" && ex.newDate) {
    out.push({
      eventId: event.id,
      classId: event.classId,
      date: ex.newDate,
      occurrenceDate,
      startTime: ex.newStartTime ?? event.startTime,
      endTime: ex.newEndTime ?? event.endTime,
      title: event.title,
      cancelled: false,
    });
    return;
  }

  out.push({
    eventId: event.id,
    classId: event.classId,
    date: occurrenceDate,
    occurrenceDate,
    startTime: ex?.newStartTime ?? event.startTime,
    endTime: ex?.newEndTime ?? event.endTime,
    title: event.title,
    cancelled: false,
  });
}

function seriesEndDate(event: ClassScheduleEvent, rangeEnd: string): string {
  const { recurrence } = event;
  if (recurrence.endType === "on_date" && recurrence.endDate) {
    return recurrence.endDate < rangeEnd ? recurrence.endDate : rangeEnd;
  }
  return rangeEnd;
}

function withinSeriesStart(event: ClassScheduleEvent, dateStr: string): boolean {
  return dateStr >= event.startDate;
}

export function expandEventOccurrences(
  event: ClassScheduleEvent,
  rangeStart: string,
  rangeEnd: string,
  exceptions: ClassSessionException[]
): ScheduleOccurrence[] {
  if (event.cancelled) return [];

  const effectiveEnd = seriesEndDate(event, rangeEnd);
  if (effectiveEnd < rangeStart || event.startDate > effectiveEnd) return [];

  const exMap = buildExceptionMap(exceptions.filter((e) => e.eventId === event.id));
  const out: ScheduleOccurrence[] = [];
  const { recurrence } = event;
  const maxCount =
    recurrence.endType === "after_count" ? (recurrence.occurrenceCount ?? 1) : Number.POSITIVE_INFINITY;

  let count = 0;

  if (recurrence.frequency === "none") {
    if (
      event.startDate >= rangeStart &&
      event.startDate <= effectiveEnd &&
      withinSeriesStart(event, event.startDate)
    ) {
      pushOccurrence(event, event.startDate, exMap, out);
    }
    return out;
  }

  const rangeEndDate = parseIso(effectiveEnd);
  let cursor = parseIso(event.startDate);

  if (recurrence.frequency === "daily") {
    while (cursor <= rangeEndDate && count < maxCount) {
      const dateStr = toLocalDateString(cursor);
      const daysSinceStart = Math.floor(
        (cursor.getTime() - parseIso(event.startDate).getTime()) / (24 * 60 * 60 * 1000)
      );
      if (
        daysSinceStart >= 0 &&
        daysSinceStart % recurrence.interval === 0 &&
        dateStr >= rangeStart &&
        dateStr <= effectiveEnd
      ) {
        pushOccurrence(event, dateStr, exMap, out);
        count += 1;
      }
      cursor = addDays(cursor, 1);
    }
    return out;
  }

  if (recurrence.frequency === "weekly") {
    const days = recurrence.daysOfWeek?.length
      ? recurrence.daysOfWeek
      : [dayOfWeekFromDate(event.startDate)];

    while (cursor <= rangeEndDate && count < maxCount) {
      const dateStr = toLocalDateString(cursor);
      const dow = JS_DAY_TO_WEEKDAY[cursor.getDay()];
      if (
        days.includes(dow) &&
        withinSeriesStart(event, dateStr) &&
        dateStr >= rangeStart &&
        dateStr <= effectiveEnd &&
        weeksBetween(parseIso(event.startDate), cursor) % recurrence.interval === 0
      ) {
        pushOccurrence(event, dateStr, exMap, out);
        count += 1;
      }
      cursor = addDays(cursor, 1);
    }
    return out;
  }

  if (recurrence.frequency === "monthly") {
    let monthCursor = parseIso(event.startDate);
    while (monthCursor <= rangeEndDate && count < maxCount) {
      const dateStr = toLocalDateString(monthCursor);
      if (dateStr >= rangeStart && dateStr <= effectiveEnd && withinSeriesStart(event, dateStr)) {
        pushOccurrence(event, dateStr, exMap, out);
        count += 1;
      }
      monthCursor = addMonths(monthCursor, recurrence.interval);
    }
  }

  return out;
}

export function expandScheduleOccurrences(
  events: ClassScheduleEvent[],
  exceptions: ClassSessionException[],
  rangeStart: string,
  rangeEnd: string,
  classId?: string
): ScheduleOccurrence[] {
  const filtered = classId ? events.filter((e) => e.classId === classId && !e.cancelled) : events.filter((e) => !e.cancelled);
  const all = filtered.flatMap((event) =>
    expandEventOccurrences(event, rangeStart, rangeEnd, exceptions)
  );
  return all.sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
  );
}

export function getOccurrencesOnDate(
  classId: string,
  date: string,
  events: ClassScheduleEvent[],
  exceptions: ClassSessionException[]
): ScheduleOccurrence[] {
  return expandScheduleOccurrences(events, exceptions, date, date, classId);
}

export function getScheduledDatesInRange(
  classId: string,
  events: ClassScheduleEvent[],
  exceptions: ClassSessionException[],
  rangeStart: string,
  rangeEnd: string
): string[] {
  const dates = new Set(
    expandScheduleOccurrences(events, exceptions, rangeStart, rangeEnd, classId).map((o) => o.date)
  );
  return [...dates].sort();
}

export function hasScheduledSessionOnDate(
  classId: string,
  date: string,
  events: ClassScheduleEvent[],
  exceptions: ClassSessionException[]
): boolean {
  return getOccurrencesOnDate(classId, date, events, exceptions).length > 0;
}

export function getTodaysLessons(
  classes: SchoolClass[],
  events: ClassScheduleEvent[],
  exceptions: ClassSessionException[],
  subjects: Subject[],
  dateStr = getLocalToday()
): TodaysLesson[] {
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const lessons: TodaysLesson[] = [];

  for (const cls of activeClasses(classes)) {
    const occurrences = getOccurrencesOnDate(cls.id, dateStr, events, exceptions);
    for (const occ of occurrences) {
      lessons.push({
        classId: cls.id,
        className: cls.name,
        subjectName: subjectById.get(cls.subjectId)?.name ?? "Subject",
        classroomNumber: cls.classroomNumber,
        eventId: occ.eventId,
        occurrenceDate: occ.occurrenceDate,
        startTime: occ.startTime,
        endTime: occ.endTime,
        title: occ.title,
        studentCount: cls.studentIds.length,
        date: dateStr,
      });
    }
  }

  return lessons.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function getUpcomingOccurrences(
  classId: string,
  events: ClassScheduleEvent[],
  exceptions: ClassSessionException[],
  fromDate: string,
  limit = 8,
  horizonDays = 90
): ScheduleOccurrence[] {
  return getAllUpcomingOccurrences(classId, events, exceptions, fromDate, horizonDays).slice(
    0,
    limit
  );
}

/** All future session occurrences within a date horizon (default: rest of school year). */
export function getAllUpcomingOccurrences(
  classId: string,
  events: ClassScheduleEvent[],
  exceptions: ClassSessionException[],
  fromDate: string,
  horizonDays = 365
): ScheduleOccurrence[] {
  const end = toLocalDateString(addDays(parseIso(fromDate), horizonDays));
  return expandScheduleOccurrences(events, exceptions, fromDate, end, classId);
}

export function formatSessionDateLine(dateStr: string, todayStr = getLocalToday()): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const formatted = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const tomorrow = toLocalDateString(addDays(parseIso(todayStr), 1));
  if (dateStr === todayStr) return `Today · ${formatted}`;
  if (dateStr === tomorrow) return `Tomorrow · ${formatted}`;
  return formatted;
}

export function getNextOccurrenceForClass(
  classId: string,
  events: ClassScheduleEvent[],
  exceptions: ClassSessionException[],
  fromDate = getLocalToday()
): ScheduleOccurrence | undefined {
  return getUpcomingOccurrences(classId, events, exceptions, fromDate, 1)[0];
}

export function formatRecurrenceLabel(event: ClassScheduleEvent): string {
  const { recurrence } = event;
  if (recurrence.frequency === "none") return "One-time";
  if (recurrence.frequency === "daily") {
    const every = recurrence.interval === 1 ? "Daily" : `Every ${recurrence.interval} days`;
    return every;
  }
  if (recurrence.frequency === "weekly") {
    const days = (recurrence.daysOfWeek ?? []).map((d) => d.slice(0, 3)).join(", ");
    const every =
      recurrence.interval === 1 ? `Weekly on ${days}` : `Every ${recurrence.interval} weeks on ${days}`;
    return every;
  }
  const every =
    recurrence.interval === 1 ? "Monthly" : `Every ${recurrence.interval} months`;
  return every;
}

export function formatOccurrenceTime(startTime: string, endTime: string): string {
  return `${startTime}–${endTime}`;
}

export function occurrenceLabel(dateStr: string, todayStr = getLocalToday()): string {
  const tomorrow = toLocalDateString(addDays(parseIso(todayStr), 1));
  if (dateStr === todayStr) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  return dayOfWeekFromDate(dateStr);
}

/** Link to the class session workspace for a specific meeting. */
export function classSessionHref(
  classId: string,
  date: string,
  eventId?: string,
  occurrenceDate?: string
): string {
  const params = new URLSearchParams({ date });
  if (eventId) {
    params.set("eventId", eventId);
    params.set("occurrence", occurrenceDate ?? date);
  }
  return `/classes/${classId}?${params.toString()}`;
}

/** Expand occurrences into FullCalendar-friendly event inputs for a date window. */
export function calendarEventsForRange(
  classes: SchoolClass[],
  events: ClassScheduleEvent[],
  exceptions: ClassSessionException[],
  rangeStart: string,
  rangeEnd: string
): Array<{
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: Record<string, string>;
}> {
  const classById = new Map(classes.map((c) => [c.id, c]));
  const occurrences = expandScheduleOccurrences(events, exceptions, rangeStart, rangeEnd);

  return occurrences.map((occ) => {
    const cls = classById.get(occ.classId);
    return {
      id: `${occ.eventId}:${occ.occurrenceDate}`,
      title: occ.title?.trim() || cls?.name || "Class",
      start: `${occ.date}T${occ.startTime}`,
      end: `${occ.date}T${occ.endTime}`,
      extendedProps: {
        classId: occ.classId,
        eventId: occ.eventId,
        occurrenceDate: occ.occurrenceDate,
        classroomNumber: cls?.classroomNumber ?? "",
      },
    };
  });
}
