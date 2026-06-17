import { getDefaultTermId } from "@/lib/assessmentUtils";
import { buildTermGradeRows, mergeTermGrades } from "@/lib/termGradeUtils";
import { normalizeClassTask } from "@/lib/taskScoringUtils";
import type {
  AcademicTerm,
  ClassTask,
  SchoolClass,
  StudentTaskRecord,
  TaskAssessmentCategory,
  TermGrade,
} from "@/types";

export function normalizeClassTasks(
  tasks: ClassTask[],
  defaultTermId?: string
): ClassTask[] {
  return tasks.map((t) => ({
    ...normalizeClassTask(t),
    assessmentRole: t.assessmentRole ?? "summative",
    termId: t.termId ?? defaultTermId,
  }));
}

export function recalcTermGradesForClassTerm(
  cls: SchoolClass,
  termId: string,
  tasks: ClassTask[],
  records: StudentTaskRecord[],
  categories: TaskAssessmentCategory[],
  existing: TermGrade[],
  studentIds?: string[]
): TermGrade[] {
  const rows = buildTermGradeRows(
    cls,
    termId,
    studentIds ?? cls.studentIds,
    tasks,
    records,
    categories,
    existing
  );
  return mergeTermGrades(existing, rows);
}

export function recalcAfterTaskRecordChange(
  record: StudentTaskRecord,
  task: ClassTask | undefined,
  state: {
    classes: SchoolClass[];
    classTasks: ClassTask[];
    studentTaskRecords: StudentTaskRecord[];
    taskAssessmentCategories: TaskAssessmentCategory[];
    termGrades: TermGrade[];
  }
): TermGrade[] {
  if (!task?.termId || task.assessmentRole === "formative") return state.termGrades;
  const cls = state.classes.find((c) => c.id === task.classId);
  if (!cls) return state.termGrades;
  return recalcTermGradesForClassTerm(
    cls,
    task.termId,
    state.classTasks,
    state.studentTaskRecords,
    state.taskAssessmentCategories,
    state.termGrades,
    [record.studentId]
  );
}

export function recalcAfterTaskMetaChange(
  task: ClassTask,
  state: {
    classes: SchoolClass[];
    classTasks: ClassTask[];
    studentTaskRecords: StudentTaskRecord[];
    taskAssessmentCategories: TaskAssessmentCategory[];
    termGrades: TermGrade[];
  }
): TermGrade[] {
  if (!task.termId) return state.termGrades;
  const cls = state.classes.find((c) => c.id === task.classId);
  if (!cls) return state.termGrades;
  return recalcTermGradesForClassTerm(
    cls,
    task.termId,
    state.classTasks,
    state.studentTaskRecords,
    state.taskAssessmentCategories,
    state.termGrades
  );
}

export function initialNormalizedTasks(
  tasks: ClassTask[],
  terms: AcademicTerm[]
): ClassTask[] {
  return normalizeClassTasks(tasks, getDefaultTermId(terms));
}
