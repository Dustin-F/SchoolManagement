import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Archive,
  ChevronDown,
  Edit,
  Plus,
  RotateCcw,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { getStudentDisplayName, getTeacherDisplayName } from "@/lib/displayHelpers";
import { isArchived } from "@/lib/archiveUtils";
import { cn, getLocalToday } from "@/lib/utils";
import { classSessionHref, getOccurrencesOnDate } from "@/lib/scheduleUtils";
import {
  classPageReturnTo,
  pathWithReturn,
  studentProfilePath,
} from "@/lib/studentNavigation";
import { ClassFormDialog } from "@/features/classes/ClassFormDialog";
import { AddExistingStudentDialog } from "@/features/classes/AddExistingStudentDialog";
import { StudentFormDialog } from "@/features/students/StudentFormDialog";
import { StudentImportDialog } from "@/features/students/StudentImportDialog";
import { ClassSchedulePanel } from "@/features/schedule/ClassSchedulePanel";
import type { SchoolClass } from "@/types";

interface ClassOverviewTabProps {
  cls: SchoolClass;
}

export function ClassOverviewTab({ cls }: ClassOverviewTabProps) {
  const subjects = useAppStore((s) => s.subjects);
  const teachers = useAppStore((s) => s.teachers);
  const students = useAppStore((s) => s.students);
  const allClasses = useAppStore((s) => s.classes);
  const classTasks = useAppStore((s) => s.classTasks);
  const attendance = useAppStore((s) => s.attendance);
  const classSessionNotes = useAppStore((s) => s.classSessionNotes);
  const classScheduleEvents = useAppStore((s) => s.classScheduleEvents);
  const classSessionExceptions = useAppStore((s) => s.classSessionExceptions);
  const archiveClass = useAppStore((s) => s.archiveClass);
  const restoreClass = useAppStore((s) => s.restoreClass);
  const setStudentEnrollment = useAppStore((s) => s.setStudentEnrollment);
  const [editingOpen, setEditingOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [addExistingOpen, setAddExistingOpen] = useState(false);
  const [createStudentOpen, setCreateStudentOpen] = useState(false);
  const [importStudentsOpen, setImportStudentsOpen] = useState(false);
  const [removeStudentId, setRemoveStudentId] = useState<string | null>(null);

  const classIsArchived = isArchived(cls);
  const subject = subjects.find((s) => s.id === cls.subjectId);
  const mainTeacher = teachers.find((t) => t.id === cls.teacherId);
  const coTeachers = teachers.filter((t) => cls.coTeacherIds.includes(t.id));
  const activeTaskCount = classTasks.filter((t) => t.classId === cls.id && !t.archived).length;
  const archivedTaskCount = classTasks.filter((t) => t.classId === cls.id && t.archived).length;
  const totalAttendanceRecords = attendance.filter((a) => a.classId === cls.id).length;
  const notesCount = classSessionNotes.filter(
    (n) => n.classId === cls.id && n.content.trim() !== ""
  ).length;

  const latestNoteSession = useMemo(
    () =>
      classSessionNotes
        .filter((n) => n.classId === cls.id && n.content.trim() !== "")
        .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt))[0],
    [classSessionNotes, cls.id]
  );

  const todayStr = getLocalToday();
  const todaySessions = useMemo(
    () => getOccurrencesOnDate(cls.id, todayStr, classScheduleEvents, classSessionExceptions),
    [cls.id, todayStr, classScheduleEvents, classSessionExceptions]
  );
  const todaySession = todaySessions[0];

  const sessionNotesHref = useMemo(() => {
    if (latestNoteSession) {
      return classSessionHref(
        cls.id,
        latestNoteSession.date,
        latestNoteSession.eventId,
        latestNoteSession.occurrenceDate ?? latestNoteSession.date
      );
    }
    if (todaySession) {
      return classSessionHref(cls.id, todaySession.date, todaySession.eventId, todaySession.occurrenceDate);
    }
    return `/classes/${cls.id}#schedule`;
  }, [cls.id, latestNoteSession, todaySession]);

  useEffect(() => {
    if (window.location.hash !== "#schedule") return;
    requestAnimationFrame(() => {
      document.getElementById("schedule")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const classReturn = classPageReturnTo(cls.id);

  const enrolledStudents = useMemo(
    () =>
      cls.studentIds
        .map((id) => students.find((s) => s.id === id))
        .filter((s): s is NonNullable<typeof s> => Boolean(s))
        .sort((a, b) => getStudentDisplayName(a).localeCompare(getStudentDisplayName(b))),
    [cls.studentIds, students]
  );

  const removeTarget = students.find((s) => s.id === removeStudentId);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-primary/20">
        <div className="h-1 bg-linear-to-r from-primary/40 via-primary/20 to-transparent" />
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {subject?.name ?? "No subject"}
                {cls.classroomNumber ? ` · Room ${cls.classroomNumber}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingOpen(true)}>
                <Edit className="mr-1.5 h-4 w-4" />
                Edit class
              </Button>
              {classIsArchived ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    restoreClass(cls.id);
                    toast.success(`"${cls.name}" restored.`);
                  }}
                >
                  <RotateCcw className="mr-1.5 h-4 w-4" />
                  Restore
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={() => setArchiveOpen(true)}>
                  <Archive className="mr-1.5 h-4 w-4" />
                  Archive
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <a
              href="#roster"
              className={cn(
                "rounded-lg border border-border bg-muted/20 p-3 transition-colors",
                "hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <p className="text-xs text-muted-foreground">Students</p>
              <p className="mt-1 text-xl font-semibold">{cls.studentIds.length}</p>
            </a>
            <Link
              to={`/classes/${cls.id}?tab=tasks`}
              className={cn(
                "rounded-lg border border-border bg-muted/20 p-3 transition-colors",
                "hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <p className="text-xs text-muted-foreground">Active tasks</p>
              <p className="mt-1 text-xl font-semibold">{activeTaskCount}</p>
            </Link>
            <Link
              to={pathWithReturn(`/attendance?classId=${cls.id}`, classReturn)}
              className={cn(
                "rounded-lg border border-border bg-muted/20 p-3 transition-colors",
                "hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <p className="text-xs text-muted-foreground">Attendance logs</p>
              <p className="mt-1 text-xl font-semibold">{totalAttendanceRecords}</p>
            </Link>
            <Link
              to={pathWithReturn(sessionNotesHref, classReturn)}
              className={cn(
                "rounded-lg border border-border bg-muted/20 p-3 transition-colors",
                "hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <p className="text-xs text-muted-foreground">Session notes</p>
              <p className="mt-1 text-xl font-semibold">{notesCount}</p>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-muted-foreground" />
            People
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Main teacher</p>
            <p className="mt-1 font-medium">
              {mainTeacher ? getTeacherDisplayName(mainTeacher) : "Unassigned"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Co-teachers</p>
            {coTeachers.length === 0 ? (
              <p className="mt-1 text-muted-foreground">None</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {coTeachers.map((teacher) => (
                  <Badge key={teacher.id} variant="outline">
                    {getTeacherDisplayName(teacher)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {archivedTaskCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {archivedTaskCount} archived task{archivedTaskCount !== 1 ? "s" : ""} in history.
            </p>
          )}
        </CardContent>
      </Card>

      <Card id="roster" className="scroll-mt-6">
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-muted-foreground" />
              Students
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Enrolled in this class. Add people here — seating and attendance stay in the session view.
            </p>
          </div>
          {!classIsArchived && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" size="sm">
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  Add students
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
                <DropdownMenuItem onClick={() => setImportStudentsOpen(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  Import from Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        <CardContent>
          {enrolledStudents.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No students in this class yet.
              {!classIsArchived && " Use Add students to enroll someone."}
            </p>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border">
              {enrolledStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5"
                >
                  <Link
                    to={studentProfilePath(student.id, classReturn)}
                    className="min-w-0 flex-1 font-medium text-foreground hover:text-primary"
                  >
                    {getStudentDisplayName(student)}
                    {isArchived(student) && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">Archived</span>
                    )}
                  </Link>
                  {!classIsArchived && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${getStudentDisplayName(student)} from class`}
                      onClick={() => setRemoveStudentId(student.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div id="schedule">
        <ClassSchedulePanel classId={cls.id} className={cls.name} />
      </div>

      <ClassFormDialog open={editingOpen} onOpenChange={setEditingOpen} editingClass={cls} />

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

      <AlertDialog
        open={Boolean(removeStudentId)}
        onOpenChange={(open) => {
          if (!open) setRemoveStudentId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from class?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget
                ? `Remove ${getStudentDisplayName(removeTarget)} from “${cls.name}”? They stay in the school roster and can be added back later.`
                : "Remove this student from the class?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!removeStudentId) return;
                const remainingClassIds = allClasses
                  .filter((c) => c.id !== cls.id && c.studentIds.includes(removeStudentId))
                  .map((c) => c.id);
                setStudentEnrollment(removeStudentId, remainingClassIds);
                toast.success(
                  removeTarget
                    ? `${getStudentDisplayName(removeTarget)} removed from class.`
                    : "Student removed from class."
                );
                setRemoveStudentId(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive class</AlertDialogTitle>
            <AlertDialogDescription>
              Archive &quot;{cls.name}&quot;? It will be hidden from active lists, but all history
              remains.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                archiveClass(cls.id);
                setArchiveOpen(false);
                toast.success(`"${cls.name}" archived.`);
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
