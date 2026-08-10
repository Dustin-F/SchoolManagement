import { getMissingPolicy, DEFAULT_SCHOOL_GRADING_SETTINGS_ID } from "@/lib/gradingPolicy";
import type {
  AcademicTerm,
  ClassTask,
  LetterGradeBand,
  MissingGradePolicy,
  SchoolClass,
  SchoolGradingSettings,
  StudentTaskRecord,
  TaskAssessmentCategory,
  TermGrade,
  TermGradePostStatus,
} from "@/types";
import {
  effectivePercent,
  letterForPercent,
  sortLetterGrades,
  DEFAULT_LETTER_GRADES,
} from "@/lib/taskScoringUtils";

export { DEFAULT_SCHOOL_GRADING_SETTINGS_ID };

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

/** Migrate legacy submitted* fields and defaults. */
export function normalizeTermGrade(grade: TermGrade): TermGrade {
  const legacy = grade as TermGrade & {
    submittedPercent?: number | null;
    submittedLetter?: string | null;
  };
  const postedPercent = grade.postedPercent ?? legacy.submittedPercent ?? null;
  const postedLetter = grade.postedLetter ?? legacy.submittedLetter ?? null;
  const postStatus: TermGradePostStatus =
    grade.postStatus ?? (postedPercent != null ? "posted" : "draft");

  return {
    ...grade,
    postedPercent,
    postedLetter,
    postStatus,
    postedAt: grade.postedAt ?? (postStatus === "posted" ? grade.updatedAt : null),
  };
}

export interface SummativeTaskScore {
  percent: number | null;
  /** Task blocks a final grade (missing / ungraded under incomplete policy). */
  blocksFinal: boolean;
  /** Included in category average denominator. */
  included: boolean;
  excludedReason?: "excused" | "ungraded";
}

export function summativeTaskScore(
  task: ClassTask,
  record: StudentTaskRecord | undefined,
  policy: MissingGradePolicy
): SummativeTaskScore {
  if (record?.status === "excused") {
    return { percent: null, blocksFinal: false, included: false, excludedReason: "excused" };
  }

  if (record?.status === "missing") {
    if (policy === "count_as_zero") {
      return { percent: 0, blocksFinal: false, included: true };
    }
    if (policy === "incomplete_while_missing") {
      return { percent: null, blocksFinal: true, included: false, excludedReason: "ungraded" };
    }
    return { percent: null, blocksFinal: false, included: false, excludedReason: "ungraded" };
  }

  const pct = record ? effectivePercent(task, record) : null;
  if (pct != null) {
    return { percent: pct, blocksFinal: false, included: true };
  }

  if (policy === "count_as_zero") {
    return { percent: 0, blocksFinal: false, included: true };
  }
  if (policy === "incomplete_while_missing") {
    return { percent: null, blocksFinal: true, included: false, excludedReason: "ungraded" };
  }
  return { percent: null, blocksFinal: false, included: false, excludedReason: "ungraded" };
}

export interface TermGradeTaskBreakdown {
  taskId: string;
  title: string;
  percent: number | null;
  status: StudentTaskRecord["status"] | "unassigned";
  included: boolean;
  note?: string;
}

export interface TermGradeCategoryBreakdown {
  categoryId: string;
  categoryName: string;
  weightPercent: number;
  averagePercent: number | null;
  taskCount: number;
  gradedCount: number;
  tasks: TermGradeTaskBreakdown[];
}

export interface TermGradeBreakdown {
  categories: TermGradeCategoryBreakdown[];
  calculatedPercent: number | null;
  isIncomplete: boolean;
  gradedTaskCount: number;
  summativeTaskCount: number;
}

