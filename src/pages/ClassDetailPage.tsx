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
  StickyNote,
  MoreHorizontal,
  Play,
  Award,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
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
  const addBehaviour = useAppStore((s) => s.addBehaviour);
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
  const [behaviourOpen, setBehaviourOpen] = useState(false);
  const [behaviourStudentId, setBehaviourStudentId] = useState<string | undefined>();
  const [behaviourEditingRecord, setBehaviourEditingRecord] = useState<BehaviourRecord | null>(null);
  const [behaviourListOpen, setBehaviourListOpen] = useState(false);
  const [behaviourListStudentId, setBehaviourListStudentId] = useState<string | undefined>();
  const [randomPickerOpen, setRandomPickerOpen] = useState(false);
  const [randomStudentId, setRandomStudentId] = useState<string | null>(null);
  const [randomCycleShownIds, setRandomCycleShownIds] = useState<string[]>([]);
  const [randomMode, setRandomMode] = useState<"updates" | "reward">("updates");
  const [quickAttendance, setQuickAttendance] = useState<AttendanceStatus | null>(null);
  const [quickRewardPoint, setQuickRewardPoint] = useState<1 | -1 | null>(null);
  const [quickRewardNote, setQuickRewardNote] = useState("");
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

  const behaviourNoteCountByStudent = useMemo(() => {
    const map = new Map<string, number>();
    if (!cls?.id) return map;
    for (const b of behaviour) {
      if (b.classId !== cls.id) continue;
      map.set(b.studentId, (map.get(b.studentId) ?? 0) + 1);
    }
    return map;
  }, [behaviour, cls?.id]);

  const rewardPointsByStudent = useMemo(() => {
    const out = new Map<string, number>();
    if (!cls?.id) return out;
    for (const b of behaviour) {
      if (b.classId !== cls.id) continue;
      if (!b.actionTaken?.startsWith("reward_point:")) continue;
      const delta = b.actionTaken.endsWith(":+1") ? 1 : b.actionTaken.endsWith(":-1") ? -1 : 0;
      if (!delta) continue;
      out.set(b.studentId, (out.get(b.studentId) ?? 0) + delta);
    }
    return out;
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
  const negativeBehaviourTemplates = [
    "Sleeping in class",
    "Did not do classwork",
    "Off-task / distracted others",
    "Late to class",
    "Disrespectful language",
  ];
  const positiveBehaviourTemplates = [
    "Excellent participation",
    "Helped classmates",
    "Completed all classwork",
    "Stayed focused and on task",
    "Showed leadership",
  ];

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
    return s ? getStudentDisplayName(s) : "Student";
  }, [behaviourListStudentId, students]);

  const mainTeacher = teachers.find((t) => t.id === (cls?.teacherId ?? ""));
  const coTeachers = teachers.filter((t) => (cls?.coTeacherIds ?? []).includes(t.id));
  const classStudents = useMemo(() => {
    const set = new Set(cls?.studentIds ?? []);
    return students
      .filter((s) => set.has(s.id))
      .sort((a, b) => getStudentDisplayName(a).localeCompare(getStudentDisplayName(b)));
  }, [students, cls?.studentIds]);
  const rewardLeaderboard = useMemo(() => {
    return classStudents
      .map((s) => ({
        id: s.id,
        name: getStudentDisplayName(s),
        points: rewardPointsByStudent.get(s.id) ?? 0,
      }))
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  }, [classStudents, rewardPointsByStudent]);
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

  const openBehaviourForStudent = (studentId: string) => {
    setBehaviourEditingRecord(null);
    setBehaviourStudentId(studentId);
    setBehaviourOpen(true);
  };

  const pickRandomStudentId = (ids: string[]) => {
    if (ids.length === 0) return null;
    const idx = Math.floor(Math.random() * ids.length);
    return ids[idx] ?? null;
  };

  const setupQuickPickerState = (studentId: string) => {
    setQuickAttendance(getAttendanceStatus(studentId));
    setQuickRewardPoint(null);
    setQuickRewardNote("");
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

  const openRandomStudentPicker = (mode: "updates" | "reward" = "updates") => {
    const nextId = pickRandomStudentId(classStudents.map((s) => s.id));
    if (!nextId) {
      toast.info("No students in this class yet.");
      return;
    }
    setRandomMode(mode);
    setRandomCycleShownIds([nextId]);
    setRandomStudentId(nextId);
    setupQuickPickerState(nextId);
    setRandomPickerOpen(true);
  };

  const saveQuickUpdates = () => {
    if (!randomStudentId) return;
    if (randomMode === "reward") {
      if (quickRewardPoint === null) {
        toast.info("Choose +1 or -1 before saving.");
        return;
      }
      const note = quickRewardNote.trim();
      if (!note) {
        toast.info("Add a behaviour note/feedback before saving.");
        return;
      }
      addBehaviour({
        studentId: randomStudentId,
        classId: cls?.id,
        subjectId: cls?.subjectId || undefined,
        date: attendanceDate || todayStr,
        category: quickRewardPoint > 0 ? "participation" : "conduct",
        severity: quickRewardPoint > 0 ? "positive" : "minor",
        description:
          quickRewardPoint > 0
            ? `[Reward +1] ${note}`
            : `[Reward -1] ${note}`,
        actionTaken: `reward_point:${quickRewardPoint > 0 ? "+1" : "-1"}`,
      });
      toast.success("Reward point saved.");
      setQuickRewardPoint(null);
      setQuickRewardNote("");
      return;
    }
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Class Session</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use this sequence: start class, run student checks, then end with behaviour rewards.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            onClick={() => openRandomStudentPicker("updates")}
            disabled={classStudents.length === 0}
            title="Start class with random quick updates"
          >
            <Play className="mr-1.5 h-4 w-4" />
            Start class
          </Button>
          <Button
            variant="outline"
            onClick={() => openRandomStudentPicker("reward")}
            disabled={classStudents.length === 0}
            title="Random end-of-class reward round"
          >
            <Award className="mr-1.5 h-4 w-4" />
            End class rewards
          </Button>
          <Button asChild type="button" variant="outline" title="Open behaviour notes for this class">
            <Link to={`/behaviour?classId=${cls.id}`}>
              <StickyNote className="mr-1.5 h-4 w-4" />
              Behaviour notes
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
              <Input
                id="class-attendance-date"
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDateWithUrl(e.target.value)}
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
                  <Link to={`/behaviour?classId=${cls.id}`}>
                    <StickyNote className="mr-2 h-4 w-4" />
                    All behaviour notes
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
            Notes: one button opens the list for this class (badge = count); use Add note there to create a new entry.
          </p>
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
            <StudentRosterTable
              students={classStudents}
              activeTasks={activeTasksForClass}
              studentTaskRecords={studentTaskRecords}
              dayAttendanceRows={dayAttendanceRows}
              behaviourNoteCountByStudent={behaviourNoteCountByStudent}
              onMarkAttendance={markAttendance}
              onTaskStatusChange={onTaskStatusChange}
              onTaskScoreBlur={onTaskScoreBlur}
              onOpenProgress={openProgress}
              onOpenBehaviourList={openBehaviourListForStudent}
              archivedTaskCount={archivedTasksForClass.length}
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
                      {getStudentDisplayName(student)}
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
            <Award className="h-4 w-4" /> Reward progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rewardLeaderboard.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students yet.</p>
          ) : (
            <div className="space-y-2">
              {rewardLeaderboard.slice(0, 10).map((row) => (
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
              {rewardLeaderboard.length > 10 && (
                <p className="text-xs text-muted-foreground">
                  Showing top 10. Open reward round to keep scoring.
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

      <Dialog
        open={randomPickerOpen}
        onOpenChange={(open) => {
          setRandomPickerOpen(open);
          if (!open) {
            setRandomStudentId(null);
            setRandomCycleShownIds([]);
            setQuickTaskUpdates({});
            setQuickAttendance(null);
            setQuickRewardPoint(null);
            setQuickRewardNote("");
          }
        }}
      >
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Random student picker</DialogTitle>
            <DialogDescription>
              {randomMode === "reward"
                ? "End-of-class reward mode. Give +1 / -1 points and move through the full class cycle."
                : "Quick attendance + assignment update flow. Save and move to the next random student."}
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

                {randomMode === "reward" ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Reward points</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={quickRewardPoint === 1 ? "default" : "outline"}
                        className="gap-1.5"
                        onClick={() => setQuickRewardPoint(1)}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        +1 Positive
                      </Button>
                      <Button
                        type="button"
                        variant={quickRewardPoint === -1 ? "destructive" : "outline"}
                        className="gap-1.5"
                        onClick={() => setQuickRewardPoint(-1)}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        -1 Negative
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Current total: {rewardPointsByStudent.get(current.id) ?? 0}
                    </p>
                    <div className="space-y-1">
                      {quickRewardPoint !== null && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground">
                            Quick options
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {(quickRewardPoint > 0
                              ? positiveBehaviourTemplates
                              : negativeBehaviourTemplates
                            ).map((template) => (
                              <button
                                key={template}
                                type="button"
                                onClick={() => setQuickRewardNote(template)}
                                className={cn(
                                  "rounded-md border px-2 py-1 text-xs transition-colors",
                                  quickRewardNote === template
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                                )}
                              >
                                {template}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setQuickRewardNote("")}
                              className={cn(
                                "rounded-md border px-2 py-1 text-xs transition-colors",
                                quickRewardNote === ""
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-background text-muted-foreground hover:bg-muted"
                              )}
                            >
                              Custom
                            </button>
                          </div>
                        </div>
                      )}
                      <p className="text-xs font-medium text-muted-foreground">
                        Teacher note / feedback
                      </p>
                      <Textarea
                        value={quickRewardNote}
                        onChange={(e) => setQuickRewardNote(e.target.value)}
                        rows={2}
                        placeholder={
                          quickRewardPoint === 1
                            ? "e.g. Helped a classmate and stayed focused."
                            : quickRewardPoint === -1
                              ? "e.g. Sleeping in class / doing unrelated work."
                              : "Describe the behaviour for this point."
                        }
                      />
                    </div>
                  </div>
                ) : (
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
                )}
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
