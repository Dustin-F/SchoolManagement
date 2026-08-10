import type { AcademicTerm, ClassTask, TaskAssessmentCategory, TaskAssessmentRole } from "@/types";

export { categoriesForSubject, totalCategoryWeight } from "@/lib/termGradeUtils";

export const ASSESSMENT_ROLE_LABELS: Record<TaskAssessmentRole, string> = {
  formative: "Formative",
  summative: "Summative",
};

export function getActiveTerm(terms: AcademicTerm[]): AcademicTerm | undefined {
  const active = terms.filter((t) => t.isActive);
  if (active.length === 0) {
    return [...terms].sort((a, b) => a.sortOrder - b.sortOrder)[0];
  }
  return [...active].sort((a, b) => a.sortOrder - b.sortOrder)[0];
}

export function getDefaultTermId(terms: AcademicTerm[]): string | undefined {
  return getActiveTerm(terms)?.id;
}

export function termLabel(term: AcademicTerm): string {
  return `${term.name} (${term.schoolYear})`;
}

export function categoryLabel(cat: TaskAssessmentCategory): string {
  return `${cat.name} (${cat.weightPercent}%)`;
}

export function filterTasksByTerm(tasks: ClassTask[], termId: string | "all"): ClassTask[] {
  if (termId === "all") return tasks;
  return tasks.filter((t) => t.termId === termId);
}

export function roleBadgeVariant(
  role: TaskAssessmentRole | undefined
): "secondary" | "default" | "outline" {
  return role === "formative" ? "secondary" : "default";
}
