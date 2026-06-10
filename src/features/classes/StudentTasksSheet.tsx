import { ClipboardList, MoreHorizontal } from "lucide-react";
import type { ClassTask, Student, StudentTaskRecord, StudentTaskStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { getStudentDisplayName } from "@/lib/displayHelpers";
import {
  STUDENT_TASK_STATUS_ORDER,
  studentTaskStatusLabel,
  studentTaskStatusSelectClass,
} from "@/lib/studentTaskStatus";
import { isTaskOverdue } from "@/lib/taskUtils";
import { cn } from "@/lib/utils";

interface StudentTasksSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  activeTasks: ClassTask[];
  getTaskRecord: (taskId: string, studentId: string) => StudentTaskRecord | undefined;
  onTaskStatusChange: (recordId: string, status: StudentTaskStatus) => void;
  onTaskScoreBlur: (record: StudentTaskRecord, raw: string) => void;
  onOpenProgress: (record: StudentTaskRecord, task: ClassTask) => void;
  todayStr: string;
}

export function StudentTasksSheet({
  open,
  onOpenChange,
  student,
  activeTasks,
  getTaskRecord,
  onTaskStatusChange,
  onTaskScoreBlur,
  onOpenProgress,
  todayStr,
}: StudentTasksSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-6 sm:max-w-md">
        <div className="pr-8">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
            Tasks
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {student ? getStudentDisplayName(student) : "Student"} — active assignments for this class
          </p>
        </div>

        {!student ? null : activeTasks.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">No active tasks for this class.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {activeTasks.map((task) => {
              const rec = getTaskRecord(task.id, student.id);
              const overdue = isTaskOverdue(task, todayStr);

              if (!rec) {
                return (
                  <div
                    key={task.id}
                    className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground"
                  >
                    <span className="font-medium text-foreground">{task.title}</span> — syncing…
                  </div>
                );
              }

              return (
                <div
                  key={task.id}
                  className="space-y-2 rounded-lg border border-border bg-card p-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{task.title}</p>
                    {overdue && rec.status !== "completed" && (
                      <p className="text-xs text-red-600 dark:text-red-400">Overdue</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={rec.status}
                      onValueChange={(v) => onTaskStatusChange(rec.id, v as StudentTaskStatus)}
                    >
                      <SelectTrigger
                        className={cn("h-9 w-40 text-sm", studentTaskStatusSelectClass(rec.status))}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STUDENT_TASK_STATUS_ORDER.map((s) => (
                          <SelectItem key={s} value={s}>
                            {studentTaskStatusLabel[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      key={`${rec.id}-${rec.updatedAt}`}
                      type="number"
                      step={0.5}
                      placeholder="Score"
                      className="h-9 w-20 text-sm"
                      defaultValue={rec.score != null ? String(rec.score) : ""}
                      title={task.maxScore != null ? `Max ${task.maxScore}` : "Score"}
                      onBlur={(e) => onTaskScoreBlur(rec, e.target.value)}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9"
                      title="Feedback and dates"
                      onClick={() => onOpenProgress(rec, task)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