export interface TermGradeCompletion {
  graded: number;
  total: number;
  missing: number;
  excused: number;
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

export function computeTermGradeCompletion(
  studentId: string,
  cls: SchoolClass,
  termId: string,
  tasks: ClassTask[],
  records: StudentTaskRecord[],
  categories: TaskAssessmentCategory[]
): TermGradeCompletion {
  const summative = summativeTasksForTerm(cls, termId, tasks, categories);
  let graded = 0;
  let missing = 0;
  let excused = 0;

  for (const task of summative) {
    const rec = records.find((r) => r.taskId === task.id && r.studentId === studentId);
    if (rec?.status === "excused") {
      excused += 1;
      continue;
    }
    if (rec?.status === "missing") {
      missing += 1;
      continue;
    }
    if (rec && effectivePercent(task, rec) != null) {
      graded += 1;
    }
  }

  return { graded, total: summative.length, missing, excused };
}

function taskBreakdownNote(score: SummativeTaskScore): string | undefined {
  if (score.excludedReason === "excused") return "Excused";
  if (!score.included && score.blocksFinal) return "Awaiting grade";
  if (!score.included) return "Not counted";
  if (score.percent === 0) return "0%";
  return undefined;
}

/** Weighted running grade from summative tasks. */
export function computeCalculatedTermPercent(
  studentId: string,
  cls: SchoolClass,
  termId: string,
  tasks: ClassTask[],
  records: StudentTaskRecord[],
  categories: TaskAssessmentCategory[],
  policy: MissingGradePolicy = "count_as_zero"
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

  if (policy === "incomplete_while_missing") {
    for (const task of summativeTasks) {
      const rec = records.find((r) => r.taskId === task.id && r.studentId === studentId);
      const score = summativeTaskScore(task, rec, policy);
      if (score.blocksFinal) return null;
    }
  }

  let weightedSum = 0;
  let weightUsed = 0;

  for (const cat of cats) {
    const tasksInCat = tasksByCategory.get(cat.id);
    if (!tasksInCat?.length) continue;

    const includedPercents: number[] = [];
    for (const task of tasksInCat) {
      const rec = records.find((r) => r.taskId === task.id && r.studentId === studentId);
      const score = summativeTaskScore(task, rec, policy);
      if (score.included && score.percent != null) {
        includedPercents.push(score.percent);
      }
    }

    if (includedPercents.length === 0) continue;

    const avg = includedPercents.reduce((a, b) => a + b, 0) / includedPercents.length;
    weightedSum += avg * (cat.weightPercent / 100);
    weightUsed += cat.weightPercent;
  }

  if (weightUsed <= 0) return null;
  return Math.round((weightedSum / (weightUsed / 100)) * 10) / 10;
}

export function computeTermGradeBreakdown(
  studentId: string,
  cls: SchoolClass,
  termId: string,
  tasks: ClassTask[],
  records: StudentTaskRecord[],
  categories: TaskAssessmentCategory[],
  schoolGradingSettings: SchoolGradingSettings[]
): TermGradeBreakdown {
  const policy = getMissingPolicy(schoolGradingSettings);
  const cats = categoriesForSubject(categories, cls.subjectId);
  const summativeTasks = summativeTasksForTerm(cls, termId, tasks, categories);
  const completion = computeTermGradeCompletion(
    studentId,
    cls,
    termId,
    tasks,
    records,
    categories
  );

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
      const score = summativeTaskScore(task, rec, policy);
      return {
        taskId: task.id,
        title: task.title,
        percent: score.percent,
        status: rec?.status ?? "unassigned",
        included: score.included,
        note: taskBreakdownNote(score),
      };
    });

    const included = taskRows.filter((t) => t.included && t.percent != null);
    const avg =
      included.length > 0
        ? included.reduce((s, t) => s + (t.percent ?? 0), 0) / included.length
        : null;

    categoryBreakdowns.push({
      categoryId: cat.id,
      categoryName: cat.name,
      weightPercent: cat.weightPercent,
      averagePercent: avg != null ? Math.round(avg * 10) / 10 : null,
      taskCount: taskRows.length,
      gradedCount: included.length,
      tasks: taskRows,
    });
  }

  const calculatedPercent = computeCalculatedTermPercent(
    studentId,
    cls,
    termId,
    tasks,
    records,
    categories,
    policy
  );

  return {
    categories: categoryBreakdowns,
    calculatedPercent,
    isIncomplete: calculatedPercent == null && summativeTasks.length > 0,
    gradedTaskCount: completion.graded,
    summativeTaskCount: completion.total,
  };
}

