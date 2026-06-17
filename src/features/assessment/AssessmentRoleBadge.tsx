import type { TaskAssessmentRole } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ASSESSMENT_ROLE_LABELS, roleBadgeVariant } from "@/lib/assessmentUtils";

export function AssessmentRoleBadge({ role }: { role?: TaskAssessmentRole }) {
  const value = role ?? "summative";
  return (
    <Badge variant={roleBadgeVariant(value)} className="text-[10px] font-normal">
      {ASSESSMENT_ROLE_LABELS[value]}
    </Badge>
  );
}
