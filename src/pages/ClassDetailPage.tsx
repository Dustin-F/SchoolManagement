import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  GraduationCap,
  Clock,
  Plus,
  UserPlus,
  ChevronDown,
  Check,
  X,
  Shield,
  Sparkles,
  MoreHorizontal,
  Play,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/store";
import { getStudentDisplayName, getTeacherDisplayName } from "@/lib/displayHelpers";
import { cn, DAY_SHORT, DAY_ORDER, getLocalToday, isIsoDateString } from "@/lib/utils";
import {
  STUDENT_TASK_STATUS_ORDER,
  studentTaskStatusLabel,
  studentTaskStatusSelectClass,
} from "@/lib/studentTaskStatus";
import { deadlineDay, isTaskOverdue } from "@/lib/taskUtils";
import { AddExistingStudentDialog } from "@/features/classes/AddExistingStudentDialog";
import { StudentFormDialog } from "@/features/students/StudentFormDialog";
import { StudentImportDialog } from "@/features/students/StudentImportDialog";
import { ClassTaskFormDialog } from "@/features/tasks/ClassTaskFormDialog";
import { TaskProgressDialog } from "@/features/tasks/TaskProgressDialog";
import { ClassPointsPanel } from "@/features/points/ClassPointsPanel";
import { StudentRosterTable } from "@/features/classes/StudentRosterTable";
import { ClassTasksSection } from "@/features/classes/ClassTasksSection";
import type {
  AttendanceStatus,
  ClassTask,
  StudentTaskRecord,
  StudentTaskStatus,
} from "@/types";
import { pointsByStudent } from "@/lib/pointsUtils";

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const classes = useAppStore((s) => s.classes);
  const students = useAppStore((s) => s.students);
  const teachers = useAppStore((s) => s.teachers);
  const subjects = useAppStore((s) => s.subjects);
  const classTasks = useAppStore((s) => s.classTasks);
  const studentTaskRecords = useAppStore((s) => s.studentTaskRecords);
  const attendance = useAppStore((s) => s.attendance);
  const pointEvents = useAppStore((s) => s.pointEvents);
  const addAttendance = useAppStore((s) => s.addAttendance);
  const updateAttendance = useAppStore((s) => s.updateAttendance);
  const updateStudentTaskRecord = useAppStore((s) => s.updateStudentTaskRecord);
  const deleteClassTask = useAppStore((s) => s.deleteClassTask);
  const archiveClassTask = useAppStore((s) => s.archiveClassTask);
  const unarchiveClassTask = useAppStore((s) => s.unarchiveClassTask);

  const [addExistingOpen, setAddExistingOpen] = useState(false);
  const [createStudentOpen, setCreateStudentOpen] = useState(false);
  const [importStudentsOpen, setImportStudentsOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ClassTask | null>(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<ClassTask | null>(null);
  const [progressRecord, setProgressRecord] = useState<StudentTaskRecord | null>(null);
  const [progressStudentName, setProgressStudentName] = useState("");
  const [progressTaskTitle, setProgressTaskTitle] = useState("");
  const [progressMaxScore, setProgressMaxScore] = useState<number | null | undefined>();
  const [randomPickerOpen, setRandomPickerOpen] = useState(false);
  const [randomStudentId, setRandomStudentId] = useState<string | null>(null);
  const [randomCycleShownIds, setRandomCycleShownIds] = useState<string[]>([]);
  const [quickAttendance, setQuickAttendance] = useState<AttendanceStatus | null>(null);
  const [quickTaskUpdates, setQuickTaskUpdates] = useState<
    Record<string, { recordId: string; status: StudentTaskStatus; score: string }>
  >({});

  const todayStr = getLocalToday();
  const [attendanceDate, setAttendanceDate] = useState(() =>
    isIsoDateString(dateParam) ? dateParam : todayStr
  );

  useEffect(() => {
    if (isIsoDateString(dateParam)) {
      setAttendanceDate(dateParam);
    }
  }, [dateParam]);

  const setAttendanceDateWithUrl = useCallback(
    (value: string) => {
      setAttendanceDate(value);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (isIsoDateString(value)) {
            next.set("date", value);
          } else {
            next.delete("date");
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const cls = classes.find((c) => c.id === id);

  const activeTasksForClass = useMemo(
    () =>
      classTasks
        .filter((t) => t.classId === cls?.id && !t.archived)
        .sort((a, b) => deadlineDay(a.deadline).localeCompare(deadlineDay(b.deadline))),
    [classTasks, cls?.id]
  );

  const archivedTasksForClass = useMemo(
    () =>
      classTasks
        .filter((t) => t.classId === cls?.id && t.archived)
        .sort((a, b) => deadlineDay(a.deadline).localeCompare(deadlineDay(b.deadline))),
    [classTasks, cls?.id]
  );

  const dayAttendanceRows = useMemo(
    () => attendance.filter((a) => a.classId === cls?.id && a.date === attendanceDate),
    [attendance, cls?.id, attendanceDate]
  );

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

  const mainTeacher = teachers.find((t) => t.id === (cls?.teacherId ?? ""));
  const coTeachers = teachers.filter((t) => (cls?.coTeacherIds ?? []).includes(t.id));
  const classStudents = useMemo(() => {
    const set = new Set(cls?.studentIds ?? []);
    return students
      .filter((s) => set.has(s.id))
      .sort((a, b) => getStudentDisplayName(a).localeCompare(getStudentDisplayName(b)));
  }, [students, cls?.studentIds]);

  const pointsTodayByStudent = useMemo(() => {
    if (!cls?.id) return new Map<string, number>();
    const todayEvents = pointEvents.filter(
      (e) => e.classId === cls.id && e.date === attendanceDate
    );
    return pointsByStudent(todayEvents, classStudents.map((s) => s.id));
  }, [pointEvents, cls?.id, attendanceDate, classStudents]);

  const pointsLeaderboard = useMemo(() => {
    return classStudents
      .map((s) => ({
        id: s.id,
        name: getStudentDisplayName(s),
        points: pointsTodayByStudent.get(s.id) ?? 0,
      }))
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  }, [classStudents, pointsTodayByStudent]);
  const subject = subjects.find((s) => s.id === (cls?.subjectId ?? ""));
  const sortedSchedule = [...(cls?.schedule ?? [])].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)
  );

  const markAttendance = useCallback(
    (studentId: string, status: AttendanceStatus) => {
      const existing = dayAttendanceRows.find((a) => a.studentId === studentId);
      if (existing) {
        updateAttendance(existing.id, { status });
      } else {
        addAttendance({
          studentId,
          classId: cls?.id ?? "",
          date: attendanceDate,
          status,
        });
      }
    },
    [dayAttendanceRows, updateAttendance, addAttendance, cls?.id, attendanceDate]
  );

  const onTaskStatusChange = useCallback(
    (recordId: string, status: StudentTaskStatus) => {
      updateStudentTaskRecord(recordId, { status });
    },
    [updateStudentTaskRecord]
  );

  const onTaskScoreBlur = useCallback(
    (record: StudentTaskRecord, raw: string) => {
      const t = raw.trim();
      const next = t === "" ? null : Number(t);
      if (next !== record.score && (t === "" || Number.isFinite(next))) {
        updateStudentTaskRecord(record.id, { score: next });
      }
    },
    [updateStudentTaskRecord]
  );

  const openProgress = (record: StudentTaskRecord, task: ClassTask) => {
    const st = students.find((s) => s.id === record.studentId);
    setProgressStudentName(st ? getStudentDisplayName(st) : "Student");
    setProgressTaskTitle(task.title);
    setProgressMaxScore(task.maxScore);
    setProgressRecord(record);
  };

  const pickRandomStudentId = (ids: string[]) => {
    if (ids.length === 0) return null;
    const idx = Math.floor(Math.random() * ids.length);
    return ids[idx] ?? null;
  };

  const setupQuickPickerState = (studentId: string) => {
    setQuickAttendance(getAttendanceStatus(studentId));
    const updates: Record<string, { recordId: string; status: StudentTaskStatus; score: string }> = {};
    for (const task of activeTasksForClass) {
      const rec = getTaskRecord(task.id, studentId);
      if (!rec) continue;
      updates[task.id] = {
        recordId: rec.id,
        status: rec.status,
        score: rec.score != null ? String(rec.score) : "",
      };
    }
    setQuickTaskUpdates(updates);
  };

  const openRandomStudentPicker = () => {
    const nextId = pickRandomStudentId(classStudents.map((s) => s.id));
    if (!nextId) {
      toast.info("No students in this class yet.");
      return;
    }
    setRandomCycleShownIds([nextId]);
    setRandomStudentId(nextId);
    setupQuickPickerState(nextId);
    setRandomPickerOpen(true);
  };

  const saveQuickUpdates = () => {
    if (!randomStudentId) return;
    if (quickAttendance) {
      markAttendance(randomStudentId, quickAttendance);
    }
    Object.values(quickTaskUpdates).forEach((u) => {
      const trimmed = u.score.trim();
      const score = trimmed === "" ? null : Number(trimmed);
      updateStudentTaskRecord(u.recordId, {
        status: u.status,
        score: trimmed === "" || Number.isFinite(score) ? score : null,
      });
    });
    toast.success("Quick updates saved.");
  };

  const saveAndPickNextStudent = () => {
    if (!randomStudentId) return;
    saveQuickUpdates();
    const allIds = classStudents.map((s) => s.id);
    const nextShown = randomCycleShownIds.includes(randomStudentId)
      ? randomCycleShownIds
      : [...randomCycleShownIds, randomStudentId];
    const remaining = allIds.filter((id) => !nextShown.includes(id));

    if (remaining.length === 0) {
      toast.success("Cycle complete. Starting a new random cycle.");
      const restartPool = allIds.filter((id) => id !== randomStudentId);
      const restartId = pickRandomStudentId(restartPool.length > 0 ? restartPool : allIds);
      if (!restartId) {
        setRandomPickerOpen(false);
        return;
      }
      setRandomCycleShownIds([restartId]);
      setRandomStudentId(restartId);
      setupQuickPickerState(restartId);
      return;
    }

    const nextId = pickRandomStudentId(remaining);
    if (!nextId) return;
    setRandomCycleShownIds([...nextShown, nextId]);
    setRandomStudentId(nextId);
    setupQuickPickerState(nextId);
  };

  const handleDeleteTask = () => {
    if (deleteTaskTarget) {
      deleteClassTask(deleteTaskTarget.id);
      toast.success("Task deleted.");
      setDeleteTaskTarget(null);
    }
  };

  if (!cls) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-muted-foreground">Class not found.</p>
        <Button variant="link" onClick={() => navigate("/classes")}>
          Back to Classes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/classes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold">{cls.name}</h2>
            {(cls.classroomNumber || subject) && (
              <p className="text-sm text-muted-foreground">
                {cls.classroomNumber && <span>Room {cls.classroomNumber}</span>}
                {cls.classroomNumber && subject && <span aria-hidden> · </span>}
                {subject && <span>{subject.name}</span>}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <Link to={`/attendance?classId=${cls.id}`} className="hover:text-primary hover:underline">
                Full attendance page
              </Link>
              <span aria-hidden className="text-border">·</span>
              <Link to={`/points?classId=${cls.id}`} className="hover:text-primary hover:underline">
                Points history
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <GraduationCap className="h-4 w-4" /> Main teacher
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">
              {mainTeacher ? getTeacherDisplayName(mainTeacher) : "Unassigned"}
            </p>
            {mainTeacher?.email && <p className="text-sm text-muted-foreground">{mainTeacher.email}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" /> Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{classStudents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" /> Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedSchedule.length === 0 ? (
              <p className="text-sm text-muted-foreground">No times set.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 text-xs">
                {sortedSchedule.map((entry) => (
                  <span
                    key={entry.id}
                    className="rounded-md border border-border bg-muted/40 px-2 py-1"
                  >
                    {DAY_SHORT[entry.dayOfWeek]} {entry.startTime}–{entry.endTime}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {coTeachers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Co-teachers</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {coTeachers.map((t) => (
              <Badge key={t.id} variant="outline">
                {getTeacherDisplayName(t)}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <ClassPointsPanel cls={cls} students={classStudents} sessionDate={attendanceDate} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quick class check</CardTitle>
          <p className="text-sm text-muted-foreground">
            Random student picker for attendance and task updates. Use Class points above for merits.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            onClick={() => openRandomStudentPicker()}
            disabled={classStudents.length === 0}
            title="Random student attendance and task updates"
          >
            <Play className="mr-1.5 h-4 w-4" />
            Random student check
          </Button>
          <Button asChild type="button" variant="outline">
            <Link to={`/points?classId=${cls.id}`}>
              <Sparkles className="mr-1.5 h-4 w-4" />
              Points history
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-muted-foreground" />
              Students
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Mark attendance and task progress for students in this class.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="class-attendance-date" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Attendance date
              </label>
              <DatePicker
                id="class-attendance-date"
                value={attendanceDate}
                onChange={setAttendanceDateWithUrl}
                className="h-9 w-44"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  More
                  <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/attendance?classId=${cls.id}`}>
                    <Clock className="mr-2 h-4 w-4" />
                    Full attendance page
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/points?classId=${cls.id}`}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Points history
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAddExistingOpen(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  Add existing student
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCreateStudentOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create new student
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setImportStudentsOpen(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  Import students from Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Attendance: ✓ present · ✗ absent · clock late · shield excused. Tasks: set status and points; use ··· for feedback and dates.
            Today column shows net points for the selected date (use Class points above to award).
          </p>
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
            <StudentRosterTable
              students={classStudents}
              activeTasks={activeTasksForClass}
              studentTaskRecords={studentTaskRecords}
              dayAttendanceRows={dayAttendanceRows}
              pointsTodayByStudent={pointsTodayByStudent}
              onMarkAttendance={markAttendance}
              onTaskStatusChange={onTaskStatusChange}
              onTaskScoreBlur={onTaskScoreBlur}
              onOpenProgress={openProgress}
              archivedTaskCount={archivedTasksForClass.length}
            />
          </div>

          <div className="md:hidden space-y-3">
            {classStudents.map((student) => {
              const pts = pointsTodayByStudent.get(student.id) ?? 0;
              const currentAttendanceStatus = getAttendanceStatus(student.id);

              return (
                <div key={student.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  {/* Section 1 — header */}
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      to={`/students/${student.id}`}
                      className="font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {getStudentDisplayName(student)}
                    </Link>

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

                  {/* Section 2 — attendance */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Attendance</p>
                    <div className="flex flex-wrap gap-1.5">
                      {attendanceStatuses.map((status) => {
                        const Icon = AttendanceIcon[status];
                        const active = currentAttendanceStatus === status;

                        return (
                          <button
                            key={status}
                            type="button"
                            title={status}
                            onClick={() => markAttendance(student.id, status)}
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
                  </div>

                  {/* Section 3 — tasks */}
                  {activeTasksForClass.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Tasks</p>
                      <div className="space-y-2">
                        {activeTasksForClass.map((task) => {
                          const rec = getTaskRecord(task.id, student.id);
                          const overdue = isTaskOverdue(task, todayStr);

                          if (!rec) {
                            return (
                              <div
                                key={task.id}
                                className="rounded-lg border border-border/80 bg-muted/20 px-2 py-1.5 text-xs text-muted-foreground"
                              >
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
                                <p
                                  className="truncate text-xs font-medium text-foreground"
                                  title={task.title}
                                >
                                  {task.title}
                                  {overdue && (
                                    <span className="ml-1 text-red-600 dark:text-red-400">(due)</span>
                                  )}
                                </p>
                              </div>

                              <Select
                                value={rec.status}
                                onValueChange={(v) =>
                                  onTaskStatusChange(rec.id, v as StudentTaskStatus)
                                }
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
                                onClick={() => openProgress(rec, task)}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <ClassTasksSection
        classId={cls.id}
        activeTasks={activeTasksForClass}
        archivedTasks={archivedTasksForClass}
        studentTaskRecords={studentTaskRecords}
        enrolledStudentIds={cls.studentIds}
        onEditTask={(task) => {
          setEditingTask(task);
          setTaskFormOpen(true);
        }}
        onDeleteTask={(task) => setDeleteTaskTarget(task)}
        onArchiveTask={(id) => {
          archiveClassTask(id);
          toast.success("Task archived.");
        }}
        onUnarchiveTask={(id) => {
          unarchiveClassTask(id);
          toast.success("Task restored.");
        }}
        onNewTask={() => {
          setEditingTask(null);
          setTaskFormOpen(true);
        }}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Award className="h-4 w-4" /> Points today
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pointsLeaderboard.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students yet.</p>
          ) : (
            <div className="space-y-2">
              {pointsLeaderboard.slice(0, 10).map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{row.name}</span>
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-xs font-semibold",
                      row.points > 0 && "bg-emerald-100 text-emerald-800",
                      row.points < 0 && "bg-red-100 text-red-800",
                      row.points === 0 && "bg-muted text-muted-foreground"
                    )}
                  >
                    {row.points > 0 ? `+${row.points}` : row.points}
                  </span>
                </div>
              ))}
              {pointsLeaderboard.length > 10 && (
                <p className="text-xs text-muted-foreground">
                  Showing top 10 for {attendanceDate}.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AddExistingStudentDialog
        open={addExistingOpen}
        onOpenChange={setAddExistingOpen}
        classId={cls.id}
        enrolledStudentIds={cls.studentIds}
      />

      <StudentFormDialog
        open={createStudentOpen}
        onOpenChange={setCreateStudentOpen}
        defaultClassIds={[cls.id]}
        lockEnrollment
      />
      <StudentImportDialog
        open={importStudentsOpen}
        onOpenChange={setImportStudentsOpen}
        targetClassId={cls.id}
        lockToClass
      />

      <ClassTaskFormDialog
        open={taskFormOpen}
        onOpenChange={(o) => {
          setTaskFormOpen(o);
          if (!o) setEditingTask(null);
        }}
        classId={cls.id}
        editingTask={editingTask}
      />

      <TaskProgressDialog
        open={!!progressRecord}
        onOpenChange={(o) => {
          if (!o) setProgressRecord(null);
        }}
        record={progressRecord}
        studentName={progressStudentName}
        taskTitle={progressTaskTitle}
        maxScore={progressMaxScore}
      />

      <Dialog
        open={randomPickerOpen}
        onOpenChange={(open) => {
          setRandomPickerOpen(open);
          if (!open) {
            setRandomStudentId(null);
            setRandomCycleShownIds([]);
            setQuickTaskUpdates({});
            setQuickAttendance(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Random student picker</DialogTitle>
            <DialogDescription>
              Quick attendance and assignment updates. Save and move to the next random student.
            </DialogDescription>
            <p className="text-xs text-muted-foreground">
              Progress this cycle: {randomCycleShownIds.length} / {classStudents.length}
            </p>
          </DialogHeader>

          {(() => {
            const current = classStudents.find((s) => s.id === randomStudentId);
            if (!current) {
              return <p className="text-sm text-muted-foreground">No student selected.</p>;
            }

            return (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="font-semibold text-foreground">
                    {getStudentDisplayName(current)}
                  </p>
                  <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    {current.dateOfBirth && <p>DOB: {current.dateOfBirth}</p>}
                    {current.parentName && <p>Parent: {current.parentName}</p>}
                    {current.parentPhone && <p>Phone: {current.parentPhone}</p>}
                  </div>
                </div>

                <>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Attendance</p>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setQuickAttendance(null)}
                          className={cn(
                            "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                            quickAttendance === null
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground hover:bg-muted"
                          )}
                        >
                          Not marked
                        </button>
                        {attendanceStatuses.map((status) => {
                          const Icon = AttendanceIcon[status];
                          const active = quickAttendance === status;
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setQuickAttendance(status)}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium capitalize transition-colors",
                                active
                                  ? `${attendanceBtnClass[status]} border-transparent`
                                  : "border-border bg-background text-muted-foreground hover:bg-muted"
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {status}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Assignments / homework</p>
                      {activeTasksForClass.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No active tasks for this class.</p>
                      ) : (
                        <div className="space-y-2">
                          {activeTasksForClass.map((task) => {
                            const update = quickTaskUpdates[task.id];
                            if (!update) {
                              return (
                                <div
                                  key={task.id}
                                  className="rounded-md border border-border/80 bg-muted/20 px-2 py-1.5 text-xs text-muted-foreground"
                                >
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
                                  </p>
                                </div>
                                <Select
                                  value={update.status}
                                  onValueChange={(v) =>
                                    setQuickTaskUpdates((prev) => ({
                                      ...prev,
                                      [task.id]: { ...prev[task.id], status: v as StudentTaskStatus },
                                    }))
                                  }
                                >
                                  <SelectTrigger
                                    className={cn(
                                      "h-8 w-37 shrink-0 text-xs",
                                      studentTaskStatusSelectClass(update.status)
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
                                  type="number"
                                  step={0.5}
                                  placeholder="Pts"
                                  className="h-8 w-16 text-xs"
                                  value={update.score}
                                  title={task.maxScore != null ? `Max ${task.maxScore}` : "Score"}
                                  onChange={(e) =>
                                    setQuickTaskUpdates((prev) => ({
                                      ...prev,
                                      [task.id]: { ...prev[task.id], score: e.target.value },
                                    }))
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                </>
              </div>
            );
          })()}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRandomPickerOpen(false)}
            >
              Close
            </Button>
            <Button type="button" variant="outline" onClick={saveQuickUpdates}>
              Save
            </Button>
            <Button type="button" onClick={saveAndPickNextStudent}>
              Save & next student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTaskTarget} onOpenChange={(open) => !open && setDeleteTaskTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{deleteTaskTarget?.title}"? Student progress for this task will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