export function buildTermGradeRows(
  cls: SchoolClass,
  termId: string,
  studentIds: string[],
  tasks: ClassTask[],
  records: StudentTaskRecord[],
  categories: TaskAssessmentCategory[],
  existing: TermGrade[],
  schoolGradingSettings: SchoolGradingSettings[]
): TermGrade[] {
  const termLetterBands = getTermLetterBands(schoolGradingSettings);
  const policy = getMissingPolicy(schoolGradingSettings);
  const existingByKey = new Map(
    existing.map((g) => [termGradeKey(g.studentId, g.classId, g.termId), normalizeTermGrade(g)])
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
      categories,
      policy
    );
    const calculatedLetter =
      calculatedPercent != null
        ? letterForPercent(calculatedPercent, termLetterBands)
        : null;

    out.push(
      normalizeTermGrade({
        id: prev?.id ?? key,
        studentId,
        classId: cls.id,
        termId,
        calculatedPercent,
        calculatedLetter,
        postedPercent: prev?.postedPercent ?? null,
        postedLetter: prev?.postedLetter ?? null,
        postStatus: prev?.postStatus ?? "draft",
        postedAt: prev?.postedAt ?? null,
        comment: prev?.comment,
        createdAt: prev?.createdAt ?? now,
        updatedAt: now,
      })
    );
  }

  return out;
}

export function mergeTermGrades(
  existing: TermGrade[],
  updated: TermGrade[]
): TermGrade[] {
  const map = new Map(existing.map((g) => [g.id, normalizeTermGrade(g)]));
  for (const g of updated) {
    map.set(g.id, normalizeTermGrade(g));
  }
  return [...map.values()];
}

export function isTermGradePosted(grade: TermGrade): boolean {
  return normalizeTermGrade(grade).postStatus === "posted";
}

/** Official report-card percent (posted only). */
export function officialTermPercent(grade: TermGrade): number | null {
  const g = normalizeTermGrade(grade);
  return g.postStatus === "posted" ? g.postedPercent : null;
}

/** Running grade shown while term is in progress. */
export function runningTermPercent(grade: TermGrade): number | null {
  return grade.calculatedPercent;
}

/** What parents / reports see: posted if available, otherwise running when not incomplete. */
export function displayTermPercent(grade: TermGrade): number | null {
  const g = normalizeTermGrade(grade);
  if (g.postStatus === "posted" && g.postedPercent != null) return g.postedPercent;
  return g.calculatedPercent;
}

export function displayTermLetter(
  grade: TermGrade,
  bands: LetterGradeBand[]
): string | null {
  const g = normalizeTermGrade(grade);
  if (g.postStatus === "posted" && g.postedLetter) return g.postedLetter;
  if (g.postStatus === "posted" && g.postedPercent != null) {
    return letterForPercent(g.postedPercent, bands);
  }
  return g.calculatedLetter ?? null;
}

/** @deprecated Use displayTermPercent */
export function effectiveTermPercent(grade: TermGrade): number | null {
  return displayTermPercent(grade);
}

/** @deprecated Use displayTermLetter */
export function effectiveTermLetter(grade: TermGrade): string | null {
  return grade.postedLetter ?? grade.calculatedLetter ?? null;
}

export function letterForTermPercent(
  percent: number,
  bands: LetterGradeBand[]
): string | null {
  return letterForPercent(percent, bands);
}

/** Year average from posted marks only; falls back to running for unposted terms. */
export function computeSchoolYearPercent(
  termGrades: TermGrade[],
  termsInYear: AcademicTerm[],
  studentId: string,
  classId: string
): number | null {
  const termIds = new Set(termsInYear.map((t) => t.id));
  const relevant = termGrades
    .filter(
      (g) => g.studentId === studentId && g.classId === classId && termIds.has(g.termId)
    )
    .map(normalizeTermGrade);
  const values: number[] = [];
  for (const g of relevant) {
    const v = displayTermPercent(g);
    if (v != null && !Number.isNaN(v)) values.push(v);
  }
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

export function postTermGradeFromRunning(
  grade: TermGrade,
  bands: LetterGradeBand[],
  override?: { postedPercent?: number | null; postedLetter?: string | null }
): TermGrade {
  const g = normalizeTermGrade(grade);
  const now = new Date().toISOString();
  const postedPercent =
    override?.postedPercent !== undefined ? override.postedPercent : g.calculatedPercent;
  const postedLetter =
    override?.postedLetter !== undefined
      ? override.postedLetter
      : postedPercent != null
        ? letterForPercent(postedPercent, bands)
        : null;

  return {
    ...g,
    postedPercent,
    postedLetter,
    postStatus: "posted",
    postedAt: now,
    updatedAt: now,
  };
}

export function unpostTermGrade(grade: TermGrade): TermGrade {
  const g = normalizeTermGrade(grade);
  return {
    ...g,
    postStatus: "draft",
    postedAt: null,
    updatedAt: new Date().toISOString(),
  };
}
