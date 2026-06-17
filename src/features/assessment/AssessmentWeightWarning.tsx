import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { categoriesForSubject, totalCategoryWeight } from "@/lib/termGradeUtils";
import type { TaskAssessmentCategory } from "@/types";

interface AssessmentWeightWarningProps {
  categories: TaskAssessmentCategory[];
  subjectId: string;
}

export function AssessmentWeightWarning({ categories, subjectId }: AssessmentWeightWarningProps) {
  const scoped = categoriesForSubject(categories, subjectId);
  const total = totalCategoryWeight(scoped);
  if (scoped.length === 0 || total === 100) return null;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        Assessment category weights total <strong>{total}%</strong>, not 100%. Term grades may be
        inaccurate until you fix this in{" "}
        <Link to="/settings/assessment" className="font-medium underline underline-offset-2">
          Assessment settings
        </Link>
        .
      </p>
    </div>
  );
}
