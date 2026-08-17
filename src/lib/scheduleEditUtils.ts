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

/** Splitting "this and following" on the first session has nothing to keep — treat as entire series. */
export function resolveScheduleEditScope(
  target: ClassScheduleEvent,
  scope: ScheduleEditScope,
  occurrenceDate?: string
): ScheduleEditScope {
  if (scope !== "future") return scope;
  if (!occurrenceDate) return "series";
  if (dayBefore(occurrenceDate) < target.startDate) return "series";
  return "future";
}

function cloneRecurrence(rule: RecurrenceRule): RecurrenceRule {
  return {
    ...rule,
    daysOfWeek: rule.daysOfWeek ? [...rule.daysOfWeek] : undefined,
  };
}

export interface ScheduleEventInput {
  title?: string;
  startDate: string;
  startTime: string;
  endTime: string;
  recurrence: RecurrenceRule;
}

function applySeriesUpdate(
  events: ClassScheduleEvent[],
  exceptions: ClassSessionException[],
  eventId: string,
  input: ScheduleEventInput,
  ts: string
): { events: ClassScheduleEvent[]; exceptions: ClassSessionException[] } {
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
  return {
    events: updated,
    exceptions: exceptions.filter((ex) => ex.eventId !== eventId),
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
  const resolvedScope = resolveScheduleEditScope(target, scope, occurrenceDate);

  if (!input) {
    return applyDelete(events, exceptions, target, resolvedScope, occurrenceDate, ts, isRecurring);
  }

  if (!isRecurring || resolvedScope === "series") {
    return applySeriesUpdate(events, exceptions, eventId, input, ts);
  }

  if (!occurrenceDate) {
    return { events, exceptions };
  }

  if (resolvedScope === "occurrence") {
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

  // resolvedScope === "future" — split series (old series never includes occurrenceDate)
  const prevEnd = dayBefore(occurrenceDate);
  const trimmed: ClassScheduleEvent = {
    ...target,
    recurrence: {
      ...cloneRecurrence(target.recurrence),
      endType: "on_date",
      endDate: prevEnd,
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
  const resolvedScope = resolveScheduleEditScope(target, scope, occurrenceDate);

  if (!isRecurring || resolvedScope === "series") {
    return {
      events: events.filter((e) => e.id !== target.id),
      exceptions: exceptions.filter((ex) => ex.eventId !== target.id),
    };
  }

  if (!occurrenceDate) return { events, exceptions };

  if (resolvedScope === "occurrence") {
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

  // future — end series before occurrence (guaranteed prevEnd >= startDate by resolve)
  const prevEnd = dayBefore(occurrenceDate);
  const trimmed: ClassScheduleEvent = {
    ...target,
    recurrence: {
      ...cloneRecurrence(target.recurrence),
      endType: "on_date",
      endDate: prevEnd,
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