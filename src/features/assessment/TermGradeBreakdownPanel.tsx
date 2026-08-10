import { Link } from "react-router-dom";
import type { TermGradeBreakdown } from "@/lib/termGradeUtils";
import { studentTaskStatusLabel } from "@/lib/studentTaskStatus";
import { cn } from "@/lib/utils";

interface TermGradeBreakdownPanelProps {
  breakdown: TermGradeBreakdown;
  classId: string;
}

export function TermGradeBreakdownPanel({ breakdown, classId }: TermGradeBreakdownPanelProps) {
  if (breakdown.categories.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No summative tasks in this term yet.
      </p>
    );
  }

  return (
    <div className="space-y-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {breakdown.gradedTaskCount}/{breakdown.summativeTaskCount} summative tasks graded
        </span>
        {breakdown.isIncomplete && (
          <span className="text-amber-600 dark:text-amber-400">
            Running grade incomplete — finish grading or adjust policy in settings
          </span>
        )}
      </div>
      {breakdown.categories.map((cat) => (
        <div key={cat.categoryId} className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium">
              {cat.categoryName}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {cat.weightPercent}% of term
              </span>
            </p>
            <p className="text-sm font-semibold tabular-nums">
              {cat.averagePercent != null ? `${cat.averagePercent}%` : "—"}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                ({cat.gradedCount}/{cat.taskCount} counted)
              </span>
            </p>
          </div>
          <ul className="mt-2 space-y-1">
            {cat.tasks.map((task) => (
              <li
                key={task.taskId}
                className="flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <Link
                  to={`/classes/${classId}/tasks/${task.taskId}/grade`}
                  className="text-foreground hover:text-primary"
                >
                  {task.title}
                </Link>
                <span className="flex items-center gap-2 tabular-nums">
                  {!task.included ? (
                    <span className="text-muted-foreground">{task.note ?? "Excluded"}</span>
                  ) : (
                    <span
                      className={cn(
                        task.percent === 0 &&
                          task.status !== "completed" &&
                          "text-destructive"
                      )}
                    >
                      {task.percent != null ? `${task.percent}%` : "—"}
                    </span>
                  )}
                  {task.status !== "unassigned" && task.status !== "completed" && (
                    <span className="text-muted-foreground">
                      {studentTaskStatusLabel[task.status]}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
