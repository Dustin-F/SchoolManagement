import { effectivePercent } from "@/lib/taskScoringUtils";
import type {
  AcademicTerm,
  ClassTask,
  SchoolClass,
  StudentTaskRecord,
  TaskAssessmentCategory,
  TermGrade,
} from "@/types";

export function termGradeKey(studentId: string, classId: string, termId: string): string {
  return `${studentId}:${classId}:${termId}`;
}

export function isSummativeTask(task: ClassTask): boolean {
  return (task.assessmentRole ?? "summative") === "summative";
}

export function isFormativeTask(task: ClassTask): boolean {
  return task.assessmentRole === "formative";
}

export function categoriesForSubject(
  categories: TaskAssessmentCategory[],
  subjectId: string
): TaskAssessmentCategory[] {
  const specific = categories.filter((c) => c.subjectId === subjectId);
  if (specific.length > 0) {
    return [...specific].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return [...categories.filter((c) => !c.subjectId)].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function totalCategoryWeight(categories: TaskAssessmentCategory[]): number {
  return categories.reduce((s, c) => s + c.weightPercent, 0);
}

/** Weighted % from summative tasks in a term; renormalizes weights for categories that have scores. */
export function computeCalculatedTermPercent(
  studentId: string,
  cls: SchoolClass,
  termId: string,
  tasks: ClassTask[],
  records: StudentTaskRecord[],
  categories: TaskAssessmentCategory[]
): number | null {
  const cats = categoriesForSubject(categories, cls.subjectId);
  const catById = new Map(cats.map((c) => [c.id, c]));

  const summativeTasks = tasks.filter(
    (t) =>
      t.classId === cls.id &&
      t.termId === termId &&
      isSummativeTask(t) &&
      !t.archived &&
      t.categoryId &&
      catById.has(t.categoryId)
  );

  if (summativeTasks.length === 0) return null;

  const percentsByCategory = new Map<string, number[]>();

  for (const task of summativeTasks) {
    const catId = task.categoryId!;
    const rec = records.find((r) => r.taskId === task.id && r.studentId === studentId);
    if (!rec) continue;
    const pct = effectivePercent(task, rec);
    if (pct == null) continue;
    const list = percentsByCategory.get(catId) ?? [];
    list.push(pct);
    percentsByCategory.set(catId, list);
  }

  let weightedSum = 0;
  let weightUsed = 0;

  for (const [catId, percents] of percentsByCategory) {
    const cat = catById.get(catId);
    if (!cat || percents.length === 0) continue;
    const avg = percents.reduce((a, b) => a + b, 0) / percents.length;
    weightedSum += avg * (cat.weightPercent / 100);
    weightUsed += cat.weightPercent;
  }

  if (weightUsed <= 0) return null;
  return Math.round((weightedSum / (weightUsed / 100)) * 10) / 10;
}

export function buildTermGradeRows(
  cls: SchoolClass,
  termId: string,
  studentIds: string[],
  tasks: ClassTask[],
  records: StudentTaskRecord[],
  categories: TaskAssessmentCategory[],
  existing: TermGrade[]
): TermGrade[] {
  const existingByKey = new Map(
    existing.map((g) => [termGradeKey(g.studentId, g.classId, g.termId), g])
  );
  const now = new Date().toISOString();
  const out: TermGrade[] = [];

  for (const studentId of studentIds) {
    const key = termGradeKey(studentId, cls.id, termId);
    const prev = existingByKey.get(key);
    const calculatedPercent = computeCalculatedTermPercent(
      studentId,
      cls,
      termId,
      tasks,
      records,
      categories
    );

    out.push({
      id: prev?.id ?? key,
      studentId,
      classId: cls.id,
      termId,
      calculatedPercent,
      submittedPercent: prev?.submittedPercent ?? null,
      submittedLetter: prev?.submittedLetter ?? null,
      comment: prev?.comment,
      createdAt: prev?.createdAt ?? now,
      updatedAt: now,
    });
  }

  return out;
}

export function mergeTermGrades(
  existing: TermGrade[],
  updated: TermGrade[]
): TermGrade[] {
  const map = new Map(existing.map((g) => [g.id, g]));
  for (const g of updated) {
    map.set(g.id, g);
  }
  return [...map.values()];
}

/** Year average from submitted marks, falling back to calculated. */
export function computeSchoolYearPercent(
  termGrades: TermGrade[],
  termsInYear: AcademicTerm[],
  studentId: string,
  classId: string
): number | null {
  const termIds = new Set(termsInYear.map((t) => t.id));
  const relevant = termGrades.filter(
    (g) => g.studentId === studentId && g.classId === classId && termIds.has(g.termId)
  );
  const values: number[] = [];
  for (const g of relevant) {
    const v = g.submittedPercent ?? g.calculatedPercent;
    if (v != null && !Number.isNaN(v)) values.push(v);
  }
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

export function effectiveTermPercent(grade: TermGrade): number | null {
  return grade.submittedPercent ?? grade.calculatedPercent;
}
