import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClassTask, StudentTaskRecord } from "@/types";
import { RubricScoreFields } from "@/features/tasks/RubricScoreFields";
import {
  buildScoreUpdateFromLetter,
  buildScoreUpdateFromNumeric,
  formatRecordScore,
  getLetterGrades,
  hasLetterGrades,
  isRubricMode,
  letterGradeForRecord,
  parseNumericScore,
  resolveScoreMode,
  scoreInputScaleLabel,
  type TaskScorePatch,
} from "@/lib/taskScoringUtils";
import { cn } from "@/lib/utils";

export type TaskScoreUpdate = TaskScorePatch;

interface TaskScoreInputProps {
  task: ClassTask;
  record: StudentTaskRecord;
  readOnly?: boolean;
  compact?: boolean;
  className?: string;
  onScoreUpdate: (record: StudentTaskRecord, update: TaskScoreUpdate) => void;
}

export function TaskScoreInput({
  task,
  record,
  readOnly = false,
  compact = false,
  className,
  onScoreUpdate,
}: TaskScoreInputProps) {
  if (isRubricMode(task)) {
    return (
      <RubricScoreFields
        task={task}
        record={record}
        readOnly={readOnly}
        compact={compact}
        className={className}
        onScoreUpdate={onScoreUpdate}
      />
    );
  }

  const mode = resolveScoreMode(task);
  const lettersEnabled = hasLetterGrades(task);

  if (readOnly) {
    return (
      <span className={cn("font-semibold tabular-nums text-sm", className)}>
        {formatRecordScore(task, record)}
      </span>
    );
  }

  const bands = getLetterGrades(task);
  const displayLetter = letterGradeForRecord(task, record) ?? "";
  const scaleLabel = scoreInputScaleLabel(task);

  const numericInput = (
    <Input
      key={`${record.id}-${record.updatedAt}`}
      type="number"
      step={mode === "percentage" ? 1 : 0.5}
      min={0}
      max={mode === "percentage" ? 100 : (task.maxScore ?? undefined)}
      inputMode="decimal"
      placeholder="—"
      className={cn(
        "px-1 text-center tabular-nums",
        compact ? "h-8 w-[3.25rem] text-xs" : "h-9 w-20 text-sm",
        lettersEnabled && compact && "w-12"
      )}
      defaultValue={record.score != null ? String(record.score) : ""}
      aria-label={
        scaleLabel
          ? `Score ${mode === "percentage" ? "out of 100 percent" : `out of ${task.maxScore}`}`
          : "Score"
      }
      onBlur={(e) => {
        const next = parseNumericScore(task, e.target.value);
        e.target.value = next != null ? String(next) : "";
        onScoreUpdate(record, buildScoreUpdateFromNumeric(task, next));
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );

  const numericField = scaleLabel ? (
    <div className="inline-flex items-center gap-0.5">
      {numericInput}
      <span
        className={cn(
          "shrink-0 tabular-nums text-muted-foreground",
          compact ? "text-xs" : "text-sm"
        )}
        aria-hidden
      >
        {scaleLabel}
      </span>
    </div>
  ) : (
    numericInput
  );

  const letterSelect = (
    <Select
      value={displayLetter}
      onValueChange={(letter) => {
        if (letter === "__clear__") {
          onScoreUpdate(record, { score: null, letterGrade: null, criterionScores: undefined });
          return;
        }
        onScoreUpdate(record, buildScoreUpdateFromLetter(task, letter));
      }}
    >
      <SelectTrigger
        className={cn(compact ? "h-8 w-14 px-1 text-xs" : "h-9 w-16", className)}
        onClick={(e) => e.stopPropagation()}
      >
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__clear__" className="text-xs text-muted-foreground">
          Clear
        </SelectItem>
        {bands.map((band) => (
          <SelectItem key={band.letter} value={band.letter} className="text-xs">
            {band.letter} (≥{band.minPercent}%)
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (lettersEnabled) {
    return (
      <div className={cn("flex items-center justify-center gap-1", className)}>
        {numericField}
        {letterSelect}
      </div>
    );
  }

  return <div className={cn("flex justify-center", className)}>{numericField}</div>;
}
