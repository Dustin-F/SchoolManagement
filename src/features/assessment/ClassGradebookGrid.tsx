import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Grid3x3, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TermFilterSelect } from "@/features/assessment/TermFilterSelect";
import { AssessmentRoleBadge } from "@/features/assessment/AssessmentRoleBadge";
import { getStudentDisplayName } from "@/lib/displayHelpers";
import { studentProfilePath } from "@/lib/studentNavigation";
import { filterTasksByTerm, getActiveTerm } from "@/lib/assessmentUtils";
import { formatRecordScore } from "@/lib/taskScoringUtils";
import { deadlineDay } from "@/lib/taskUtils";
import { useAppStore } from "@/store";
import type { SchoolClass, StudentTaskRecord } from "@/types";
import { cn } from "@/lib/utils";

interface ClassGradebookGridProps {
  cls: SchoolClass;
  readOnly?: boolean;
}

export function ClassGradebookGrid({ cls, readOnly = false }: ClassGradebookGridProps) {
  const students = useAppStore((s) => s.students);
  const classTasks = useAppStore((s) => s.classTasks);
  const studentTaskRecords = useAppStore((s) => s.studentTaskRecords);
  const academicTerms = useAppStore((s) => s.academicTerms);
  const setTaskPublished = useAppStore((s) => s.setTaskPublished);

  const activeTerm = getActiveTerm(academicTerms);
  const [termFilter, setTermFilter] = useState(activeTerm?.id ?? "all");

  const classStudents = useMemo(() => {
    const order = new Map(cls.studentIds.map((id, i) => [id, i]));
    return students
      .filter((s) => order.has(s.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }, [students, cls.studentIds]);

  const gridTasks = useMemo(() => {
    const active = classTasks.filter((t) => t.classId === cls.id && !t.archived);
    const filtered = filterTasksByTerm(active, termFilter);
    return filtered.sort((a, b) => deadlineDay(a.deadline).localeCompare(deadlineDay(b.deadline)));
  }, [classTasks, cls.id, termFilter]);

  const recordMap = useMemo(() => {
    const map = new Map<string, StudentTaskRecord>();
    for (const r of studentTaskRecords) {
      map.set(`${r.taskId}:${r.studentId}`, r);
    }
    return map;
  }, [studentTaskRecords]);

  const togglePublish = (taskId: string, published: boolean) => {
    setTaskPublished(taskId, published);
    toast.success(published ? "Task visible to students." : "Task hidden from students.");
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Grid3x3 className="h-5 w-5 text-muted-foreground" />
            Gradebook
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Student × task grid. Click a score to open full grading, or use the column header.
          </p>
        </div>
        {academicTerms.length > 0 && (
          <TermFilterSelect
            terms={academicTerms}
            value={termFilter}
            onChange={setTermFilter}
            className="h-8 w-[12rem] text-xs"
          />
        )}
      </CardHeader>
      <CardContent>
        {gridTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tasks for this term. Create tasks or change the term filter.
          </p>
        ) : classStudents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add students to start grading.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 min-w-[10rem] bg-background shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                    Student
                  </TableHead>
                  {gridTasks.map((task) => (
                    <TableHead key={task.id} className="min-w-[7rem] max-w-[9rem] align-bottom">
                      <div className="flex flex-col gap-1 pb-1">
                        <Link
                          to={`/classes/${cls.id}/tasks/${task.id}/grade`}
                          className="line-clamp-2 text-xs font-medium leading-tight hover:text-primary"
                          title={task.title}
                        >
                          {task.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-1">
                          <AssessmentRoleBadge role={task.assessmentRole} />
                          {task.publishedToStudents ? (
                            <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                              Live
                            </Badge>
                          ) : null}
                        </div>
                        {!readOnly && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-full justify-start px-1 text-[10px]"
                            onClick={() => togglePublish(task.id, !task.publishedToStudents)}
                          >
                            {task.publishedToStudents ? (
                              <>
                                <EyeOff className="mr-1 h-3 w-3" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Eye className="mr-1 h-3 w-3" />
                                Publish
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {classStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="sticky left-0 z-10 bg-background font-medium shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                      <Link
                        to={studentProfilePath(student.id)}
                        className="hover:text-primary"
                      >
                        {getStudentDisplayName(student)}
                      </Link>
                    </TableCell>
                    {gridTasks.map((task) => {
                      const record = recordMap.get(`${task.id}:${student.id}`);
                      const scoreText = record ? formatRecordScore(task, record) : "—";
                      return (
                        <TableCell key={task.id} className="p-1">
                          <Link
                            to={`/classes/${cls.id}/tasks/${task.id}/grade`}
                            className={cn(
                              "flex min-h-8 items-center justify-center rounded px-1 text-xs tabular-nums transition-colors hover:bg-muted",
                              record?.status === "missing" && "text-destructive",
                              record?.status === "excused" && "text-violet-600 dark:text-violet-400"
                            )}
                            title="Open grading"
                          >
                            {scoreText}
                          </Link>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {gridTasks.length > 0 && !readOnly && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Pencil className="h-3.5 w-3.5" />
            Publish a column when students and parents should see that task and its grades.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
