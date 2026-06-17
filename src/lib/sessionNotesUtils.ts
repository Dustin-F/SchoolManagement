import type { ClassSessionNote } from "@/types";

export function sessionKey(
  classId: string,
  date: string,
  eventId?: string,
  occurrenceDate?: string
): string {
  if (eventId) return `${classId}:${eventId}:${occurrenceDate ?? date}`;
  return `${classId}:${date}`;
}

export function findSessionNote(
  notes: ClassSessionNote[],
  classId: string,
  date: string,
  eventId?: string,
  occurrenceDate?: string
): ClassSessionNote | undefined {
  if (eventId) {
    const occ = occurrenceDate ?? date;
    const exact = notes.find(
      (n) =>
        n.classId === classId &&
        n.eventId === eventId &&
        (n.occurrenceDate ?? n.date) === occ
    );
    if (exact) return exact;
  }
  return notes.find((n) => n.classId === classId && n.date === date && !n.eventId);
}

export function sessionNoteHasContent(note: ClassSessionNote | undefined): boolean {
  if (!note) return false;
  return Boolean(note.title?.trim() || note.content.trim());
}
