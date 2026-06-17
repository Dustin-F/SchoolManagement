import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import type { ClassTask, RubricCriterion, StudentTaskRecord } from "@/types";
import { buildScoreUpdateFromCriterionScores } from "@/lib/taskScoringUtils";
import type { TaskScoreUpdate } from "@/features/tasks/TaskScoreInput";
import { cn } from "@/lib/utils";

interface RubricCriterionCellProps {
  task: ClassTask;
  record: StudentTaskRecord;
  criterion: RubricCriterion;
  readOnly?: boolean;
  onScoreUpdate: (record: StudentTaskRecord, update: TaskScoreUpdate) => void;
}

export function RubricCriterionCell({
  task,
  record,
  criterion,
  readOnly = false,
  onScoreUpdate,
}: RubricCriterionCellProps) {
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const v = record.criterionScores?.[criterion.id];
    setDraft(v != null ? String(v) : "");
  }, [record.id, record.updatedAt, criterion.id, record.criterionScores]);

  if (readOnly) {
    const v = record.criterionScores?.[criterion.id];
    return (
      <span className="text-sm font-medium tabular-nums text-foreground">
        {v != null ? v : "—"}
      </span>
    );
  }

  const commit = (raw: string) => {
    const merged: Record<string, number> = { ...(record.criterionScores ?? {}) };
    const trimmed = raw.trim();
    if (trimmed === "") {
      delete merged[criterion.id];
    } else {
      const n = Number(trimmed);
      if (!Number.isFinite(n)) return;
      const cap = criterion.maxPoints ?? n;
      merged[criterion.id] = Math.min(cap, Math.max(0, n));
    }
    onScoreUpdate(
      record,
      buildScoreUpdateFromCriterionScores(task, Object.keys(merged).length > 0 ? merged : null)
    );
  };

  return (
    <Input
      type="number"
      min={0}
      max={criterion.maxPoints ?? undefined}
      step={0.5}
      inputMode="decimal"
      className={cn(
        "mx-auto h-9 w-[3.25rem] px-1 text-center text-sm font-medium tabular-nums",
        draft !== "" && "border-primary/40 bg-primary/5"
      )}
      value={draft}
      placeholder="—"
      aria-label={`${criterion.label} score`}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onClick={(e) => e.stopPropagation()}
    />
  );
}
