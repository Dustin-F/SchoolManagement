import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  ChevronRight,
  ClipboardList,
  Clock,
  Shield,
  X,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";
import type {
  AttendanceRecord,
  AttendanceStatus,
  ClassTask,
  SchoolClass,
  Student,
  StudentTaskRecord,
  StudentTaskStatus,
} from "@/types";
import { ClassPointsToolbar } from "@/features/points/ClassPointsToolbar";
import { StudentTasksSheet } from "@/features/classes/StudentTasksSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";
import { ATTENDANCE_STATUS_COLORS, getPersonInitials, getStudentDisplayName } from "@/lib/displayHelpers";
import {
  STUDENT_TASK_STATUS_ORDER,
  studentTaskStatusLabel,
  studentTaskStatusSelectClass,
} from "@/lib/studentTaskStatus";
import { isTaskOverdue } from "@/lib/taskUtils";

type RosterViewMode = "lesson" | "full";

const attendanceStatuses: AttendanceStatus[] = ["present", "absent", "late", "excused"];

const attendanceBtnClass: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-800 ring-emerald-500",
  absent: "bg-red-100 text-red-800 ring-red-500",
  late: "bg-amber-100 text-amber-900 ring-amber-500",
  excused: "bg-blue-100 text-blue-900 ring-blue-500",
};

const AttendanceIcon: Record<AttendanceStatus, typeof Check> = {
  present: Check,
  absent: X,
  late: Clock,
  excused: Shield,
};

interface StudentRosterTableProps {
  cls: SchoolClass;
  sessionDate: string;
  students: Student[];
  activeTasks: ClassTask[];
  studentTaskRecords: StudentTaskRecord[];
  dayAttendanceRows: AttendanceRecord[];
  pointsTodayByStudent: Map<string, number>;
  onMarkAttendance: (studentId: string, status: AttendanceStatus) => void;
  onTaskStatusChange: (recordId: string, status: StudentTaskStatus) => void;
  onTaskScoreBlur: (record: StudentTaskRecord, raw: string) => void;
  onOpenProgress: (record: StudentTaskRecord, task: ClassTask) => void;
  archivedTaskCount: number;
}

