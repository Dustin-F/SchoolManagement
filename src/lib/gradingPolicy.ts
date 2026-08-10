import type { MissingGradePolicy, SchoolGradingSettings } from "@/types";
export const DEFAULT_SCHOOL_GRADING_SETTINGS_ID = "grading-default";

export const MISSING_POLICY_LABELS: Record<MissingGradePolicy, string> = {
  count_as_zero: "Missing and ungraded count as 0%",
  exclude_ungraded: "Only graded work counts (running average)",
  incomplete_while_missing: "Show incomplete until all summative work is graded",
};

export const DEFAULT_MISSING_POLICY: MissingGradePolicy = "count_as_zero";

export function getMissingPolicy(settings: SchoolGradingSettings[]): MissingGradePolicy {
  const row =
    settings.find((s) => s.id === DEFAULT_SCHOOL_GRADING_SETTINGS_ID) ?? settings[0];
  return row?.missingPolicy ?? DEFAULT_MISSING_POLICY;
}

export function normalizeSchoolGradingSettings(
  settings: SchoolGradingSettings[]
): SchoolGradingSettings[] {
  return settings.map((s) => ({
    ...s,
    missingPolicy: s.missingPolicy ?? DEFAULT_MISSING_POLICY,
  }));
}
