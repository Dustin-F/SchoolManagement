import { useState } from "react";
import {
  Archive,
  ChevronDown,
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import type { ClassTask, StudentTaskRecord } from "@/types";
import { isTaskOverdue, taskProgressForEnrolled } from "@/lib/taskUtils";

interface ClassTasksSectionProps {
  classId: string;
  activeTasks: ClassTask[];
  archivedTasks: ClassTask[];
  studentTaskRecords: StudentTaskRecord[];
  enrolledStudentIds: string[];
  onEditTask: (task: ClassTask) => void;
  onDeleteTask: (task: ClassTask) => void;
  onArchiveTask: (id: string) => void;
  onUnarchiveTask: (id: string) => void;
  onNewTask: () => void;
}

export function ClassTasksSection({
  activeTasks,
  archivedTasks,
  studentTaskRecords,
  enrolledStudentIds,
  onEditTask,
  onDeleteTask,
  onArchiveTask,
  onUnarchiveTask,
  onNewTask,
}: ClassTasksSectionProps) {
  const [archivedSectionOpen, setArchivedSectionOpen] = useState(false);
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <Card id="section-class-tasks" className="scroll-mt-6">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-muted-foreground" /> Class tasks
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and edit assignments. Progress is updated in the table above.
          </p>
        </div>
        <Button size="sm" onClick={onNewTask}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> New task
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeTasks.length === 0 && archivedTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks yet. Add one to show rows for every student above.</p>
        ) : activeTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active tasks. Expand archived below or create a new task.</p>
        ) : null}

        {activeTasks.length > 0 && (
          <div className="space-y-2">
            {activeTasks.map((task) => {
              const overdue = isTaskOverdue(task, todayStr);
              const { completed, missing, avgScore } = taskProgressForEnrolled(
                task,
                studentTaskRecords,
                enrolledStudentIds
              );

              return (
                <div
                  key={task.id}
                  className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border bg-muted/10 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{task.title}</span>
                      <Badge variant="outline" className="capitalize text-xs">
                        {task.type}
                      </Badge>
                      {overdue && (
                        <Badge variant="destructive" className="text-xs">
                          Overdue
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Due {formatDate(task.deadline)}
                      {task.maxScore != null && ` · Max ${task.maxScore}`}
                      {" · "}
                      {completed} done · {missing} missing
                      {avgScore != null && ` · Avg ${avgScore}`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      title="Archive task"
                      onClick={() => onArchiveTask(task.id)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => onEditTask(task)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDeleteTask(task)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {archivedTasks.length > 0 && (
          <div className="rounded-lg border border-dashed border-border bg-muted/20">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/40 rounded-t-lg"
              onClick={() => setArchivedSectionOpen((o) => !o)}
            >
              <span className="flex items-center gap-2">
                <Archive className="h-4 w-4 text-muted-foreground" />
                Archived tasks ({archivedTasks.length})
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  archivedSectionOpen && "rotate-180"
                )}
              />
            </button>
            {archivedSectionOpen && (
              <div className="space-y-2 border-t border-border px-3 py-3">
                <p className="text-xs text-muted-foreground">
                  Archived tasks stay in history but are hidden from the student table above.
                </p>
                {archivedTasks.map((task) => {
                  const { completed, missing, avgScore } = taskProgressForEnrolled(
                    task,
                    studentTaskRecords,
                    enrolledStudentIds
                  );

                  return (
                    <div
                      key={task.id}
                      className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between rounded-md border border-border bg-background/80 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-muted-foreground">{task.title}</span>
                          <Badge variant="secondary" className="capitalize text-xs">
                            {task.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Due {formatDate(task.deadline)}
                          {task.maxScore != null && ` · Max ${task.maxScore}`}
                          {" · "}
                          {completed} done · {missing} missing
                          {avgScore != null && ` · Avg ${avgScore}`}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="Restore to active"
                          onClick={() => onUnarchiveTask(task.id)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => onEditTask(task)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => onDeleteTask(task)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

