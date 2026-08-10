import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Users,
  GraduationCap,
  Clock,
  Plus,
  UserPlus,
  ChevronDown,
  Check,
  X,
  Shield,
  Play,
  Award,
  Archive,
  RotateCcw,
  MoreHorizontal,
  LayoutGrid,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HintTooltip } from "@/components/ui/hint-tooltip";
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
import { cn, DAY_SHORT, getLocalToday, isIsoDateString } from "@/lib/utils";
import {
  STUDENT_TASK_STATUS_ORDER,
  studentTaskStatusLabel,
  studentTaskStatusSelectClass,
} from "@/lib/studentTaskStatus";
import { deadlineDay } from "@/lib/taskUtils";
import { dayOfWeekFromDate, getOccurrencesOnDate, getScheduledDatesInRange, formatOccurrenceTime } from "@/lib/scheduleUtils";
import { findSessionNote } from "@/lib/sessionNotesUtils";
import { AddExistingStudentDialog } from "@/features/classes/AddExistingStudentDialog";
import { StudentFormDialog } from "@/features/students/StudentFormDialog";
import { StudentImportDialog } from "@/features/students/StudentImportDialog";
import { TaskProgressDialog } from "@/features/tasks/TaskProgressDialog";
import { TaskScoreInput, type TaskScoreUpdate } from "@/features/tasks/TaskScoreInput";
import { isRubricMode } from "@/lib/taskScoringUtils";
import { StudentRosterTable } from "@/features/classes/StudentRosterTable";
import { ClassTasksSection } from "@/features/classes/ClassTasksSection";
import { ClassSessionNotesCard } from "@/features/classes/ClassSessionNotesCard";
import { ClassOverviewTab } from "@/features/classes/ClassOverviewTab";
import { SessionStatusBadge } from "@/features/classes/SessionStatusBadge";
import {
  getEffectiveSessionStatus,
  shouldAutoCompleteSession,
} from "@/lib/sessionUtils";
import type {
  AttendanceStatus,
  ClassTask,
  StudentTaskRecord,
  StudentTaskStatus,
} from "@/types";
import { pointsByStudent, skillsForClassToolbar } from "@/lib/pointsUtils";
import { resolveSeatGrid, studentsFromSeatGrid } from "@/lib/seatingUtils";
import { getAttendanceAlerts } from "@/lib/attentionUtils";
import { useClassKeyboardShortcuts } from "@/hooks/useClassKeyboardShortcuts";
import { showUndoToast } from "@/lib/undoToast";
import { isArchived } from "@/lib/archiveUtils";
import type { AttendanceReasonCode, BehaviourSkill } from "@/types";

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const eventIdParam = searchParams.get("eventId");
  const occurrenceParam = searchParams.get("occurrence");
  const classes = useAppStore((s) => s.classes);
  const students = useAppStore((s) => s.students);
  const teachers = useAppStore((s) => s.teachers);
  const subjects = useAppStore((s) => s.subjects);
  const classTasks = useAppStore((s) => s.classTasks);
  const studentTaskRecords = useAppStore((s) => s.studentTaskRecords);
  const attendance = useAppStore((s) => s.attendance);
  const pointEvents = useAppStore((s) => s.pointEvents);
  const classSessionNotes = useAppStore((s) => s.classSessionNotes);
  const classScheduleEvents = useAppStore((s) => s.classScheduleEvents);
  const classSessionExceptions = useAppStore((s) => s.classSessionExceptions);
  const addAttendance = useAppStore((s) => s.addAttendance);
  const updateAttendance = useAppStore((s) => s.updateAttendance);
  const deleteAttendance = useAppStore((s) => s.deleteAttendance);
  const behaviourSkills = useAppStore((s) => s.behaviourSkills);
  const addPointEvent = useAppStore((s) => s.addPointEvent);
  const deletePointEvent = useAppStore((s) => s.deletePointEvent);
  const updateStudentTaskRecord = useAppStore((s) => s.updateStudentTaskRecord);
  const upsertClassSession = useAppStore((s) => s.upsertClassSession);
  const deleteClassTask = useAppStore((s) => s.deleteClassTask);
  const archiveClassTask = useAppStore((s) => s.archiveClassTask);
  const unarchiveClassTask = useAppStore((s) => s.unarchiveClassTask);
  const archiveClass = useAppStore((s) => s.archiveClass);
  const restoreClass = useAppStore((s) => s.restoreClass);
  const [archiveClassOpen, setArchiveClassOpen] = useState(false);

  const [addExistingOpen, setAddExistingOpen] = useState(false);
  const [createStudentOpen, setCreateStudentOpen] = useState(false);
  const [importStudentsOpen, setImportStudentsOpen] = useState(false);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<ClassTask | null>(null);
  const [progressRecord, setProgressRecord] = useState<StudentTaskRecord | null>(null);
  const [progressTask, setProgressTask] = useState<ClassTask | null>(null);
  const [progressStudentName, setProgressStudentName] = useState("");
  const [randomPickerOpen, setRandomPickerOpen] = useState(false);
  const [randomStudentId, setRandomStudentId] = useState<string | null>(null);
  const [randomCycleShownIds, setRandomCycleShownIds] = useState<string[]>([]);
  const [quickAttendance, setQuickAttendance] = useState<AttendanceStatus | null>(null);
  const [quickTaskStatuses, setQuickTaskStatuses] = useState<
    Record<string, { recordId: string; status: StudentTaskStatus }>
  >({});
  const [rosterSelectedId, setRosterSelectedId] = useState<string | null>(null);

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
  const classIsArchived = cls ? isArchived(cls) : false;

  const dayOccurrences = useMemo(() => {
    if (!cls) return [];
    return getOccurrencesOnDate(cls.id, attendanceDate, classScheduleEvents, classSessionExceptions);
  }, [cls, attendanceDate, classScheduleEvents, classSessionExceptions]);

  const activeOccurrence = useMemo(() => {
    if (eventIdParam) {
      const match = dayOccurrences.find(
        (o) => o.eventId === eventIdParam && o.occurrenceDate === (occurrenceParam ?? o.occurrenceDate)
      );
      if (match) return match;
    }
    return dayOccurrences[0];
  }, [dayOccurrences, eventIdParam, occurrenceParam]);

  const sessionRecord = useMemo(
    () =>
      findSessionNote(
        classSessionNotes,
        cls?.id ?? "",
        attendanceDate,
        activeOccurrence?.eventId,
        activeOccurrence?.occurrenceDate
      ),
    [cls?.id, attendanceDate, classSessionNotes, activeOccurrence]
  );

  const sessionHighlightDates = useMemo(() => {
    if (!cls) return [];
    const start = new Date(`${attendanceDate}T12:00:00`);
    start.setMonth(start.getMonth() - 2);
    const end = new Date(`${attendanceDate}T12:00:00`);
    end.setMonth(end.getMonth() + 4);
    return getScheduledDatesInRange(
      cls.id,
      classScheduleEvents,
      classSessionExceptions,
      start.toISOString().slice(0, 10),
      end.toISOString().slice(0, 10)
    );
  }, [cls, attendanceDate, classScheduleEvents, classSessionExceptions]);

  const sessionContext = useMemo(
    () => ({
      eventId: activeOccurrence?.eventId,
      occurrenceDate: activeOccurrence?.occurrenceDate ?? attendanceDate,
    }),
    [activeOccurrence, attendanceDate]
  );

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
    if (!cls) return [];
    const grid = resolveSeatGrid(cls, cls.studentIds);
    return studentsFromSeatGrid(students, grid);
  }, [students, cls]);

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

  useEffect(() => {
    if (!cls || !activeOccurrence || sessionRecord) return;
    upsertClassSession(cls.id, attendanceDate, {
      eventId: activeOccurrence.eventId,
      occurrenceDate: activeOccurrence.occurrenceDate,
      status: "planned",
    });
  }, [attendanceDate, cls, activeOccurrence, sessionRecord, upsertClassSession]);

  useEffect(() => {
    if (!cls || !activeOccurrence || classIsArchived) return;
    const maybeAutoComplete = () => {
      if (!shouldAutoCompleteSession(sessionRecord, activeOccurrence)) return;
      upsertClassSession(cls.id, attendanceDate, {
        eventId: activeOccurrence.eventId,
        occurrenceDate: activeOccurrence.occurrenceDate,
        status: "completed",
        completedAt: new Date().toISOString(),
      });
    };
    maybeAutoComplete();
    const id = window.setInterval(maybeAutoComplete, 60_000);
    return () => window.clearInterval(id);
  }, [
    attendanceDate,
    cls,
    activeOccurrence,
    classIsArchived,
    sessionRecord,
    upsertClassSession,
  ]);

  const toolbarSkills = useMemo(
    () => (cls ? skillsForClassToolbar(behaviourSkills, cls) : []),
    [behaviourSkills, cls]
  );

  const attendanceAlerts = useMemo(
    () =>
      cls
        ? getAttendanceAlerts(classStudents, cls.id, attendance)
        : [],
    [cls, classStudents, attendance]
  );

  const awardSkillToStudent = useCallback(
    (studentId: string, skill: BehaviourSkill) => {
      if (classIsArchived) return;
      const eventId = addPointEvent({
        studentId,
        skillId: skill.id,
        classId: cls?.id ?? "",
        date: attendanceDate,
        points: skill.points,
      });
      const st = classStudents.find((s) => s.id === studentId);
      const sign = skill.points > 0 ? "+" : "";
      showUndoToast(
        `${sign}${skill.points} ${skill.name} → ${st ? getStudentDisplayName(st) : "student"}`,
        () => deletePointEvent(eventId)
      );
    },
    [
      addPointEvent,
      deletePointEvent,
      cls?.id,
      attendanceDate,
      classStudents,
      classIsArchived,
    ]
  );

  const awardSkillToStudents = useCallback(
    (studentIds: string[], skill: BehaviourSkill) => {
      if (classIsArchived) return;
      if (studentIds.length === 0) return;
      const eventIds = studentIds.map((studentId) =>
        addPointEvent({
          studentId,
          skillId: skill.id,
          classId: cls?.id ?? "",
          date: attendanceDate,
          points: skill.points,
        })
      );
      const sign = skill.points > 0 ? "+" : "";
      const soleStudent =
        studentIds.length === 1
          ? classStudents.find((s) => s.id === studentIds[0])
          : undefined;
      const label =
        soleStudent != null
          ? `${sign}${skill.points} ${skill.name} → ${getStudentDisplayName(soleStudent)}`
          : `${sign}${skill.points} ${skill.name} → ${studentIds.length} students`;
      showUndoToast(label, () => eventIds.forEach((id) => deletePointEvent(id)));
    },
    [
      addPointEvent,
      deletePointEvent,
      cls?.id,
      attendanceDate,
      classStudents,
      classIsArchived,
    ]
  );

  const cycleNextStudent = useCallback(() => {
    if (classStudents.length === 0) return;
    const currentIdx = rosterSelectedId
      ? classStudents.findIndex((s) => s.id === rosterSelectedId)
      : -1;
    const next = classStudents[(currentIdx + 1) % classStudents.length];
    if (next) setRosterSelectedId(next.id);
  }, [classStudents, rosterSelectedId]);

  const markAttendance = useCallback(
    (studentId: string, status: AttendanceStatus, reasonCode?: AttendanceReasonCode) => {
      if (classIsArchived) return;
      const existing = dayAttendanceRows.find((a) => a.studentId === studentId);
      const prevStatus = existing?.status ?? null;
      const prevReason = existing?.reasonCode;
      if (existing) {
        updateAttendance(existing.id, { status, reasonCode });
        showUndoToast(`Attendance: ${status}`, () => {
          if (prevStatus) {
            updateAttendance(existing.id, { status: prevStatus, reasonCode: prevReason });
          } else {
            deleteAttendance(existing.id);
          }
        });
      } else {
        const newId = addAttendance({
          studentId,
          classId: cls?.id ?? "",
          date: attendanceDate,
          status,
          reasonCode,
        });
        showUndoToast(`Attendance: ${status}`, () => deleteAttendance(newId));
      }
    },
    [
      dayAttendanceRows,
      updateAttendance,
      addAttendance,
      deleteAttendance,
      cls?.id,
      attendanceDate,
      classIsArchived,
    ]
  );

  useClassKeyboardShortcuts({
    enabled: !!cls && !classIsArchived,
    toolbarSkills,
    selectedStudentId: rosterSelectedId,
    onMarkPresent: (id) => markAttendance(id, "present"),
    onAwardSkill: awardSkillToStudent,
    onNextStudent: cycleNextStudent,
  });

  const onTaskScoreUpdate = useCallback(
    (record: StudentTaskRecord, update: TaskScoreUpdate) => {
      if (classIsArchived) return;
      const patch: Partial<StudentTaskRecord> = {};
      if (update.score !== undefined && update.score !== record.score) patch.score = update.score;
      if (update.letterGrade !== undefined && update.letterGrade !== record.letterGrade) {
        patch.letterGrade = update.letterGrade;
      }
      if ("criterionScores" in update) {
        const prev = record.criterionScores ?? null;
        const next = update.criterionScores ?? null;
        if (JSON.stringify(next) !== JSON.stringify(prev)) {
          patch.criterionScores = update.criterionScores ?? undefined;
        }
      }
      if (Object.keys(patch).length > 0) {
        updateStudentTaskRecord(record.id, patch);
      }
    },
    [updateStudentTaskRecord, classIsArchived]
  );

  const openProgress = (record: StudentTaskRecord, task: ClassTask) => {
    if (classIsArchived) return;
    const st = students.find((s) => s.id === record.studentId);
    setProgressStudentName(st ? getStudentDisplayName(st) : "Student");
    setProgressTask(task);
    setProgressRecord(record);
  };

  type ClassTab = "overview" | "tasks";

  const isSessionView = !!(dateParam || eventIdParam);

  const classTab: ClassTab = useMemo(() => {
    const tab = searchParams.get("tab");
    if (tab === "tasks") return "tasks";
    return "overview";
  }, [searchParams]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab === "session" ||
      tab === "schedule" ||
      tab === "grades" ||
      tab === "units" ||
      tab === "incomplete" ||
      tab === "gradebook" ||
      tab === "term-grades"
    ) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("tab");
          return next;
        },
        { replace: true }
      );
      if (tab === "schedule") {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}#schedule`
        );
      }
    }
  }, [searchParams, setSearchParams]);

  const setClassTab = useCallback(
    (tab: ClassTab) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("date");
          next.delete("eventId");
          next.delete("occurrence");
          if (tab === "overview") next.delete("tab");
          else next.set("tab", tab);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const exitSessionView = useCallback(() => {
    const from = searchParams.get("from");
    if (from?.startsWith("/")) {
      navigate(from);
      return;
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("date");
        next.delete("eventId");
        next.delete("occurrence");
        next.delete("tab");
        next.delete("from");
        return next;
      },
      { replace: true }
    );
  }, [navigate, searchParams, setSearchParams]);

  const pickRandomStudentId = (ids: string[]) => {
    if (ids.length === 0) return null;
    const idx = Math.floor(Math.random() * ids.length);
    return ids[idx] ?? null;
  };

  const setupQuickPickerState = (studentId: string) => {
    setQuickAttendance(getAttendanceStatus(studentId));
    const statuses: Record<string, { recordId: string; status: StudentTaskStatus }> = {};
    for (const task of activeTasksForClass) {
      const rec = getTaskRecord(task.id, studentId);
      if (!rec) continue;
      statuses[task.id] = { recordId: rec.id, status: rec.status };
    }
    setQuickTaskStatuses(statuses);
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
    if (classIsArchived) return;
    if (!randomStudentId) return;
    if (quickAttendance) {
      markAttendance(randomStudentId, quickAttendance);
    }
    Object.values(quickTaskStatuses).forEach((u) => {
      updateStudentTaskRecord(u.recordId, { status: u.status });
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

  const isFocusedTab = classTab === "tasks";
  const sessionStatus = getEffectiveSessionStatus(
    sessionRecord,
    activeOccurrence
      ? { date: activeOccurrence.date, endTime: activeOccurrence.endTime }
      : undefined
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-gradient">{cls.name}</h2>
              {classIsArchived && <Badge variant="outline">Archived</Badge>}
              {isSessionView && sessionRecord?.lessonPrepared && (
                <Badge variant="secondary">Lesson prepared</Badge>
              )}
              {isSessionView && activeOccurrence && (
                <Badge variant="secondary">
                  {formatOccurrenceTime(activeOccurrence.startTime, activeOccurrence.endTime)}
                </Badge>
              )}
              {isSessionView && activeOccurrence && (
                <SessionStatusBadge
                  classId={cls.id}
                  sessionDate={attendanceDate}
                  eventId={sessionContext.eventId}
                  occurrenceDate={sessionContext.occurrenceDate}
                  status={sessionStatus}
                  disabled={classIsArchived}
                />
              )}
              {isSessionView && !activeOccurrence && (
                <Badge variant="outline">Unscheduled date</Badge>
              )}
            </div>
            {isSessionView && (cls.classroomNumber || subject || activeOccurrence) && (
              <p className="text-sm text-muted-foreground">
                {cls.classroomNumber && <span>Room {cls.classroomNumber}</span>}
                {cls.classroomNumber && subject && <span aria-hidden> · </span>}
                {subject && <span>{subject.name}</span>}
                {activeOccurrence?.title && (
                  <>
                    {(cls.classroomNumber || subject) && <span aria-hidden> · </span>}
                    <span>{activeOccurrence.title}</span>
                  </>
                )}
              </p>
            )}
            {!isSessionView && (subject || cls.classroomNumber) && (
              <p className="text-sm text-muted-foreground">
                {subject && <span>{subject.name}</span>}
                {subject && cls.classroomNumber && <span aria-hidden> · </span>}
                {cls.classroomNumber && <span>Room {cls.classroomNumber}</span>}
              </p>
            )}
            {isSessionView && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <Link to={`/attendance?classId=${cls.id}`} className="hover:text-primary hover:underline">
                  Full attendance page
                </Link>
              </div>
            )}
          </div>
        </div>
        {!isFocusedTab && !isSessionView && classTab !== "overview" && (
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
            {classIsArchived ? (
              <Button
                type="button"
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => {
                  restoreClass(cls.id);
                  toast.success(`"${cls.name}" restored.`);
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore class
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <MoreHorizontal className="mr-2 h-4 w-4" />
                    Class options
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setArchiveClassOpen(true)}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive class
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      {classIsArchived && isSessionView && (
        <Card className="border-muted-foreground/25 bg-muted/30">
          <CardContent className="py-4 text-sm text-muted-foreground">
            This class is archived. You can review history below, but attendance, points, and tasks cannot be changed
            until you restore it.
          </CardContent>
        </Card>
      )}

      {isSessionView && (
        <Button type="button" variant="ghost" size="sm" className="-mt-2 h-8 px-2" onClick={exitSessionView}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to class
        </Button>
      )}

      {!isSessionView && (
      <div className="flex w-fit flex-wrap gap-1 rounded-lg border border-border bg-muted/30 p-1">
        <Button
          type="button"
          variant={classTab === "overview" ? "default" : "ghost"}
          size="sm"
          className="h-8 px-4 text-sm"
          onClick={() => setClassTab("overview")}
        >
          <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
          Overview
        </Button>
        <Button
          type="button"
          variant={classTab === "tasks" ? "default" : "ghost"}
          size="sm"
          className="h-8 px-4 text-sm"
          onClick={() => setClassTab("tasks")}
        >
          Tasks
          {activeTasksForClass.length > 0 && (
            <span className="ml-1.5 rounded-full bg-background/80 px-1.5 text-xs tabular-nums">
              {activeTasksForClass.length}
            </span>
          )}
        </Button>
      </div>
      )}

      {isSessionView ? (
        <>
      <ClassSessionNotesCard
        classId={cls.id}
        sessionDate={attendanceDate}
        eventId={sessionContext.eventId}
        occurrenceDate={sessionContext.occurrenceDate}
        readOnly={classIsArchived}
      />

      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                Main teacher
              </p>
              <p className="font-semibold">
                {mainTeacher ? getTeacherDisplayName(mainTeacher) : "Unassigned"}
              </p>
              {mainTeacher?.email && (
                <p className="text-sm text-muted-foreground">{mainTeacher.email}</p>
              )}
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                Students
              </p>
              <p className="text-2xl font-bold">{classStudents.length}</p>
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" />
                Sessions this day
              </p>
              {dayOccurrences.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sessions scheduled this day.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {dayOccurrences.map((occ) => (
                    <button
                      key={`${occ.eventId}:${occ.occurrenceDate}`}
                      type="button"
                      className={cn(
                        "rounded-md border px-2 py-1 transition-colors",
                        activeOccurrence?.eventId === occ.eventId &&
                          activeOccurrence.occurrenceDate === occ.occurrenceDate
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/40 hover:bg-muted"
                      )}
                      onClick={() => {
                        setSearchParams((prev) => {
                          const next = new URLSearchParams(prev);
                          next.set("date", occ.date);
                          next.set("eventId", occ.eventId);
                          next.set("occurrence", occ.occurrenceDate);
                          return next;
                        });
                      }}
                    >
                      {occ.title?.trim() || DAY_SHORT[dayOfWeekFromDate(occ.date)]}{" "}
                      {formatOccurrenceTime(occ.startTime, occ.endTime)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {coTeachers.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Co-teachers</p>
              <div className="flex flex-wrap gap-2">
                {coTeachers.map((t) => (
                  <Badge key={t.id} variant="outline">
                    {getTeacherDisplayName(t)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {attendanceAlerts.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Attendance alerts</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {attendanceAlerts.map((a) => (
              <Badge key={`${a.studentId}-${a.message}`} variant="outline" className="text-xs">
                {a.studentName}: {a.message}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quick class check</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <HintTooltip content="Pick a random student for attendance and task updates.">
            <span className="inline-flex">
              <Button
                onClick={() => openRandomStudentPicker()}
                disabled={classIsArchived || classStudents.length === 0}
              >
                <Play className="mr-1.5 h-4 w-4" />
                Random student check
              </Button>
            </span>
          </HintTooltip>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <HintTooltip content="Seating plan for attendance. Drag cards to match your room layout.">
              <CardTitle className="flex w-fit items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-muted-foreground" />
                Students
              </CardTitle>
            </HintTooltip>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <HintTooltip content="Attendance date for this session.">
              <div className="w-fit">
                <DatePicker
                  id="class-attendance-date"
                  value={attendanceDate}
                  onChange={setAttendanceDateWithUrl}
                  highlightDates={sessionHighlightDates}
                  className="h-9 w-full sm:w-44"
                />
              </div>
            </HintTooltip>
            <DropdownMenu>
              <HintTooltip content="Add or import students, or open full attendance and points pages.">
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" disabled={classIsArchived}>
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    More
                    <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
              </HintTooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/attendance?classId=${cls.id}`}>
                    <Clock className="mr-2 h-4 w-4" />
                    Full attendance page
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
        <CardContent className="space-y-3 overflow-visible">
          <StudentRosterTable
            cls={cls}
            sessionDate={attendanceDate}
            todayStr={todayStr}
            students={classStudents}
            activeTasks={activeTasksForClass}
            studentTaskRecords={studentTaskRecords}
            dayAttendanceRows={dayAttendanceRows}
            pointsTodayByStudent={pointsTodayByStudent}
            selectedStudentId={rosterSelectedId}
            onSelectedStudentChange={setRosterSelectedId}
            onMarkAttendance={markAttendance}
            onAwardSkill={awardSkillToStudent}
            onAwardSkillBulk={awardSkillToStudents}
            readOnly={classIsArchived}
          />
        </CardContent>
      </Card>

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
        </>
      ) : classTab === "overview" ? (
        <ClassOverviewTab cls={cls} />
      ) : (
        <ClassTasksSection
          classId={cls.id}
          activeTasks={activeTasksForClass}
          archivedTasks={archivedTasksForClass}
          studentTaskRecords={studentTaskRecords}
          enrolledStudentIds={cls.studentIds}
          onDeleteTask={(task) => setDeleteTaskTarget(task)}
          onArchiveTask={(id) => {
            archiveClassTask(id);
            toast.success("Task archived.");
          }}
          onUnarchiveTask={(id) => {
            unarchiveClassTask(id);
            toast.success("Task restored.");
          }}
          readOnly={classIsArchived}
        />
      )}

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

      <TaskProgressDialog
        open={!!progressRecord}
        onOpenChange={(o) => {
          if (!o) {
            setProgressRecord(null);
            setProgressTask(null);
          }
        }}
        record={progressRecord}
        task={progressTask}
        studentName={progressStudentName}
      />

      <Dialog
        open={randomPickerOpen}
        onOpenChange={(open) => {
          setRandomPickerOpen(open);
          if (!open) {
            setRandomStudentId(null);
            setRandomCycleShownIds([]);
            setQuickTaskStatuses({});
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
                            const statusUpdate = quickTaskStatuses[task.id];
                            const rec = getTaskRecord(task.id, current.id);
                            if (!statusUpdate || !rec) {
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
                                  value={statusUpdate.status}
                                  onValueChange={(v) =>
                                    setQuickTaskStatuses((prev) => ({
                                      ...prev,
                                      [task.id]: { ...prev[task.id], status: v as StudentTaskStatus },
                                    }))
                                  }
                                >
                                  <SelectTrigger
                                    className={cn(
                                      "h-8 w-37 shrink-0 text-xs",
                                      studentTaskStatusSelectClass(statusUpdate.status)
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
                                {isRubricMode(task) ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs"
                                    onClick={() => openProgress(rec, task)}
                                  >
                                    Score rubric
                                  </Button>
                                ) : (
                                  <TaskScoreInput
                                    task={task}
                                    record={rec}
                                    compact
                                    onScoreUpdate={onTaskScoreUpdate}
                                  />
                                )}
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

      <AlertDialog open={archiveClassOpen} onOpenChange={setArchiveClassOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive class</AlertDialogTitle>
            <AlertDialogDescription>
              Archive &quot;{cls.name}&quot;? It will be hidden from your dashboard and class list, but attendance,
              points, and tasks are kept. You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                archiveClass(cls.id);
                toast.success(`"${cls.name}" archived.`);
                setArchiveClassOpen(false);
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
