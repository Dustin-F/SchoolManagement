import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ATTENTION_LABELS,
  type AttentionReason,
  type IncompleteTodoRow,
  type IncompleteTodoSummary,
} from "@/lib/attentionUtils";
import { STUDENT_TASK_STATUS_ORDER, studentTaskStatusLabel } from "@/lib/studentTaskStatus";
import { cn } from "@/lib/utils";
import type { AttendanceStatus, StudentTaskStatus } from "@/types";
import { useAppStore } from "@/store";
import { toast } from "sonner";
import { TaskProgressDialog } from "@/features/tasks/TaskProgressDialog";

const REASON_BADGE_CLASS: Record<AttentionReason, string> = {
  no_attendance: "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  overdue_task: "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200",
  missing_task: "border-orange-500/30 bg-orange-500/10 text-orange-900 dark:text-orange-100",
  negative_points: "border-slate-500/30 bg-muted text-muted-foreground",
};

export function IncompleteTodoSummaryChips({ summary }: { summary: IncompleteTodoSummary }) {
  const chips: { label: string; count: number; variant: "warning" | "danger" | "default" }[] = [
    { label: "unmarked attendance", count: summary.noAttendance, variant: "warning" },
    { label: "overdue", count: summary.overdueTask, variant: "danger" },
    { label: "missing work", count: summary.missingTask, variant: "warning" },
  ];

  const visible = chips.filter((c) => c.count > 0);
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((chip) => (
        <span
          key={chip.label}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
            chip.variant === "danger" && "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200",
            chip.variant === "warning" && "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-100",
            chip.variant === "default" && "border-border bg-muted/50 text-muted-foreground"
          )}
        >
          <span className="font-bold tabular-nums">{chip.count}</span>
          {chip.label}
        </span>
      ))}
    </div>
  );
}

export function IncompleteTodoRowCard({ row }: { row: IncompleteTodoRow }) {
  const [open, setOpen] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>("present");
  const attendance = useAppStore((s) => s.attendance);
  const classTasks = useAppStore((s) => s.classTasks);
  const studentTaskRecords = useAppStore((s) => s.studentTaskRecords);
  const addAttendance = useAppStore((s) => s.addAttendance);
  const updateAttendance = useAppStore((s) => s.updateAttendance);
  const [taskFallbackStatus, setTaskFallbackStatus] = useState<StudentTaskStatus>("completed");
  const updateStudentTaskRecord = useAppStore((s) => s.updateStudentTaskRecord);

  const task = useMemo(
    () => (row.taskId ? classTasks.find((t) => t.id === row.taskId) ?? null : null),
    [classTasks, row.taskId]
  );
  const taskRecord = useMemo(
    () =>
      row.taskRecordId
        ? studentTaskRecords.find((r) => r.id === row.taskRecordId) ?? null
        : null,
    [row.taskRecordId, studentTaskRecords]
  );
  const taskTitle = task?.title ?? row.detail;

  const existingAttendance = useMemo(
    () =>
      attendance.find(
        (a) => a.classId === row.classId && a.studentId === row.studentId && a.date === row.sessionDate
      ),
    [attendance, row.classId, row.sessionDate, row.studentId]
  );

  useEffect(() => {
    if (!open) return;
    if (row.reason === "no_attendance" && existingAttendance) {
      setAttendanceStatus(existingAttendance.status);
      return;
    }
    if ((row.reason === "missing_task" || row.reason === "overdue_task") && row.taskRecordId) {
      const current = studentTaskRecords.find((r) => r.id === row.taskRecordId);
      if (current) setTaskFallbackStatus(current.status);
    }
  }, [existingAttendance, open, row.reason, row.taskRecordId, studentTaskRecords]);

  const handleApply = () => {
    if (row.reason === "no_attendance") {
      if (existingAttendance) {
        updateAttendance(existingAttendance.id, { status: attendanceStatus });
      } else {
        addAttendance({
          classId: row.classId,
          studentId: row.studentId,
          date: row.sessionDate,
          status: attendanceStatus,
        });
      }
      toast.success("Attendance updated.");
      setOpen(false);
      return;
    }

    if ((row.reason === "missing_task" || row.reason === "overdue_task") && row.taskRecordId) {
      updateStudentTaskRecord(row.taskRecordId, { status: taskFallbackStatus });
      toast.success("Task status updated.");
      setOpen(false);
      return;
    }

    toast.error("Could not resolve this item.");
  };

  return (
    <>
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/40"
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{row.studentName}</p>
        <p className="truncate text-sm text-muted-foreground">
          {row.className}
          {taskTitle ? ` · ${taskTitle}` : ""}
        </p>
      </div>
      <Badge variant="outline" className={cn("shrink-0 text-xs", REASON_BADGE_CLASS[row.reason])}>
        {ATTENTION_LABELS[row.reason]}
      </Badge>
    </button>

    {row.reason === "no_attendance" ? (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve item</DialogTitle>
          <DialogDescription>
            {row.studentName} · {row.className}
            <span className="mt-1 block text-xs text-muted-foreground">
              {ATTENTION_LABELS[row.reason]}
              {taskTitle ? ` · ${taskTitle}` : ""}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Attendance status</Label>
          <Select
            value={attendanceStatus}
            onValueChange={(value) => setAttendanceStatus(value as AttendanceStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="excused">Excused</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleApply}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    ) : task && taskRecord ? (
    <TaskProgressDialog
      open={open}
      onOpenChange={setOpen}
      record={taskRecord}
      task={task}
      studentName={row.studentName}
    />
    ) : (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Task details unavailable</DialogTitle>
          <DialogDescription>
            This item no longer has a linked task record. You can refresh or open the class page.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Fallback task status</Label>
          <Select
            value={taskFallbackStatus}
            onValueChange={(value) => setTaskFallbackStatus(value as StudentTaskStatus)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick status" />
            </SelectTrigger>
            <SelectContent>
              {STUDENT_TASK_STATUS_ORDER.map((status) => (
                <SelectItem key={status} value={status}>
                  {studentTaskStatusLabel[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleApply}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    )}
    </>
  );
}
