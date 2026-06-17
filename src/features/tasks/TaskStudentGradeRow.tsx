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
import { TableCell, TableRow } from "@/components/ui/table";
import { TaskScoreInput, type TaskScoreUpdate } from "@/features/tasks/TaskScoreInput";
import { getStudentDisplayName } from "@/lib/displayHelpers";
import {
  STUDENT_TASK_STATUS_ORDER,
  studentTaskStatusLabel,
  studentTaskStatusSelectClass,
} from "@/lib/studentTaskStatus";
import { formatRecordScore } from "@/lib/taskScoringUtils";
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

interface TaskStudentGradeRowProps {
  student: Student;
  task: ClassTask;
  record: StudentTaskRecord | undefined;
  readOnly?: boolean;
  onTaskStatusChange: (recordId: string, status: StudentTaskStatus) => void;
  onTaskScoreUpdate: (record: StudentTaskRecord, update: TaskScoreUpdate) => void;
  onOpenProgress?: (record: StudentTaskRecord, task: ClassTask) => void;
}

export function TaskStudentGradeRow({
  student,
  task,
  record,
  readOnly = false,
  onTaskStatusChange,
  onTaskScoreUpdate,
  onOpenProgress,
}: TaskStudentGradeRowProps) {
  if (!record) {
    return (
      <TableRow>
        <TableCell className="font-medium">
          <Link to={`/students/${student.id}`} className="hover:text-primary">
            {getStudentDisplayName(student)}
          </Link>
        </TableCell>
        <TableCell colSpan={3} className="text-sm text-muted-foreground">
          Syncing…
        </TableCell>
      </TableRow>
    );
  }

  const status = record.status;

  return (
    <TableRow className={cn(statusRowTint(status))}>
      <TableCell className="font-medium">
        <Link to={`/students/${student.id}`} className="hover:text-primary">
          {getStudentDisplayName(student)}
        </Link>
      </TableCell>
      <TableCell>
        {readOnly ? (
          <span className="text-sm capitalize text-muted-foreground">
            {studentTaskStatusLabel[status]}
          </span>
        ) : (
          <Select
            value={status}
            onValueChange={(v) => onTaskStatusChange(record.id, v as StudentTaskStatus)}
          >
            <SelectTrigger
              className={cn("h-9 w-full min-w-[8.5rem] text-xs", studentTaskStatusSelectClass(status))}
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
      <TableCell>
        {readOnly ? (
          <span className="text-sm font-semibold tabular-nums">
            {formatRecordScore(task, record)}
          </span>
        ) : (
          <TaskScoreInput
            task={task}
            record={record}
            compact
            onScoreUpdate={onTaskScoreUpdate}
          />
        )}
      </TableCell>
      <TableCell className="text-right">
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
}
