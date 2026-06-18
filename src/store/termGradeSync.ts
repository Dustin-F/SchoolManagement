import { getDefaultTermId } from "@/lib/assessmentUtils";
import {
  buildTermGradeRows,
  getTermLetterBands,
  mergeTermGrades,
} from "@/lib/termGradeUtils";
import { normalizeClassTask } from "@/lib/taskScoringUtils";
import type {
  AcademicTerm,
  ClassTask,
  SchoolClass,
  SchoolGradingSettings,
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
  schoolGradingSettings: SchoolGradingSettings[],
  studentIds?: string[]
): TermGrade[] {
  const rows = buildTermGradeRows(
    cls,
    termId,
    studentIds ?? cls.studentIds,
    tasks,
    records,
    categories,
    existing,
    getTermLetterBands(schoolGradingSettings)
  );
  return mergeTermGrades(existing, rows);
}

export function recalcAllTermGrades(state: {
  classes: SchoolClass[];
  classTasks: ClassTask[];
  studentTaskRecords: StudentTaskRecord[];
  taskAssessmentCategories: TaskAssessmentCategory[];
  termGrades: TermGrade[];
  schoolGradingSettings: SchoolGradingSettings[];
}): TermGrade[] {
  let termGrades = state.termGrades;

  for (const cls of state.classes) {
    if (cls.archived) continue;
    const termIds = new Set(
      state.classTasks
        .filter((t) => t.classId === cls.id && t.termId)
        .map((t) => t.termId as string)
    );
    for (const termId of termIds) {
      termGrades = recalcTermGradesForClassTerm(
        cls,
        termId,
        state.classTasks,
        state.studentTaskRecords,
        state.taskAssessmentCategories,
        termGrades,
        state.schoolGradingSettings
      );
    }
  }

  return termGrades;
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
    schoolGradingSettings: SchoolGradingSettings[];
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
    state.schoolGradingSettings,
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
    schoolGradingSettings: SchoolGradingSettings[];
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
    state.termGrades,
    state.schoolGradingSettings
  );
}

export function recalcForClassStudent(
  classId: string,
  studentId: string,
  state: {
    classes: SchoolClass[];
    classTasks: ClassTask[];
    studentTaskRecords: StudentTaskRecord[];
    taskAssessmentCategories: TaskAssessmentCategory[];
    termGrades: TermGrade[];
    schoolGradingSettings: SchoolGradingSettings[];
  }
): TermGrade[] {
  const cls = state.classes.find((c) => c.id === classId);
  if (!cls) return state.termGrades;

  const termIds = new Set(
    state.classTasks
      .filter((t) => t.classId === classId && t.termId)
      .map((t) => t.termId as string)
  );

  let termGrades = state.termGrades;
  for (const termId of termIds) {
    termGrades = recalcTermGradesForClassTerm(
      cls,
      termId,
      state.classTasks,
      state.studentTaskRecords,
      state.taskAssessmentCategories,
      termGrades,
      state.schoolGradingSettings,
      [studentId]
    );
  }
  return termGrades;
}

export function initialNormalizedTasks(
  tasks: ClassTask[],
  terms: AcademicTerm[]
): ClassTask[] {
  return normalizeClassTasks(tasks, getDefaultTermId(terms));
}
