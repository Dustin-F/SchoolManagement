import { useMemo } from "react";
import { useAppStore } from "@/store";
import { activeClasses, activeStudents } from "@/lib/archiveUtils";
import {
  getIncompleteTodoItems,
  summarizeIncompleteTodo,
  type IncompleteTodoItem,
  type IncompleteTodoSummary,
} from "@/lib/attentionUtils";
import { getTodaysLessons } from "@/lib/scheduleUtils";
import { getLocalToday } from "@/lib/utils";
import type { Subject } from "@/types";

export function useIncompleteTodoData(): {
  items: IncompleteTodoItem[];
  summary: IncompleteTodoSummary;
  todayStr: string;
  hasLessonsToday: boolean;
  activeClassList: ReturnType<typeof activeClasses>;
} {
  const students = useAppStore((s) => s.students);
  const classes = useAppStore((s) => s.classes);
  const subjects = useAppStore((s) => s.subjects);
  const attendance = useAppStore((s) => s.attendance);
  const pointEvents = useAppStore((s) => s.pointEvents);
  const classTasks = useAppStore((s) => s.classTasks);
  const studentTaskRecords = useAppStore((s) => s.studentTaskRecords);
  const classScheduleEvents = useAppStore((s) => s.classScheduleEvents);
  const classSessionExceptions = useAppStore((s) => s.classSessionExceptions);
  const todayStr = getLocalToday();

  return useMemo(() => {
    const activeClassList = activeClasses(classes);
    const lessons = getTodaysLessons(
      activeClassList,
      classScheduleEvents,
      classSessionExceptions,
      subjects as Subject[],
      todayStr
    );
    const todaysClassIds = new Set(lessons.map((l) => l.classId));
    const items = getIncompleteTodoItems(
      activeClassList,
      activeStudents(students),
      classTasks,
      studentTaskRecords,
      attendance,
      pointEvents,
      todayStr,
      todaysClassIds
    );
    return {
      items,
      summary: summarizeIncompleteTodo(items),
      todayStr,
      hasLessonsToday: lessons.length > 0,
      activeClassList,
    };
  }, [
    students,
    classes,
    subjects,
    attendance,
    pointEvents,
    classTasks,
    studentTaskRecords,
    classScheduleEvents,
    classSessionExceptions,
    todayStr,
  ]);
}
