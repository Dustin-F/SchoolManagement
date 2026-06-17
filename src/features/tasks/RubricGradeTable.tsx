import { Link } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import type { ClassTask, Student, StudentTaskRecord, StudentTaskStatus } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RubricCriterionCell } from "@/features/tasks/RubricCriterionCell";
import type { TaskScoreUpdate } from "@/features/tasks/TaskScoreInput";
import { getStudentDisplayName } from "@/lib/displayHelpers";
import {
  STUDENT_TASK_STATUS_ORDER,
  studentTaskStatusLabel,
  studentTaskStatusSelectClass,
} from "@/lib/studentTaskStatus";
import { formatRecordScore, rubricMaxPoints } from "@/lib/taskScoringUtils";
import { cn } from "@/lib/utils";

function statusRowTint(status: StudentTaskStatus): string {
  const map: Record<StudentTaskStatus, string> = {
    completed: "bg-emerald-500/5",
    not_started: "",
    in_progress: "bg-amber-500/5",
    missing: "bg-red-500/8",
  };
  return map[status];
}

interface RubricGradeTableProps {
  task: ClassTask;
  students: Student[];
  recordByStudent: Map<string, StudentTaskRecord>;
  readOnly?: boolean;
  onTaskStatusChange: (recordId: string, status: StudentTaskStatus) => void;
  onTaskScoreUpdate: (record: StudentTaskRecord, update: TaskScoreUpdate) => void;
  onOpenProgress?: (record: StudentTaskRecord, task: ClassTask) => void;
}

export function RubricGradeTable({
  task,
  students,
  recordByStudent,
  readOnly = false,
  onTaskStatusChange,
  onTaskScoreUpdate,
  onOpenProgress,
}: RubricGradeTableProps) {
  const criteria = task.rubric ?? [];
  const maxTotal = rubricMaxPoints(task);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border bg-muted/30">
            <TableHead className="sticky left-0 z-20 min-w-[10rem] bg-muted/30 backdrop-blur sm:min-w-[11rem]">
              Student
            </TableHead>
            <TableHead className="min-w-[7.5rem]">Status</TableHead>
            {criteria.map((c) => (
              <TableHead
                key={c.id}
                className="min-w-[4.5rem] max-w-[7rem] text-center align-bottom"
              >
                <div className="flex flex-col items-center gap-0.5 px-0.5 pb-0.5">
                  <span className="line-clamp-2 text-xs font-semibold leading-tight text-foreground">
                    {c.label}
                  </span>
                  <span className="rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground ring-1 ring-border/60">
                    /{c.maxPoints ?? "—"}
                  </span>
                </div>
              </TableHead>
            ))}
            <TableHead className="min-w-[4rem] text-center">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xs font-semibold">Total</span>
                <span className="text-[10px] font-medium text-muted-foreground">/{maxTotal || "—"}</span>
              </div>
            </TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student, index) => {
            const record = recordByStudent.get(student.id);
            if (!record) {
              return (
                <TableRow key={student.id}>
                  <TableCell className="sticky left-0 z-10 bg-card font-medium">
                    {getStudentDisplayName(student)}
                  </TableCell>
                  <TableCell colSpan={criteria.length + 3} className="text-sm text-muted-foreground">
                    Syncing…
                  </TableCell>
                </TableRow>
              );
            }

            const status = record.status;

            return (
              <TableRow
                key={student.id}
                className={cn(
                  statusRowTint(status),
                  index % 2 === 1 && "bg-muted/15"
                )}
              >
                <TableCell
                  className={cn(
                    "sticky left-0 z-10 bg-card font-medium",
                    index % 2 === 1 && "bg-muted/15"
                  )}
                >
                  <Link
                    to={`/students/${student.id}`}
                    className="text-sm transition-colors hover:text-primary"
                  >
                    {getStudentDisplayName(student)}
                  </Link>
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    <span className="text-xs text-muted-foreground">
                      {studentTaskStatusLabel[status]}
                    </span>
                  ) : (
                    <Select
                      value={status}
                      onValueChange={(v) => onTaskStatusChange(record.id, v as StudentTaskStatus)}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-8 w-full min-w-[7rem] text-xs",
                          studentTaskStatusSelectClass(status)
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STUDENT_TASK_STATUS_ORDER.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {studentTaskStatusLabel[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                {criteria.map((c) => (
                  <TableCell key={c.id} className="p-2 text-center align-middle">
                    <RubricCriterionCell
                      task={task}
                      record={record}
                      criterion={c}
                      readOnly={readOnly}
                      onScoreUpdate={onTaskScoreUpdate}
                    />
                  </TableCell>
                ))}
                <TableCell className="text-center align-middle">
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {formatRecordScore(task, record)}
                  </span>
                </TableCell>
                <TableCell className="text-right align-middle">
                  {!readOnly && onOpenProgress && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      title="Feedback and details"
                      onClick={() => onOpenProgress(record, task)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
