import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Clock,
  Shield,
  X,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";
import type { AttendanceRecord, AttendanceStatus, ClassTask, Student, StudentTaskRecord, StudentTaskStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { getStudentDisplayName } from "@/lib/displayHelpers";
import { STUDENT_TASK_STATUS_ORDER, studentTaskStatusLabel, studentTaskStatusSelectClass } from "@/lib/studentTaskStatus";
import { isTaskOverdue } from "@/lib/taskUtils";

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

  const renderAttendanceButtonsGrid = (student: Student) => {
    const current = getAttendanceStatus(student.id);
    return (
      <div className="grid grid-cols-2 gap-1.5">
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

  const renderMobileTaskRow = (student: Student, task: ClassTask) => {
    const rec = getTaskRecord(task.id, student.id);
    const overdue = isTaskOverdue(task, todayStr);

    if (!rec) {
      return (
        <div className="rounded-lg border border-border/70 bg-muted/10 p-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{task.title}</span> — syncing…
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border/80 bg-muted/20 p-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground" title={task.title}>
            {task.title}
            {overdue && <span className="ml-1 text-red-600 dark:text-red-400">(due)</span>}
          </p>
        </div>
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
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students yet. Add someone to start tracking.</p>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <div className="rounded-xl border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[140px] whitespace-nowrap">Student</TableHead>
                    <TableHead className="min-w-[200px] whitespace-nowrap">Attendance</TableHead>
                    <TableHead className="min-w-[280px]">Tasks</TableHead>
                    <TableHead className="min-w-[88px] whitespace-nowrap text-right">Today</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const pts = pointsTodayByStudent.get(student.id) ?? 0;
                    return (
                      <TableRow key={student.id} className="align-top">
                        <TableCell>
                          <Link
                            to={`/students/${student.id}`}
                            className="font-semibold text-foreground hover:text-primary"
                          >
                            {getStudentDisplayName(student)}
                          </Link>
                          {student.parentPhone && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {student.parentPhone}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>{renderAttendanceCell(student)}</TableCell>
                        <TableCell>{renderTaskControls(student)}</TableCell>
                        <TableCell className="text-right">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-sm font-semibold tabular-nums",
                              pts > 0 && "text-emerald-600",
                              pts < 0 && "text-amber-600",
                              pts === 0 && "text-muted-foreground"
                            )}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            {pts > 0 ? `+${pts}` : pts}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {students.map((student) => {
              const pts = pointsTodayByStudent.get(student.id) ?? 0;
              return (
                <div
                  key={student.id}
                  className="rounded-xl border border-border bg-card p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/students/${student.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {getStudentDisplayName(student)}
                      </Link>
                      {student.parentPhone && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {student.parentPhone}
                        </p>
                      )}
                    </div>

                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-sm font-semibold tabular-nums",
                        pts > 0 && "text-emerald-600",
                        pts < 0 && "text-amber-600",
                        pts === 0 && "text-muted-foreground"
                      )}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {pts > 0 ? `+${pts}` : pts}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Attendance</p>
                    {renderAttendanceButtonsGrid(student)}
                  </div>

                  <div className="space-y-2">
                    {activeTasks.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {archivedTaskCount > 0
                          ? "All tasks are archived. Expand “Archived tasks” below to restore."
                          : "Add tasks in the section below."}
                      </p>
                    ) : (
                      activeTasks.map((task) => renderMobileTaskRow(student, task))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

