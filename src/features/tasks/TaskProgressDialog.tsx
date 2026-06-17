import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";
import { studentTaskRecordUpdateSchema, type StudentTaskRecordFormData } from "@/lib/schemas";
import {
  STUDENT_TASK_STATUS_ORDER,
  studentTaskStatusLabel,
  studentTaskStatusSelectClass,
  studentTaskStatusItemClass,
} from "@/lib/studentTaskStatus";
import type { ClassTask, StudentTaskRecord, StudentTaskStatus } from "@/types";
import { RubricScoreFields } from "@/features/tasks/RubricScoreFields";
import { TaskScoreInput, type TaskScoreUpdate } from "@/features/tasks/TaskScoreInput";
import {
  formatTaskScoreHeader,
  hasLetterGrades,
  isRubricMode,
} from "@/lib/taskScoringUtils";

interface TaskProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: StudentTaskRecord | null;
  task: ClassTask | null;
  studentName: string;
  readOnly?: boolean;
  /** "detail" = student profile; default = quick update from class flow */
  variant?: "default" | "detail";
}

export function TaskProgressDialog({
  open,
  onOpenChange,
  record,
  task,
  studentName,
  readOnly = false,
  variant = "default",
}: TaskProgressDialogProps) {
  const updateStudentTaskRecord = useAppStore((s) => s.updateStudentTaskRecord);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentTaskRecordFormData>({
    resolver: zodResolver(studentTaskRecordUpdateSchema),
    defaultValues: {
      status: "not_started",
      feedback: "",
      submittedAt: "",
    },
  });

  const statusValue = watch("status") as StudentTaskStatus;

  useEffect(() => {
    if (record) {
      reset({
        status: record.status,
        feedback: record.feedback ?? "",
        submittedAt: record.submittedAt
          ? record.submittedAt.includes("T")
            ? record.submittedAt.split("T")[0]
            : record.submittedAt
          : "",
      });
    }
  }, [record, reset]);

  const onSubmit = (data: StudentTaskRecordFormData) => {
    if (!record) return;
    updateStudentTaskRecord(record.id, {
      status: data.status,
      feedback: data.feedback || undefined,
      submittedAt: data.submittedAt && data.submittedAt !== "" ? data.submittedAt : null,
    });
    toast.success("Progress saved.");
    onOpenChange(false);
  };

  const handleScoreUpdate = (rec: StudentTaskRecord, update: TaskScoreUpdate) => {
    const patch: Partial<StudentTaskRecord> = {};
    if (update.score !== undefined) patch.score = update.score;
    if (update.letterGrade !== undefined) patch.letterGrade = update.letterGrade;
    if ("criterionScores" in update) {
      patch.criterionScores = update.criterionScores ?? undefined;
    }
    updateStudentTaskRecord(rec.id, patch);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{variant === "detail" ? "Assignment details" : "Update progress"}</DialogTitle>
          <DialogDescription>
            {studentName} &middot; {task?.title ?? "Task"}
            {task && (
              <span className="block text-xs text-muted-foreground">{formatTaskScoreHeader(task)}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {record && task && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              {readOnly ? (
                <p className="text-sm capitalize">{studentTaskStatusLabel[statusValue]}</p>
              ) : (
              <Select
                value={statusValue}
                onValueChange={(v) => setValue("status", v as StudentTaskStatus, { shouldValidate: true })}
              >
                <SelectTrigger
                  className={cn("w-full transition-colors", studentTaskStatusSelectClass(statusValue))}
                >
                  <SelectValue placeholder="Choose status" />
                </SelectTrigger>
                <SelectContent>
                  {STUDENT_TASK_STATUS_ORDER.map((s) => (
                    <SelectItem
                      key={s}
                      value={s}
                      className={cn("capitalize", studentTaskStatusItemClass(s))}
                    >
                      {studentTaskStatusLabel[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>{isRubricMode(task) ? "Rubric scores" : "Score"}</Label>
              {isRubricMode(task) ? (
                <RubricScoreFields
                  task={task}
                  record={record}
                  readOnly={readOnly}
                  onScoreUpdate={handleScoreUpdate}
                />
              ) : (
                <TaskScoreInput
                  task={task}
                  record={record}
                  readOnly={readOnly}
                  onScoreUpdate={handleScoreUpdate}
                />
              )}
              {isRubricMode(task) && hasLetterGrades(task) && record.letterGrade && (
                <p className="text-xs text-muted-foreground">
                  Letter grade: <strong>{record.letterGrade}</strong> (from total %)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="submittedAt">
                Submitted date <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              {readOnly ? (
                <p className="text-sm text-muted-foreground">
                  {watch("submittedAt") ? watch("submittedAt") : "—"}
                </p>
              ) : (
              <DatePicker
                id="submittedAt"
                value={watch("submittedAt") ?? ""}
                onChange={(v) => setValue("submittedAt", v, { shouldValidate: true })}
                placeholder="Pick submitted date"
                clearable
              />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">
                Feedback <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              {readOnly ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {watch("feedback") || "—"}
                </p>
              ) : (
              <Textarea id="feedback" rows={2} {...register("feedback")} />
              )}
            </div>

            {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              {variant === "detail" && task.classId && (
                <Button type="button" variant="ghost" size="sm" className="w-full sm:w-auto" asChild>
                  <Link to={`/classes/${task.classId}/tasks/${task.id}/grade`}>
                    Open class grade page
                  </Link>
                </Button>
              )}
              <div className="flex w-full flex-wrap justify-end gap-2 sm:ml-auto sm:w-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {!readOnly && (
              <Button type="submit">Save</Button>
              )}
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
