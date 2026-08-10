import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Archive, ChevronDown, ClipboardList, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRecordScore } from "@/lib/taskScoringUtils";
import { deadlineDay, isTaskOverdue } from "@/lib/taskUtils";
import { studentTaskStatusBadgeClass, studentTaskStatusLabel } from "@/lib/studentTaskStatus";
import type { ClassTask, SchoolClass, StudentTaskRecord } from "@/types";
import { cn, formatDate } from "@/lib/utils";

type TaskRow = {
  task: ClassTask;
  record: StudentTaskRecord;
  cls: SchoolClass;
};

interface StudentTasksSectionProps {
  taskRows: TaskRow[];
  todayStr: string;
  onSelectTask?: (row: TaskRow) => void;
}

export function StudentTasksSection({
  taskRows,
  todayStr,
  onSelectTask,
}: StudentTasksSectionProps) {
  const [archivedOpen, setArchivedOpen] = useState(false);

  const activeRows = useMemo(() => taskRows.filter((r) => !r.task.archived), [taskRows]);
  const archivedRows = useMemo(() => taskRows.filter((r) => r.task.archived), [taskRows]);

  const summary = useMemo(() => {
    const missing = activeRows.filter((r) => r.record.status === "missing").length;
    const overdue = activeRows.filter((r) => isTaskOverdue(r.task, todayStr)).length;
    return { missing, overdue };
  }, [activeRows, todayStr]);

  const sortedActive = useMemo(
    () =>
      [...activeRows].sort((a, b) =>
        deadlineDay(a.task.deadline).localeCompare(deadlineDay(b.task.deadline))
      ),
    [activeRows]
  );

  const sortedArchived = useMemo(
    () =>
      [...archivedRows].sort((a, b) =>
        deadlineDay(b.task.deadline).localeCompare(deadlineDay(a.task.deadline))
      ),
    [archivedRows]
  );

  if (taskRows.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
            Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No assignments yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
            Assignments
            {activeRows.length > 0 && (
              <Badge variant="secondary" className="font-normal tabular-nums">
                {activeRows.length} active
              </Badge>
            )}
          </CardTitle>
          {(summary.missing > 0 || summary.overdue > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {summary.missing > 0 && (
                <Badge variant="outline" className="text-xs">
                  {summary.missing} missing
                </Badge>
              )}
              {summary.overdue > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {summary.overdue} overdue
                </Badge>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {onSelectTask
            ? "Click a row to view or update this student’s work on that task."
            : "Summary only — open a class task to grade or update status."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedActive.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active assignments.</p>
        ) : (
          <TaskTable rows={sortedActive} todayStr={todayStr} onSelectTask={onSelectTask} />
        )}

        {sortedArchived.length > 0 && (
          <div className="rounded-lg border border-dashed border-border">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/40"
              onClick={() => setArchivedOpen((o) => !o)}
            >
              <span className="flex items-center gap-2 text-muted-foreground">
                <Archive className="h-4 w-4" />
                Archived ({sortedArchived.length})
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  archivedOpen && "rotate-180"
                )}
              />
            </button>
            {archivedOpen && (
              <div className="border-t border-border px-1 pb-1 pt-0">
                <TaskTable
                  rows={sortedArchived}
                  todayStr={todayStr}
                  muted
                  onSelectTask={onSelectTask}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TaskTable({
  rows,
  todayStr,
  muted = false,
  onSelectTask,
}: {
  rows: TaskRow[];
  todayStr: string;
  muted?: boolean;
  onSelectTask?: (row: TaskRow) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="min-w-[5rem]">Class</TableHead>
            <TableHead className="min-w-[10rem]">Task</TableHead>
            <TableHead className="min-w-[6rem]">Due</TableHead>
            <TableHead className="min-w-[6rem]">Status</TableHead>
            <TableHead className="min-w-[4rem] text-right">Score</TableHead>
            {onSelectTask && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const { task, record, cls } = row;
            const overdue = !task.archived && isTaskOverdue(task, todayStr);
            const score = formatRecordScore(task, record);

            return (
              <TableRow
                key={record.id}
                className={cn(
                  muted && "text-muted-foreground",
                  onSelectTask && "cursor-pointer hover:bg-muted/40"
                )}
                onClick={onSelectTask ? () => onSelectTask(row) : undefined}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Link
                    to={`/classes/${cls.id}?tab=tasks`}
                    className="text-xs font-medium hover:text-primary"
                  >
                    {cls.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "text-sm",
                      muted ? "text-muted-foreground" : "font-medium text-foreground"
                    )}
                  >
                    {task.title}
                  </span>
                  {overdue && (
                    <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">
                      Overdue
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs tabular-nums">{formatDate(task.deadline)}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("text-xs font-normal", studentTaskStatusBadgeClass(record.status))}
                  >
                    {studentTaskStatusLabel[record.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-sm font-semibold tabular-nums">
                  {score}
                </TableCell>
                {onSelectTask && (
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      title="Open class grade page"
                      asChild
                    >
                      <Link to={`/classes/${cls.id}/tasks/${task.id}/grade`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
