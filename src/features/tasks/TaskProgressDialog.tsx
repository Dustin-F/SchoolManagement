import { useEffect } from "react";
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
import { Input } from "@/components/ui/input";
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
import type { StudentTaskRecord, StudentTaskStatus } from "@/types";

interface TaskProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: StudentTaskRecord | null;
  studentName: string;
  taskTitle: string;
  maxScore?: number | null;
}

export function TaskProgressDialog({
  open,
  onOpenChange,
  record,
  studentName,
  taskTitle,
  maxScore,
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
      score: "",
      feedback: "",
      submittedAt: "",
    },
  });

  const statusValue = watch("status") as StudentTaskStatus;

  useEffect(() => {
    if (record) {
      reset({
        status: record.status,
        score: record.score != null ? String(record.score) : "",
        feedback: record.feedback ?? "",
        submittedAt: record.submittedAt
          ? (record.submittedAt.includes("T") ? record.submittedAt.split("T")[0] : record.submittedAt)
          : "",
      });
    }
  }, [record, reset]);

  const onSubmit = (data: StudentTaskRecordFormData) => {
    if (!record) return;
    const rawScore = data.score?.trim() ?? "";
    const score =
      rawScore === "" ? null : Number.isFinite(Number(rawScore)) ? Number(rawScore) : null;
    updateStudentTaskRecord(record.id, {
      status: data.status,
      score,
      feedback: data.feedback || undefined,
      submittedAt: data.submittedAt && data.submittedAt !== "" ? data.submittedAt : null,
    });
    toast.success("Progress saved.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update progress</DialogTitle>
          <DialogDescription>
            {studentName} &middot; {taskTitle}
          </DialogDescription>
        </DialogHeader>

        {record && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusValue}
                onValueChange={(v) => setValue("status", v as StudentTaskStatus, { shouldValidate: true })}
              >
                <SelectTrigger className={cn("w-full transition-colors", studentTaskStatusSelectClass(statusValue))}>
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
              <p className="text-xs text-muted-foreground">
                Pick one status — the trigger and badges use the same colors (green = complete, red = missing).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="score">Score {maxScore != null && <span className="text-muted-foreground font-normal">(max {maxScore})</span>}</Label>
              <Input id="score" type="number" step={0.5} placeholder="—" {...register("score")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="submittedAt">Submitted date <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="submittedAt" type="date" {...register("submittedAt")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea id="feedback" rows={2} {...register("feedback")} />
            </div>

            {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
