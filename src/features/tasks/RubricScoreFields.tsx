import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClassTask, StudentTaskRecord } from "@/types";
import {
  buildScoreUpdateFromCriterionScores,
  formatRecordScore,
  rubricMaxPoints,
} from "@/lib/taskScoringUtils";
import type { TaskScoreUpdate } from "@/features/tasks/TaskScoreInput";
import { cn } from "@/lib/utils";

interface RubricScoreFieldsProps {
  task: ClassTask;
  record: StudentTaskRecord;
  readOnly?: boolean;
  compact?: boolean;
  className?: string;
  onScoreUpdate: (record: StudentTaskRecord, update: TaskScoreUpdate) => void;
}

export function RubricScoreFields({
  task,
  record,
  readOnly = false,
  compact = false,
  className,
  onScoreUpdate,
}: RubricScoreFieldsProps) {
  const criteria = task.rubric ?? [];
  const max = rubricMaxPoints(task);

  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const c of criteria) {
      const v = record.criterionScores?.[c.id];
      next[c.id] = v != null ? String(v) : "";
    }
    setDraft(next);
  }, [record.id, record.updatedAt, criteria]);

  if (criteria.length === 0) {
    return <p className="text-xs text-muted-foreground">No rubric on this task.</p>;
  }

  if (readOnly) {
    return (
      <span className={cn("text-sm font-semibold tabular-nums", className)}>
        {formatRecordScore(task, record)}
      </span>
    );
  }

  const commit = (nextDraft: Record<string, string>) => {
    const criterionScores: Record<string, number> = {};
    let any = false;
    for (const c of criteria) {
      const raw = nextDraft[c.id]?.trim() ?? "";
      if (raw === "") continue;
      const n = Number(raw);
      if (!Number.isFinite(n)) continue;
      const cap = c.maxPoints ?? n;
      criterionScores[c.id] = Math.min(cap, Math.max(0, n));
      any = true;
    }
    onScoreUpdate(
      record,
      buildScoreUpdateFromCriterionScores(task, any ? criterionScores : null)
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      {!compact && (
        <p className="text-xs text-muted-foreground">
          Total out of {max || "—"}:{" "}
          <span className="font-semibold text-foreground">{formatRecordScore(task, record)}</span>
        </p>
      )}
      <div className={cn("space-y-1.5", compact && "space-y-1")}>
        {criteria.map((c) => (
          <div
            key={c.id}
            className={cn(
              "flex items-center gap-2",
              compact ? "text-xs" : "text-sm"
            )}
          >
            <Label className={cn("min-w-0 flex-1 truncate font-normal", compact && "text-xs")}>
              {c.label}
              {c.maxPoints != null && (
                <span className="text-muted-foreground"> /{c.maxPoints}</span>
              )}
            </Label>
            <Input
              type="number"
              min={0}
              max={c.maxPoints ?? undefined}
              step={0.5}
              className={cn("w-16 text-center tabular-nums", compact ? "h-7 text-xs" : "h-8")}
              value={draft[c.id] ?? ""}
              placeholder="—"
              onChange={(e) => {
                const v = e.target.value;
                setDraft((prev) => ({ ...prev, [c.id]: v }));
              }}
              onBlur={(e) => {
                const nextDraft = { ...draft, [c.id]: e.target.value };
                setDraft(nextDraft);
                commit(nextDraft);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
