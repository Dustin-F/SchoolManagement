import { nanoid } from "nanoid";
import type {
  ClassScheduleEvent,
  ClassSessionException,
  RecurrenceRule,
  ScheduleEditScope,
} from "@/types";

function addDaysIso(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function dayBefore(dateStr: string): string {
  return addDaysIso(dateStr, -1);
}

export interface ScheduleEventInput {
  title?: string;
  startDate: string;
  startTime: string;
  endTime: string;
  recurrence: RecurrenceRule;
}

function cloneRecurrence(rule: RecurrenceRule): RecurrenceRule {
  return {
    ...rule,
    daysOfWeek: rule.daysOfWeek ? [...rule.daysOfWeek] : undefined,
  };
}

/** Apply edit/delete with Outlook-style scope. Returns updated events + exceptions. */
export function applyScheduleEdit(
  events: ClassScheduleEvent[],
  exceptions: ClassSessionException[],
  eventId: string,
  scope: ScheduleEditScope,
  occurrenceDate: string | undefined,
  input: ScheduleEventInput | null,
  ts: string,
  classId: string
): { events: ClassScheduleEvent[]; exceptions: ClassSessionException[] } {
  const target = events.find((e) => e.id === eventId);
  if (!target) return { events, exceptions };

  const isRecurring = target.recurrence.frequency !== "none";

  if (!input) {
    return applyDelete(events, exceptions, target, scope, occurrenceDate, ts, isRecurring);
  }

  if (!isRecurring || scope === "series") {
    const updated = events.map((e) =>
      e.id === eventId
        ? {
            ...e,
            ...input,
            recurrence: cloneRecurrence(input.recurrence),
            updatedAt: ts,
          }
        : e
    );
    const cleanedExceptions =
      scope === "series"
        ? exceptions.filter((ex) => ex.eventId !== eventId)
        : exceptions;
    return { events: updated, exceptions: cleanedExceptions };
  }

  if (!occurrenceDate) {
    return { events, exceptions };
  }

  if (scope === "occurrence") {
    const ex: ClassSessionException = {
      id: nanoid(),
      classId,
      eventId,
      originalDate: occurrenceDate,
      type: "modified",
      newStartTime: input.startTime,
      newEndTime: input.endTime,
      createdAt: ts,
      updatedAt: ts,
    };
    if (input.startDate !== occurrenceDate) {
      ex.type = "rescheduled";
      ex.newDate = input.startDate;
    }
    const without = exceptions.filter(
      (e) => !(e.eventId === eventId && e.originalDate === occurrenceDate)
    );
    return { events, exceptions: [...without, ex] };
  }

  // scope === "future" — split series
  const prevEnd = dayBefore(occurrenceDate);
  const trimmed: ClassScheduleEvent = {
    ...target,
    recurrence: {
      ...cloneRecurrence(target.recurrence),
      endType: "on_date",
      endDate: prevEnd >= target.startDate ? prevEnd : target.startDate,
    },
    updatedAt: ts,
  };

  const futureEvent: ClassScheduleEvent = {
    ...target,
    id: nanoid(),
    title: input.title,
    startDate: occurrenceDate,
    startTime: input.startTime,
    endTime: input.endTime,
    recurrence: cloneRecurrence(input.recurrence),
    createdAt: ts,
    updatedAt: ts,
  };

  const withoutFutureExceptions = exceptions.filter(
    (ex) =>
      !(
        ex.eventId === eventId &&
        ex.originalDate >= occurrenceDate
      )
  );

  return {
    events: events
      .map((e) => (e.id === eventId ? trimmed : e))
      .concat(futureEvent),
    exceptions: withoutFutureExceptions,
  };
}

function applyDelete(
  events: ClassScheduleEvent[],
  exceptions: ClassSessionException[],
  target: ClassScheduleEvent,
  scope: ScheduleEditScope,
  occurrenceDate: string | undefined,
  ts: string,
  isRecurring: boolean
): { events: ClassScheduleEvent[]; exceptions: ClassSessionException[] } {
  if (!isRecurring || scope === "series") {
    return {
      events: events.filter((e) => e.id !== target.id),
      exceptions: exceptions.filter((ex) => ex.eventId !== target.id),
    };
  }

  if (!occurrenceDate) return { events, exceptions };

  if (scope === "occurrence") {
    const ex: ClassSessionException = {
      id: nanoid(),
      classId: target.classId,
      eventId: target.id,
      originalDate: occurrenceDate,
      type: "cancelled",
      createdAt: ts,
      updatedAt: ts,
    };
    const without = exceptions.filter(
      (e) => !(e.eventId === target.id && e.originalDate === occurrenceDate)
    );
    return { events, exceptions: [...without, ex] };
  }

  // future — end series before occurrence
  const prevEnd = dayBefore(occurrenceDate);
  const trimmed: ClassScheduleEvent = {
    ...target,
    recurrence: {
      ...cloneRecurrence(target.recurrence),
      endType: "on_date",
      endDate: prevEnd >= target.startDate ? prevEnd : target.startDate,
    },
    updatedAt: ts,
  };
  const withoutFutureExceptions = exceptions.filter(
    (ex) => !(ex.eventId === target.id && ex.originalDate >= occurrenceDate)
  );
  return {
    events: events.map((e) => (e.id === target.id ? trimmed : e)),
    exceptions: withoutFutureExceptions,
  };
}

export function cancelOccurrence(
  exceptions: ClassSessionException[],
  classId: string,
  eventId: string,
  occurrenceDate: string,
  ts: string
): ClassSessionException[] {
  const without = exceptions.filter(
    (e) => !(e.eventId === eventId && e.originalDate === occurrenceDate)
  );
  return [
    ...without,
    {
      id: nanoid(),
      classId,
      eventId,
      originalDate: occurrenceDate,
      type: "cancelled",
      createdAt: ts,
      updatedAt: ts,
    },
  ];
}