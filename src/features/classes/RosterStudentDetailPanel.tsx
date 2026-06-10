import { Link } from "react-router-dom";
import { Check, Clock, MoreHorizontal, Shield, Sparkles, X } from "lucide-react";
import type {
  AttendanceStatus,
  ClassTask,
  Student,
  StudentTaskRecord,
  StudentTaskStatus,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getPersonInitials, getStudentDisplayName, getStudentSeatNames } from "@/lib/displayHelpers";
import {
  STUDENT_TASK_STATUS_ORDER,
  studentTaskStatusLabel,
  studentTaskStatusSelectClass,
} from "@/lib/studentTaskStatus";
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

interface RosterStudentDetailPanelProps {
  student: Student;
  pointsToday: number;
  attendanceStatus: AttendanceStatus | null;
  activeTasks: ClassTask[];
  getTaskRecord: (taskId: string, studentId: string) => StudentTaskRecord | undefined;
  archivedTaskCount: number;
  todayStr: string;
  onMarkAttendance: (status: AttendanceStatus) => void;
  onTaskStatusChange: (recordId: string, status: StudentTaskStatus) => void;
  onTaskScoreBlur: (record: StudentTaskRecord, raw: string) => void;
  onOpenProgress: (record: StudentTaskRecord, task: ClassTask) => void;
  /** Show english / pinyin / chinese lines like seating cards. */
  showSeatNames?: boolean;
  variant?: "panel" | "dialog";
  className?: string;
}

function PointsBadge({ pts, className }: { pts: number; className?: string }) {
  return (
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
}

function StudentIdentity({
  student,
  showSeatNames,
}: {
  student: Student;
  showSeatNames?: boolean;
}) {
  const seatNames = getStudentSeatNames(student);

  if (showSeatNames) {
    return (
      <div className="flex items-start gap-3 min-w-0">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {getPersonInitials(student)}
        </span>
        <div className="min-w-0 space-y-0.5">
          {seatNames.english ? (
            <Link
              to={`/students/${student.id}`}
              className="block text-sm font-semibold text-foreground hover:text-primary"
            >
              {seatNames.english}
            </Link>
          ) : (
            <Link
              to={`/students/${student.id}`}
              className="block text-sm font-semibold text-foreground hover:text-primary"
            >
              {getStudentDisplayName(student)}
            </Link>
          )}
          {seatNames.pinyin && (
            <p className="text-xs text-muted-foreground">{seatNames.pinyin}</p>
          )}
          {seatNames.chinese && <p className="text-xs text-foreground">{seatNames.chinese}</p>}
          {student.parentPhone && (
            <p className="text-xs text-muted-foreground">{student.parentPhone}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
        {getPersonInitials(student)}
      </span>
      <div className="min-w-0">
        <Link
          to={`/students/${student.id}`}
          className="font-semibold text-foreground hover:text-primary truncate block"
        >
          {getStudentDisplayName(student)}
        </Link>
        {student.parentPhone && (
          <p className="mt-0.5 text-xs text-muted-foreground">{student.parentPhone}</p>
        )}
      </div>
    </div>
  );
}

function AttendanceButtons({
  current,
  onMark,
}: {
  current: AttendanceStatus | null;
  onMark: (status: AttendanceStatus) => void;
}) {
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
            onClick={() => onMark(status)}
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
}

function TaskControls({
  student,
  activeTasks,
  getTaskRecord,
  archivedTaskCount,
  todayStr,
  onTaskStatusChange,
  onTaskScoreBlur,
  onOpenProgress,
}: {
  student: Student;
  activeTasks: ClassTask[];
  getTaskRecord: (taskId: string, studentId: string) => StudentTaskRecord | undefined;
  archivedTaskCount: number;
  todayStr: string;
  onTaskStatusChange: (recordId: string, status: StudentTaskStatus) => void;
  onTaskScoreBlur: (record: StudentTaskRecord, raw: string) => void;
  onOpenProgress: (record: StudentTaskRecord, task: ClassTask) => void;
}) {
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
    <div className="flex flex-col gap-2">
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
                className={cn("h-8 w-37 shrink-0 text-xs", studentTaskStatusSelectClass(rec.status))}
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
}

export function RosterStudentDetailPanel({
  student,
  pointsToday,
  attendanceStatus,
  activeTasks,
  getTaskRecord,
  archivedTaskCount,
  todayStr,
  onMarkAttendance,
  onTaskStatusChange,
  onTaskScoreBlur,
  onOpenProgress,
  showSeatNames,
  variant = "panel",
  className,
}: RosterStudentDetailPanelProps) {
  return (
    <div
      className={cn(
        variant === "panel" && "rounded-xl border border-primary/30 bg-card p-4 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <StudentIdentity student={student} showSeatNames={showSeatNames} />
        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
          <span className="text-xs text-muted-foreground">Points today</span>
          <PointsBadge pts={pointsToday} className="rounded-md border border-border px-2 py-1" />
        </div>
      </div>

      <div
        className={cn(
          "mt-4 grid gap-4",
          variant === "panel" ? "md:grid-cols-2" : "grid-cols-1"
        )}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Attendance</p>
          <AttendanceButtons current={attendanceStatus} onMark={onMarkAttendance} />
        </div>
        <div className="space-y-1.5 md:col-span-1">
          <p className="text-xs font-medium text-muted-foreground">Tasks &amp; grades</p>
          <TaskControls
            student={student}
            activeTasks={activeTasks}
            getTaskRecord={getTaskRecord}
            archivedTaskCount={archivedTaskCount}
            todayStr={todayStr}
            onTaskStatusChange={onTaskStatusChange}
            onTaskScoreBlur={onTaskScoreBlur}
            onOpenProgress={onOpenProgress}
          />
        </div>
      </div>
    </div>
  );
}

/** Table / inline list fragments (desktop list view). */
export function RosterStudentIdentity({
  student,
  selected,
}: {
  student: Student;
  selected: boolean;
}) {
  return (
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
        {student.parentPhone && (
          <p className="mt-0.5 text-xs text-muted-foreground">{student.parentPhone}</p>
        )}
      </div>
    </div>
  );
}

export function RosterAttendanceButtons({
  current,
  onMark,
}: {
  current: AttendanceStatus | null;
  onMark: (status: AttendanceStatus) => void;
}) {
  return <AttendanceButtons current={current} onMark={onMark} />;
}

export function RosterTaskControls(props: {
  student: Student;
  activeTasks: ClassTask[];
  getTaskRecord: (taskId: string, studentId: string) => StudentTaskRecord | undefined;
  archivedTaskCount: number;
  todayStr: string;
  onTaskStatusChange: (recordId: string, status: StudentTaskStatus) => void;
  onTaskScoreBlur: (record: StudentTaskRecord, raw: string) => void;
  onOpenProgress: (record: StudentTaskRecord, task: ClassTask) => void;
}) {
  return <TaskControls {...props} />;
}

export function RosterPointsBadge({ pts, className }: { pts: number; className?: string }) {
  return <PointsBadge pts={pts} className={className} />;
}
