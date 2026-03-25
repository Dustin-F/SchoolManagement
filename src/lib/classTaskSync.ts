import { nanoid } from "nanoid";
import type { ClassTask, StudentTaskRecord } from "@/types";

export function taskIdsForClass(classId: string, tasks: ClassTask[]): string[] {
  return tasks.filter((t) => t.classId === classId).map((t) => t.id);
}

/** Tasks shown in the main grid; new roster members only get rows for these. */
export function activeTaskIdsForClass(classId: string, tasks: ClassTask[]): string[] {
  return tasks.filter((t) => t.classId === classId && !t.archived).map((t) => t.id);
}

export function removeRecordsForTask(taskId: string, records: StudentTaskRecord[]): StudentTaskRecord[] {
  return records.filter((r) => r.taskId !== taskId);
}

export function removeRecordsForTaskIds(taskIds: string[], records: StudentTaskRecord[]): StudentTaskRecord[] {
  const set = new Set(taskIds);
  return records.filter((r) => !set.has(r.taskId));
}

export function removeRecordsForStudentInTaskIds(
  studentId: string,
  taskIds: string[],
  records: StudentTaskRecord[]
): StudentTaskRecord[] {
  const set = new Set(taskIds);
  return records.filter((r) => !(r.studentId === studentId && set.has(r.taskId)));
}

export function newRecordsForTask(
  taskId: string,
  studentIds: string[],
  updatedAt: string
): StudentTaskRecord[] {
  return studentIds.map((studentId) => ({
    id: nanoid(),
    taskId,
    studentId,
    status: "not_started" as const,
    score: null,
    submittedAt: null,
    updatedAt,
  }));
}

/** Sync student task rows when a class roster changes (add/remove any students). */
export function syncRecordsAfterRosterChange(
  classId: string,
  prevStudentIds: string[],
  nextStudentIds: string[],
  classTasks: ClassTask[],
  records: StudentTaskRecord[],
  updatedAt: string
): StudentTaskRecord[] {
  const allTids = taskIdsForClass(classId, classTasks);
  const activeTids = activeTaskIdsForClass(classId, classTasks);
  const prev = new Set(prevStudentIds);
  const next = new Set(nextStudentIds);
  let out = records;

  for (const sid of prevStudentIds) {
    if (!next.has(sid)) {
      out = removeRecordsForStudentInTaskIds(sid, allTids, out);
    }
  }

  for (const sid of nextStudentIds) {
    if (!prev.has(sid)) {
      for (const tid of activeTids) {
        if (!out.some((r) => r.taskId === tid && r.studentId === sid)) {
          out = [
            ...out,
            {
              id: nanoid(),
              taskId: tid,
              studentId: sid,
              status: "not_started",
              score: null,
              submittedAt: null,
              updatedAt,
            },
          ];
        }
      }
    }
  }

  return out;
}
