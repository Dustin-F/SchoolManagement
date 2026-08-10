import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Archive,
  ChevronDown,
  ClipboardList,
  ClipboardPen,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatDate, getLocalToday } from "@/lib/utils";
import type { ClassTask, StudentTaskRecord } from "@/types";
import { formatTaskListProgress, isTaskOverdue } from "@/lib/taskUtils";
import { filterTasksByTerm, termLabel } from "@/lib/assessmentUtils";
import { AssessmentRoleBadge } from "@/features/assessment/AssessmentRoleBadge";
import { TermFilterSelect } from "@/features/assessment/TermFilterSelect";
import { useAppStore } from "@/store";

interface ClassTasksSectionProps {
  classId: string;
  activeTasks: ClassTask[];
  archivedTasks: ClassTask[];
  studentTaskRecords: StudentTaskRecord[];
  enrolledStudentIds: string[];
  onDeleteTask: (task: ClassTask) => void;
  onArchiveTask: (id: string) => void;
  onUnarchiveTask: (id: string) => void;
  readOnly?: boolean;
}

export function ClassTasksSection({
  activeTasks,
  archivedTasks,
  studentTaskRecords,
  enrolledStudentIds,
  classId,
  onDeleteTask,
  onArchiveTask,
  onUnarchiveTask,
  readOnly = false,
}: ClassTasksSectionProps) {
  const [archivedSectionOpen, setArchivedSectionOpen] = useState(false);
  const [termFilter, setTermFilter] = useState("all");
  const academicTerms = useAppStore((s) => s.academicTerms);
  const taskAssessmentCategories = useAppStore((s) => s.taskAssessmentCategories);
  const todayStr = getLocalToday();

  const categoryName = (categoryId?: string) =>
    taskAssessmentCategories.find((c) => c.id === categoryId)?.name;

  const termName = (termId?: string) => {
    const term = academicTerms.find((t) => t.id === termId);
    return term ? term.name : null;
  };

  const filteredActive = useMemo(
    () => filterTasksByTerm(activeTasks, termFilter),
    [activeTasks, termFilter]
  );
  const filteredArchived = useMemo(
    () => filterTasksByTerm(archivedTasks, termFilter),
    [archivedTasks, termFilter]
  );

  return (
    <Card id="section-class-tasks" className="scroll-mt-6">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-muted-foreground" /> Tasks
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a task to mark students one assignment at a time.
          </p>
        </div>
        {!readOnly && (
          <Button size="sm" asChild>
            <Link to={`/classes/${classId}/tasks/new`}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New task
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {academicTerms.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <TermFilterSelect
              terms={academicTerms}
              value={termFilter}
              onChange={setTermFilter}
              className="h-8 w-[12rem] text-xs"
            />
            {termFilter !== "all" && (
              <span className="text-xs text-muted-foreground">
                {termLabel(academicTerms.find((t) => t.id === termFilter)!)}
              </span>
            )}
          </div>
        )}
        {filteredActive.length === 0 && filteredArchived.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tasks yet. Create one to start tracking homework and assessments.
          </p>
        ) : filteredActive.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active tasks for this term. Expand archived below or create a new task.
          </p>
        ) : null}

        {filteredActive.length > 0 && (
          <div className="space-y-2">
            {filteredActive.map((task) => {
              const overdue = isTaskOverdue(task, todayStr);
              const progress = formatTaskListProgress(task, studentTaskRecords, enrolledStudentIds);

              return (
                <div
                  key={task.id}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border bg-muted/10 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{task.title}</span>
                      <Badge variant="outline" className="capitalize text-xs">
                        {task.type}
                      </Badge>
                      <AssessmentRoleBadge role={task.assessmentRole} />
                      {overdue && (
                        <Badge variant="destructive" className="text-xs">
                          Overdue
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Due {formatDate(task.deadline)} · {progress}
                      {termName(task.termId) && <> · {termName(task.termId)}</>}
                      {task.assessmentRole !== "formative" && categoryName(task.categoryId) && (
                        <> · {categoryName(task.categoryId)}</>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="default" asChild>
                      <Link to={`/classes/${classId}/tasks/${task.id}/grade`}>
                        <ClipboardPen className="mr-1.5 h-3.5 w-3.5" />
                        Grade
                      </Link>
                    </Button>
                    {!readOnly && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            aria-label="Task options"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/classes/${classId}/tasks/${task.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit task
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onArchiveTask(task.id)}>
                            <Archive className="mr-2 h-4 w-4" />
                            Archive task
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDeleteTask(task)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete task
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredArchived.length > 0 && (
          <div className="rounded-lg border border-dashed border-border bg-muted/20">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/40 rounded-t-lg"
              onClick={() => setArchivedSectionOpen((o) => !o)}
            >
              <span className="flex items-center gap-2">
                <Archive className="h-4 w-4 text-muted-foreground" />
                Archived tasks ({filteredArchived.length})
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
                {filteredArchived.map((task) => {
                  const progress = formatTaskListProgress(task, studentTaskRecords, enrolledStudentIds);

                  return (
                    <div
                      key={task.id}
                      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-md border border-border bg-background/80 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-muted-foreground">{task.title}</span>
                          <Badge variant="secondary" className="capitalize text-xs">
                            {task.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Due {formatDate(task.deadline)} · {progress}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/classes/${classId}/tasks/${task.id}/grade`}>View grades</Link>
                        </Button>
                        {!readOnly && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                aria-label="Task options"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onUnarchiveTask(task.id)}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Restore task
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onDeleteTask(task)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
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
