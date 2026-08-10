import type {
  AcademicTerm,
  ClassTask,
  SchoolClass,
  StudentTaskRecord,
  TaskAssessmentCategory,
  TermGrade,
} from "@/types";
import {
  buildTermGradeRows,
  mergeTermGrades,
} from "@/lib/termGradeUtils";

import { DEFAULT_LETTER_GRADES, letterForPercent, sortLetterGrades } from "@/lib/taskScoringUtils";
import { DEFAULT_SCHOOL_GRADING_SETTINGS_ID } from "@/lib/gradingPolicy";
import type { SchoolGradingSettings } from "@/types";

const SEED_TIME = "2026-05-28T08:00:00.000Z";

export const seedSchoolGradingSettings: SchoolGradingSettings[] = [
  {
    id: DEFAULT_SCHOOL_GRADING_SETTINGS_ID,
    termLetterBands: sortLetterGrades(DEFAULT_LETTER_GRADES),
    missingPolicy: "count_as_zero",
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
];

function ent<T extends { id: string; createdAt: string; updatedAt: string }>(
  id: string,
  data: Omit<T, "id" | "createdAt" | "updatedAt">
): T {
  return { id, createdAt: SEED_TIME, updatedAt: SEED_TIME, ...data } as T;
}

export const SEED_TERM_S1 = "term-2526-s1";
export const SEED_TERM_S2 = "term-2526-s2";

export const seedAcademicTerms: AcademicTerm[] = [
  ent<AcademicTerm>(SEED_TERM_S1, {
    name: "Semester 1",
    schoolYear: "2025-26",
    startDate: "2025-09-01",
    endDate: "2026-01-31",
    isActive: true,
    sortOrder: 1,
  }),
  ent<AcademicTerm>(SEED_TERM_S2, {
    name: "Semester 2",
    schoolYear: "2025-26",
    startDate: "2026-02-01",
    endDate: "2026-06-30",
    isActive: false,
    sortOrder: 2,
  }),
];

export const SEED_CAT_HOMEWORK = "cat-homework";
export const SEED_CAT_QUIZ = "cat-quiz";
export const SEED_CAT_EXAM = "cat-exam";
export const SEED_CAT_PROJECT = "cat-project";

export const seedTaskAssessmentCategories: TaskAssessmentCategory[] = [
  ent<TaskAssessmentCategory>(SEED_CAT_HOMEWORK, {
    name: "Homework",
    weightPercent: 15,
    sortOrder: 1,
  }),
  ent<TaskAssessmentCategory>(SEED_CAT_QUIZ, {
    name: "Quizzes",
    weightPercent: 25,
    sortOrder: 2,
  }),
  ent<TaskAssessmentCategory>(SEED_CAT_EXAM, {
    name: "Exams",
    weightPercent: 40,
    sortOrder: 3,
  }),
  ent<TaskAssessmentCategory>(SEED_CAT_PROJECT, {
    name: "Projects",
    weightPercent: 20,
    sortOrder: 4,
  }),
];

const TYPE_CATEGORY: Record<ClassTask["type"], string> = {
  homework: SEED_CAT_HOMEWORK,
  worksheet: SEED_CAT_HOMEWORK,
  quiz: SEED_CAT_QUIZ,
  exam: SEED_CAT_EXAM,
  presentation: SEED_CAT_PROJECT,
  project: SEED_CAT_PROJECT,
  essay: SEED_CAT_PROJECT,
  other: SEED_CAT_HOMEWORK,
};

const FORMATIVE_TYPES = new Set<ClassTask["type"]>(["homework", "worksheet"]);

/** Task ids that stay formative even when type would be summative. */
const FORMATIVE_TASK_IDS = new Set([
  "task-9a-hw1",
  "task-9b-reading",
  "task-10a-hw1",
  "task-10b-hw1",
]);

/** Attach term, role, category, and publish defaults to seeded tasks. */
export function enrichSeedClassTasks(tasks: ClassTask[]): ClassTask[] {
  return tasks.map((t) => {
    const termId = t.archived ? SEED_TERM_S2 : SEED_TERM_S1;
    const assessmentRole = FORMATIVE_TASK_IDS.has(t.id)
      ? "formative"
      : FORMATIVE_TYPES.has(t.type) && t.id.includes("hw")
        ? "formative"
        : "summative";
    return {
      ...t,
      termId,
      categoryId: TYPE_CATEGORY[t.type] ?? SEED_CAT_HOMEWORK,
      assessmentRole,
      publishedAt: t.publishedToStudents ? t.publishedAt ?? SEED_TIME : undefined,
    };
  });
}

export function buildSeedTermGrades(
  classes: SchoolClass[],
  tasks: ClassTask[],
  records: StudentTaskRecord[],
  categories: TaskAssessmentCategory[]
): TermGrade[] {
  let grades: TermGrade[] = [];

  for (const cls of classes) {
    if (cls.archived) continue;
    for (const term of seedAcademicTerms) {
      const rows = buildTermGradeRows(
        cls,
        term.id,
        cls.studentIds,
        tasks,
        records,
        categories,
        grades,
        seedSchoolGradingSettings
      );
      grades = mergeTermGrades(grades, rows);
    }
  }

  const bands = sortLetterGrades(DEFAULT_LETTER_GRADES);
  const comments = [
    "Strong effort and participation this term.",
    "Good progress — keep revising for exams.",
    "Excellent collaboration in group work.",
    "Needs to submit missing work on time.",
    "Outstanding analytical writing.",
  ];

  return grades.map((g) => {
    if (g.termId !== SEED_TERM_S1) return g;
    const n = parseInt(g.studentId.replace(/\D/g, ""), 10);
    if (Number.isNaN(n) || g.calculatedPercent == null) return g;

    const shouldPost =
      g.classId === "cls-9a-math" ||
      (g.classId === "cls-9b-eng" && n % 2 === 0);

    if (!shouldPost) return g;

    const postedPercent = Math.min(100, Math.round(g.calculatedPercent));
    const postedLetter =
      letterForPercent(postedPercent, bands) ?? g.calculatedLetter ?? null;

    return {
      ...g,
      postedPercent,
      postedLetter,
      postStatus: "posted" as const,
      postedAt: SEED_TIME,
      comment:
        g.classId === "cls-9a-math" && n % 5 === 0
          ? comments[(n / 5) % comments.length]
          : g.classId === "cls-9b-eng" && n % 3 === 0
            ? comments[n % comments.length]
            : g.comment,
    };
  });
}