export function StudentRosterTable({
  cls,
  sessionDate,
  students,
  activeTasks,
  studentTaskRecords,
  dayAttendanceRows,
  pointsTodayByStudent,
  onMarkAttendance,
  onTaskStatusChange,
  onTaskScoreBlur,
  onOpenProgress,
  archivedTaskCount,
}: StudentRosterTableProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [viewMode, setViewMode] = useState<RosterViewMode>("lesson");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    students[0]?.id ?? null
  );
  const [tasksSheetStudentId, setTasksSheetStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (students.length === 0) {
      setSelectedStudentId(null);
      return;
    }
    if (!selectedStudentId || !students.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  const recordByTaskAndStudent = useMemo(() => {
    const map = new Map<string, StudentTaskRecord>();
    for (const r of studentTaskRecords) {
      map.set(`${r.taskId}:${r.studentId}`, r);
    }
    return map;
  }, [studentTaskRecords]);

  const getTaskRecord = (taskId: string, studentId: string) =>
    recordByTaskAndStudent.get(`${taskId}:${studentId}`);

  const getAttendanceStatus = (studentId: string): AttendanceStatus | null => {
    const record = dayAttendanceRows.find((a) => a.studentId === studentId);
    return record ? record.status : null;
  };

  const getTaskSummary = (studentId: string) => {
    if (activeTasks.length === 0) return null;
    let completed = 0;
    let overdue = 0;
    for (const task of activeTasks) {
      const rec = getTaskRecord(task.id, studentId);
      if (!rec) continue;
      if (rec.status === "completed") completed++;
      if (isTaskOverdue(task, todayStr) && rec.status !== "completed") overdue++;
    }
    return { total: activeTasks.length, completed, overdue };
  };

  const tasksSheetStudent = students.find((s) => s.id === tasksSheetStudentId) ?? null;

  const openTasksSheet = (studentId: string) => {
    setTasksSheetStudentId(studentId);
  };

  const renderPointsBadge = (pts: number, className?: string) => (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-semibold tabular-nums",
        pts > 0 && "text-emerald-600 dark:text-emerald-400",
        pts < 0 && "text-amber-600 dark:text-amber-400",
        pts === 0 && "text-muted-foreground",
        className
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {pts > 0 ? `+${pts}` : pts}
    </span>
  );

  const renderStudentIdentity = (student: Student, selected: boolean) => (
    <div className="flex items-center gap-3 min-w-0">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        )}
      >
        {getPersonInitials(student)}
      </span>
      <div className="min-w-0">
        <Link
          to={`/students/${student.id}`}
          className="font-semibold text-foreground hover:text-primary truncate block"
          onClick={(e) => e.stopPropagation()}
        >
          {getStudentDisplayName(student)}
        </Link>
        {viewMode === "full" && student.parentPhone && (
          <p className="mt-0.5 text-xs text-muted-foreground">{student.parentPhone}</p>
        )}
      </div>
    </div>
  );

  const renderAttendanceChip = (student: Student) => {
    const current = getAttendanceStatus(student.id);
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-8 min-w-[5.5rem] capitalize",
              current && ATTENDANCE_STATUS_COLORS[current]
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {current ?? "Mark"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
          {attendanceStatuses.map((status) => {
            const Icon = AttendanceIcon[status];
            return (
              <DropdownMenuItem
                key={status}
                className="capitalize gap-2"
                onClick={() => onMarkAttendance(student.id, status)}
              >
                <Icon className="h-4 w-4" />
                {status}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderTaskSummaryButton = (student: Student) => {
    const summary = getTaskSummary(student.id);
    if (!summary) {
      return (
        <span className="text-xs text-muted-foreground">
          {archivedTaskCount > 0 ? "Tasks archived" : "No tasks"}
        </span>
      );
    }
    const label =
      summary.overdue > 0
        ? `${summary.overdue} overdue`
        : `${summary.completed}/${summary.total} done`;

    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "h-8 gap-1",
          summary.overdue > 0 && "border-red-200 text-red-700 dark:border-red-900 dark:text-red-400"
        )}
        onClick={(e) => {
          e.stopPropagation();
          openTasksSheet(student.id);
        }}
      >
        <ClipboardList className="h-3.5 w-3.5" />
        {label}
        <ChevronRight className="h-3.5 w-3.5 opacity-60" />
      </Button>
    );
  };

  const renderAttendanceCell = (student: Student) => {
    const current = getAttendanceStatus(student.id);
    return (
      <div className="flex flex-wrap gap-1">
        {attendanceStatuses.map((status) => {
          const Icon = AttendanceIcon[status];
          const active = current === status;
          return (
            <button
              key={status}
              type="button"
              title={status}
              onClick={() => onMarkAttendance(student.id, status)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-xs font-semibold transition-all",
                active
                  ? `${attendanceBtnClass[status]} ring-2 ring-offset-1 ring-offset-background`
                  : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>
    );
  };

  const renderTaskControls = (student: Student) => {
    if (activeTasks.length === 0) {
      return (
        <span className="text-xs text-muted-foreground">
          {archivedTaskCount > 0
            ? "All tasks are archived. Expand “Archived tasks” below to restore."
            : "Add tasks in the section below."}
        </span>
      );
    }

    return (
      <div className="flex flex-col gap-2 min-w-[220px] max-w-md">
        {activeTasks.map((task) => {
          const rec = getTaskRecord(task.id, student.id);
          const overdue = isTaskOverdue(task, todayStr);

          if (!rec) {
            return (
              <div key={task.id} className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{task.title}</span> — syncing…
              </div>
            );
          }

          return (
            <div
              key={task.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border/80 bg-muted/20 px-2 py-1.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground" title={task.title}>
                  {task.title}
                  {overdue && <span className="ml-1 text-red-600 dark:text-red-400">(due)</span>}
                </p>
              </div>

              <Select
                value={rec.status}
                onValueChange={(v) => onTaskStatusChange(rec.id, v as StudentTaskStatus)}
              >
                <SelectTrigger
                  className={cn(
                    "h-8 w-37 shrink-0 text-xs",
                    studentTaskStatusSelectClass(rec.status)
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

              <Input
                key={`${rec.id}-${rec.updatedAt}`}
                type="number"
                step={0.5}
                placeholder="Pts"
                className="h-8 w-16 text-xs"
                defaultValue={rec.score != null ? String(rec.score) : ""}
                title={task.maxScore != null ? `Max ${task.maxScore}` : "Score"}
                onBlur={(e) => onTaskScoreBlur(rec, e.target.value)}
              />

              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                title="Feedback, submitted date, full edit"
                onClick={() => onOpenProgress(rec, task)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderViewToggle = () => (
    <div className="mb-3 flex rounded-lg border border-border bg-muted/30 p-1">
      <Button
        type="button"
        variant={viewMode === "lesson" ? "default" : "ghost"}
        size="sm"
        className="flex-1 h-8"
        onClick={() => setViewMode("lesson")}
      >
        Lesson
      </Button>
      <Button
        type="button"
        variant={viewMode === "full" ? "default" : "ghost"}
        size="sm"
        className="flex-1 h-8"
        onClick={() => setViewMode("full")}
      >
        Tasks &amp; grades
      </Button>
    </div>
  );

  const renderLessonDesktopRow = (student: Student) => {
    const pts = pointsTodayByStudent.get(student.id) ?? 0;
    const selected = selectedStudentId === student.id;
    return (
      <TableRow
        key={student.id}
        className={cn(
          "cursor-pointer transition-colors",
          selected && "bg-primary/5 hover:bg-primary/10"
        )}
        onClick={() => setSelectedStudentId(student.id)}
      >
        <TableCell>{renderStudentIdentity(student, selected)}</TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>{renderAttendanceChip(student)}</TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>{renderTaskSummaryButton(student)}</TableCell>
        <TableCell className="text-right">{renderPointsBadge(pts)}</TableCell>
      </TableRow>
    );
  };

  const renderFullDesktopRow = (student: Student) => {
    const pts = pointsTodayByStudent.get(student.id) ?? 0;
    const selected = selectedStudentId === student.id;
    return (
      <TableRow
        key={student.id}
        className={cn(
          "cursor-pointer align-top transition-colors",
          selected && "bg-primary/5 hover:bg-primary/10"
        )}
        onClick={() => setSelectedStudentId(student.id)}
      >
        <TableCell>{renderStudentIdentity(student, selected)}</TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>{renderAttendanceCell(student)}</TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>{renderTaskControls(student)}</TableCell>
        <TableCell className="text-right">{renderPointsBadge(pts)}</TableCell>
      </TableRow>
    );
  };

  const renderLessonMobileCard = (student: Student) => {
    const pts = pointsTodayByStudent.get(student.id) ?? 0;
    const selected = selectedStudentId === student.id;
    return (
      <div
        key={student.id}
        role="button"
        tabIndex={0}
        onClick={() => setSelectedStudentId(student.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSelectedStudentId(student.id);
          }
        }}
        className={cn(
          "rounded-xl border p-3 transition-colors",
          selected
            ? "border-primary bg-primary/5 ring-2 ring-primary/25"
            : "border-border bg-card"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          {renderStudentIdentity(student, selected)}
          {renderPointsBadge(pts, "shrink-0 rounded-md border border-border px-2 py-1")}
        </div>
        <div
          className="mt-3 flex flex-wrap items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {renderAttendanceChip(student)}
          {renderTaskSummaryButton(student)}
        </div>
      </div>
    );
  };

  const renderFullMobileCard = (student: Student) => {
    const pts = pointsTodayByStudent.get(student.id) ?? 0;
    const selected = selectedStudentId === student.id;
    return (
      <div
        key={student.id}
        role="button"
        tabIndex={0}
        onClick={() => setSelectedStudentId(student.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSelectedStudentId(student.id);
          }
        }}
        className={cn(
          "rounded-xl border bg-card p-4 space-y-3 transition-colors",
          selected
            ? "border-primary bg-primary/5 ring-2 ring-primary/25"
            : "border-border"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          {renderStudentIdentity(student, selected)}
          {renderPointsBadge(pts, "shrink-0 rounded-md border border-border px-2 py-1")}
        </div>
        <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
          <p className="text-xs text-muted-foreground">Attendance</p>
          {renderAttendanceCell(student)}
        </div>
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          {activeTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {archivedTaskCount > 0
                ? "All tasks are archived. Expand “Archived tasks” below to restore."
                : "Add tasks in the section below."}
            </p>
          ) : (
            activeTasks.map((task) => {
              const rec = getTaskRecord(task.id, student.id);
              const overdue = isTaskOverdue(task, todayStr);
              if (!rec) {
                return (
                  <div
                    key={task.id}
                    className="rounded-lg border border-border/70 bg-muted/10 p-2 text-xs text-muted-foreground"
                  >
                    <span className="font-medium text-foreground">{task.title}</span> — syncing…
                  </div>
                );
              }
              return (
                <div
                  key={task.id}
                  className="flex flex-col gap-2 rounded-lg border border-border/80 bg-muted/20 p-2.5"
                >
                  <p className="truncate text-xs font-medium text-foreground" title={task.title}>
                    {task.title}
                    {overdue && <span className="ml-1 text-red-600 dark:text-red-400">(due)</span>}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={rec.status}
                      onValueChange={(v) => onTaskStatusChange(rec.id, v as StudentTaskStatus)}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-8 w-37 shrink-0 text-xs",
                          studentTaskStatusSelectClass(rec.status)
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
                    <Input
                      key={`${rec.id}-${rec.updatedAt}`}
                      type="number"
                      step={0.5}
                      placeholder="Pts"
                      className="h-8 w-16 text-xs"
                      defaultValue={rec.score != null ? String(rec.score) : ""}
                      onBlur={(e) => onTaskScoreBlur(rec, e.target.value)}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={() => onOpenProgress(rec, task)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students yet. Add someone to start tracking.</p>
      ) : (
        <>
          <div className="sticky top-16 z-20 -mx-6 border-y border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/90">
            <ClassPointsToolbar
              cls={cls}
              students={students}
              sessionDate={sessionDate}
              selectedStudentId={selectedStudentId}
            />
          </div>

          {renderViewToggle()}

          <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-[180px]">Student</TableHead>
                  <TableHead className="min-w-[120px]">Attendance</TableHead>
                  <TableHead className={viewMode === "full" ? "min-w-[280px]" : "min-w-[140px]"}>
                    Tasks
                  </TableHead>
                  <TableHead className="min-w-[72px] text-right">Today</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) =>
                  viewMode === "lesson"
                    ? renderLessonDesktopRow(student)
                    : renderFullDesktopRow(student)
                )}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3">
            {students.map((student) =>
              viewMode === "lesson"
                ? renderLessonMobileCard(student)
                : renderFullMobileCard(student)
            )}
          </div>
        </>
      )}

      <StudentTasksSheet
        open={tasksSheetStudentId !== null}
        onOpenChange={(open) => {
          if (!open) setTasksSheetStudentId(null);
        }}
        student={tasksSheetStudent}
        activeTasks={activeTasks}
        getTaskRecord={getTaskRecord}
        onTaskStatusChange={onTaskStatusChange}
        onTaskScoreBlur={onTaskScoreBlur}
        onOpenProgress={onOpenProgress}
        todayStr={todayStr}
      />
    </div>
  );
}
