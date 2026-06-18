import { effectivePercent, letterForPercent, sortLetterGrades, DEFAULT_LETTER_GRADES } from "@/lib/taskScoringUtils";
import type {
  AcademicTerm,
  ClassTask,
  LetterGradeBand,
  SchoolClass,
  SchoolGradingSettings,
  StudentTaskRecord,
  TaskAssessmentCategory,
  TermGrade,
} from "@/types";

export const DEFAULT_SCHOOL_GRADING_SETTINGS_ID = "grading-default";

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

export function getTermLetterBands(settings: SchoolGradingSettings[]): LetterGradeBand[] {
  const row =
    settings.find((s) => s.id === DEFAULT_SCHOOL_GRADING_SETTINGS_ID) ?? settings[0];
  const bands = row?.termLetterBands;
  return bands?.length ? sortLetterGrades(bands) : DEFAULT_LETTER_GRADES;
}

/** Percent counted toward term grades — missing and unscored summative tasks count as 0%. */
export function summativeTaskPercent(
  task: ClassTask,
  record: StudentTaskRecord | undefined
): number {
  if (record?.status === "missing") return 0;
  if (record) {
    const pct = effectivePercent(task, record);
    if (pct != null) return pct;
  }
  return 0;
}

export interface TermGradeTaskBreakdown {
  taskId: string;
  title: string;
  percent: number;
  status: StudentTaskRecord["status"] | "unassigned";
  included: boolean;
}

export interface TermGradeCategoryBreakdown {
  categoryId: string;
  categoryName: string;
  weightPercent: number;
  averagePercent: number | null;
  taskCount: number;
  tasks: TermGradeTaskBreakdown[];
}

export interface TermGradeBreakdown {
  categories: TermGradeCategoryBreakdown[];
  calculatedPercent: number | null;
}

function summativeTasksForTerm(
  cls: SchoolClass,
  termId: string,
  tasks: ClassTask[],
  categories: TaskAssessmentCategory[]
): ClassTask[] {
  const cats = categoriesForSubject(categories, cls.subjectId);
  const catById = new Map(cats.map((c) => [c.id, c]));

  return tasks.filter(
    (t) =>
      t.classId === cls.id &&
      t.termId === termId &&
      isSummativeTask(t) &&
      !t.archived &&
      t.categoryId &&
      catById.has(t.categoryId)
  );
}

export function computeTermGradeBreakdown(
  studentId: string,
  cls: SchoolClass,
  termId: string,
  tasks: ClassTask[],
  records: StudentTaskRecord[],
  categories: TaskAssessmentCategory[]
): TermGradeBreakdown {
  const cats = categoriesForSubject(categories, cls.subjectId);
  const summativeTasks = summativeTasksForTerm(cls, termId, tasks, categories);

  const tasksByCategory = new Map<string, ClassTask[]>();
  for (const task of summativeTasks) {
    const catId = task.categoryId!;
    const list = tasksByCategory.get(catId) ?? [];
    list.push(task);
    tasksByCategory.set(catId, list);
  }

  const categoryBreakdowns: TermGradeCategoryBreakdown[] = [];

  for (const cat of cats) {
    const tasksInCat = tasksByCategory.get(cat.id);
    if (!tasksInCat?.length) continue;

    const taskRows: TermGradeTaskBreakdown[] = tasksInCat.map((task) => {
      const rec = records.find((r) => r.taskId === task.id && r.studentId === studentId);
      return {
        taskId: task.id,
        title: task.title,
        percent: summativeTaskPercent(task, rec),
        status: rec?.status ?? "unassigned",
        included: true,
      };
    });

    const avg =
      taskRows.length > 0
        ? taskRows.reduce((s, t) => s + t.percent, 0) / taskRows.length
        : null;

    categoryBreakdowns.push({
      categoryId: cat.id,
      categoryName: cat.name,
      weightPercent: cat.weightPercent,
      averagePercent: avg != null ? Math.round(avg * 10) / 10 : null,
      taskCount: taskRows.length,
      tasks: taskRows,
    });
  }

  return {
    categories: categoryBreakdowns,
    calculatedPercent: computeCalculatedTermPercent(
      studentId,
      cls,
      termId,
      tasks,
      records,
      categories
    ),
  };
}

/** Weighted % from summative tasks; missing/unscored tasks count as 0%. */
export function computeCalculatedTermPercent(
  studentId: string,
  cls: SchoolClass,
  termId: string,
  tasks: ClassTask[],
  records: StudentTaskRecord[],
  categories: TaskAssessmentCategory[]
): number | null {
  const cats = categoriesForSubject(categories, cls.subjectId);
  const summativeTasks = summativeTasksForTerm(cls, termId, tasks, categories);

  if (summativeTasks.length === 0) return null;

  const tasksByCategory = new Map<string, ClassTask[]>();
  for (const task of summativeTasks) {
    const catId = task.categoryId!;
    const list = tasksByCategory.get(catId) ?? [];
    list.push(task);
    tasksByCategory.set(catId, list);
  }

  let weightedSum = 0;
  let weightUsed = 0;

  for (const cat of cats) {
    const tasksInCat = tasksByCategory.get(cat.id);
    if (!tasksInCat?.length) continue;

    const percents = tasksInCat.map((task) => {
      const rec = records.find((r) => r.taskId === task.id && r.studentId === studentId);
      return summativeTaskPercent(task, rec);
    });
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
  existing: TermGrade[],
  termLetterBands: LetterGradeBand[]
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
    const calculatedLetter =
      calculatedPercent != null
        ? letterForPercent(calculatedPercent, termLetterBands)
        : null;

    out.push({
      id: prev?.id ?? key,
      studentId,
      classId: cls.id,
      termId,
      calculatedPercent,
      calculatedLetter,
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

export function effectiveTermLetter(grade: TermGrade): string | null {
  return grade.submittedLetter ?? grade.calculatedLetter ?? null;
}

export function letterForTermPercent(
  percent: number,
  bands: LetterGradeBand[]
): string | null {
  return letterForPercent(percent, bands);
}
