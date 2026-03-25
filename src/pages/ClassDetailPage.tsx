import { useState, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  StickyNote,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useAppStore } from "@/store";
import { cn, DAY_SHORT, DAY_ORDER } from "@/lib/utils";
import {
  STUDENT_TASK_STATUS_ORDER,
  studentTaskStatusLabel,
  studentTaskStatusSelectClass,
} from "@/lib/studentTaskStatus";
import { deadlineDay, isTaskOverdue } from "@/lib/taskUtils";
import { AddExistingStudentDialog } from "@/features/classes/AddExistingStudentDialog";
import { StudentFormDialog } from "@/features/students/StudentFormDialog";
import { ClassTaskFormDialog } from "@/features/tasks/ClassTaskFormDialog";
import { TaskProgressDialog } from "@/features/tasks/TaskProgressDialog";
import { BehaviourFormDialog } from "@/features/behaviour/BehaviourFormDialog";
import { ClassStudentBehaviourListDialog } from "@/features/behaviour/ClassStudentBehaviourListDialog";
import { StudentRosterTable } from "@/features/classes/StudentRosterTable";
import { ClassTasksSection } from "@/features/classes/ClassTasksSection";
import type {
  AttendanceStatus,
  BehaviourRecord,
  ClassTask,
  StudentTaskRecord,
  StudentTaskStatus,
} from "@/types";

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const classes = useAppStore((s) => s.classes);
  const students = useAppStore((s) => s.students);
  const teachers = useAppStore((s) => s.teachers);
  const subjects = useAppStore((s) => s.subjects);
  const classTasks = useAppStore((s) => s.classTasks);
  const studentTaskRecords = useAppStore((s) => s.studentTaskRecords);
  const attendance = useAppStore((s) => s.attendance);
  const behaviour = useAppStore((s) => s.behaviour);
  const addAttendance = useAppStore((s) => s.addAttendance);
  const updateAttendance = useAppStore((s) => s.updateAttendance);
  const updateStudentTaskRecord = useAppStore((s) => s.updateStudentTaskRecord);
  const deleteClassTask = useAppStore((s) => s.deleteClassTask);
  const archiveClassTask = useAppStore((s) => s.archiveClassTask);
  const unarchiveClassTask = useAppStore((s) => s.unarchiveClassTask);

  const [addExistingOpen, setAddExistingOpen] = useState(false);
  const [createStudentOpen, setCreateStudentOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ClassTask | null>(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<ClassTask | null>(null);
  const [progressRecord, setProgressRecord] = useState<StudentTaskRecord | null>(null);
  const [progressStudentName, setProgressStudentName] = useState("");
  const [progressTaskTitle, setProgressTaskTitle] = useState("");
  const [progressMaxScore, setProgressMaxScore] = useState<number | null | undefined>();
  const [behaviourOpen, setBehaviourOpen] = useState(false);
  const [behaviourStudentId, setBehaviourStudentId] = useState<string | undefined>();
  const [behaviourEditingRecord, setBehaviourEditingRecord] = useState<BehaviourRecord | null>(null);
  const [behaviourListOpen, setBehaviourListOpen] = useState(false);
  const [behaviourListStudentId, setBehaviourListStudentId] = useState<string | undefined>();

  const todayStr = new Date().toISOString().split("T")[0];
  const [attendanceDate, setAttendanceDate] = useState(todayStr);

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

  const behaviourNoteCountByStudent = useMemo(() => {
    const map = new Map<string, number>();
    if (!cls?.id) return map;
    for (const b of behaviour) {
      if (b.classId !== cls.id) continue;
      map.set(b.studentId, (map.get(b.studentId) ?? 0) + 1);
    }
    return map;
  }, [behaviour, cls?.id]);

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

  const behaviourListStudentName = useMemo(() => {
    if (!behaviourListStudentId) return "";
    const s = students.find((x) => x.id === behaviourListStudentId);
    return s ? `${s.firstName} ${s.lastName}` : "Student";
  }, [behaviourListStudentId, students]);

  const mainTeacher = teachers.find((t) => t.id === (cls?.teacherId ?? ""));
  const coTeachers = teachers.filter((t) => (cls?.coTeacherIds ?? []).includes(t.id));
  const classStudents = useMemo(() => {
    const set = new Set(cls?.studentIds ?? []);
    return students
      .filter((s) => set.has(s.id))
      .sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
      );
  }, [students, cls?.studentIds]);
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
    setProgressStudentName(st ? `${st.firstName} ${st.lastName}` : "Student");
    setProgressTaskTitle(task.title);
    setProgressMaxScore(task.maxScore);
    setProgressRecord(record);
  };

  const openBehaviourForStudent = (studentId: string) => {
    setBehaviourEditingRecord(null);
    setBehaviourStudentId(studentId);
    setBehaviourOpen(true);
  };

  const openBehaviourListForStudent = (studentId: string) => {
    setBehaviourListStudentId(studentId);
    setBehaviourListOpen(true);
  };

  const handleBehaviourOpenChange = (open: boolean) => {
    setBehaviourOpen(open);
    if (!open) {
      setBehaviourStudentId(undefined);
      setBehaviourEditingRecord(null);
    }
  };

  const handleBehaviourListOpenChange = (open: boolean) => {
    setBehaviourListOpen(open);
    if (!open) setBehaviourListStudentId(undefined);
  };

  const handleAddNoteFromList = (studentId: string) => {
    openBehaviourForStudent(studentId);
  };

  const handleEditNoteFromList = (record: BehaviourRecord) => {
    setBehaviourEditingRecord(record);
    setBehaviourStudentId(record.studentId);
    setBehaviourOpen(true);
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
            {subject && <p className="text-sm text-muted-foreground">{subject.name}</p>}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <Link to={`/attendance?classId=${cls.id}`} className="hover:text-primary hover:underline">
                Full attendance page
              </Link>
              <span aria-hidden className="text-border">·</span>
              <Link to={`/behaviour?classId=${cls.id}`} className="hover:text-primary hover:underline">
                All behaviour notes
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
              {mainTeacher ? `${mainTeacher.firstName} ${mainTeacher.lastName}` : "Unassigned"}
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
                {t.firstName} {t.lastName}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-muted-foreground" />
              Students — attendance, tasks & notes
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              One place to mark attendance for a chosen day, update each assignment, and log behaviour.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="class-attendance-date" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Attendance date
              </label>
              <Input
                id="class-attendance-date"
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="h-9 w-[11rem]"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  Add student
                  <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setAddExistingOpen(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  Add existing student
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCreateStudentOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create new student
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Attendance: ✓ present · ✗ absent · clock late · shield excused. Tasks: set status and points; use ··· for feedback and dates.
            Notes: one button opens the list for this class (badge = count); use Add note there to create a new entry.
          </p>
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
            <StudentRosterTable
              students={classStudents}
              activeTasks={activeTasksForClass}
              studentTaskRecords={studentTaskRecords}
              attendanceDate={attendanceDate}
              dayAttendanceRows={dayAttendanceRows}
              behaviourNoteCountByStudent={behaviourNoteCountByStudent}
              onMarkAttendance={markAttendance}
              onTaskStatusChange={onTaskStatusChange}
              onTaskScoreBlur={onTaskScoreBlur}
              onOpenProgress={openProgress}
              onOpenBehaviourList={openBehaviourListForStudent}
              archivedTaskCount={archivedTasksForClass.length}
              classId={cls.id}
            />
          </div>

          <div className="md:hidden space-y-3">
            {classStudents.map((student) => {
              const noteCount = behaviourNoteCountByStudent.get(student.id) ?? 0;
              const currentAttendanceStatus = getAttendanceStatus(student.id);

              return (
                <div key={student.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  {/* Section 1 — header */}
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      to={`/students/${student.id}`}
                      className="font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {student.firstName} {student.lastName}
                    </Link>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 px-2.5"
                      onClick={() => openBehaviourListForStudent(student.id)}
                      title="View notes for this class or add a new one"
                    >
                      <StickyNote className="h-3.5 w-3.5 shrink-0" />
                      <span>Notes</span>
                      {noteCount > 0 && (
                        <Badge
                          variant="secondary"
                          className="rounded-sm px-1.5 text-[10px] tabular-nums"
                        >
                          {noteCount}
                        </Badge>
                      )}
                    </Button>
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
                                    "h-8 w-[9.25rem] shrink-0 text-xs",
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

      <ClassStudentBehaviourListDialog
        open={behaviourListOpen}
        onOpenChange={handleBehaviourListOpenChange}
        classId={cls.id}
        studentId={behaviourListStudentId}
        studentName={behaviourListStudentName}
        onAddNote={handleAddNoteFromList}
        onEditNote={handleEditNoteFromList}
      />

      <BehaviourFormDialog
        open={behaviourOpen}
        onOpenChange={handleBehaviourOpenChange}
        editingRecord={behaviourEditingRecord}
        preselectedStudentId={behaviourStudentId}
        preselectedClassId={cls.id}
        preselectedSubjectId={cls.subjectId || undefined}
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
