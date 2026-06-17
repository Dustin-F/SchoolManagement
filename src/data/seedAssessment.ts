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

const SEED_TIME = "2026-05-28T08:00:00.000Z";

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

/** Attach term, role, and category to seeded tasks. */
export function enrichSeedClassTasks(tasks: ClassTask[]): ClassTask[] {
  return tasks.map((t) => ({
    ...t,
    termId: t.archived ? SEED_TERM_S2 : SEED_TERM_S1,
    categoryId: TYPE_CATEGORY[t.type] ?? SEED_CAT_HOMEWORK,
    assessmentRole: FORMATIVE_TYPES.has(t.type) && t.id.includes("hw")
      ? "formative"
      : "summative",
  }));
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
        grades
      );
      grades = mergeTermGrades(grades, rows);
    }
  }

  // Demo: a few submitted overrides on Sem 1 for 9A math
  return grades.map((g) => {
    if (g.classId !== "cls-9a-math" || g.termId !== SEED_TERM_S1) return g;
    const n = parseInt(g.studentId.replace(/\D/g, ""), 10);
    if (Number.isNaN(n)) return g;
    if (n % 7 === 0 && g.calculatedPercent != null) {
      return {
        ...g,
        submittedPercent: Math.min(100, g.calculatedPercent + 2),
        submittedLetter: g.calculatedPercent >= 90 ? "A" : g.calculatedPercent >= 80 ? "B" : "C",
        comment: "Strong improvement this term.",
      };
    }
    return g;
  });
}
