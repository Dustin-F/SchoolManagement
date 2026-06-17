import { storage } from "@/lib/storage";
import { migrateLegacyClassSchedules } from "@/lib/scheduleMigration";
import type {
  ClassScheduleEvent,
  ClassSessionException,
  ClassSessionNote,
  SchoolClass,
} from "@/types";
import { seedScheduleEvents, seedSessionExceptions } from "@/data/seedSchedule";

export interface ScheduleBootstrap {
  classes: SchoolClass[];
  classScheduleEvents: ClassScheduleEvent[];
  classSessionExceptions: ClassSessionException[];
  classSessionNotes: ClassSessionNote[];
}

export function bootstrapScheduleState(
  rawClasses: SchoolClass[],
  rawNotes: ClassSessionNote[],
  ts: string
): ScheduleBootstrap {
  const storedEvents = storage.get<ClassScheduleEvent[]>("classScheduleEvents");
  const storedExceptions = storage.get<ClassSessionException[]>("classSessionExceptions");
  const hasLegacySchedule = rawClasses.some((c) => (c.schedule?.length ?? 0) > 0);

  let events: ClassScheduleEvent[];
  if (hasLegacySchedule) {
    events = migrateLegacyClassSchedules(rawClasses, [], rawNotes, ts).classScheduleEvents;
  } else if (storedEvents !== null && storedEvents.length > 0) {
    events = storedEvents;
  } else {
    events = seedScheduleEvents;
  }

  const exceptions =
    storedExceptions && storedExceptions.length > 0
      ? storedExceptions
      : seedSessionExceptions;
  const migrated = migrateLegacyClassSchedules(rawClasses, events, rawNotes, ts);

  storage.set("classes", migrated.classes);
  storage.set("classScheduleEvents", migrated.classScheduleEvents);
  storage.set("classSessionNotes", migrated.classSessionNotes);
  storage.set("classSessionExceptions", exceptions);

  return {
    classes: migrated.classes,
    classScheduleEvents: migrated.classScheduleEvents,
    classSessionExceptions: exceptions,
    classSessionNotes: migrated.classSessionNotes,
  };
}
