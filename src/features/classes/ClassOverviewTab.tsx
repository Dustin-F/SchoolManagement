import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Archive,
  Edit,
  RotateCcw,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getTeacherDisplayName } from "@/lib/displayHelpers";
import { isArchived } from "@/lib/archiveUtils";
import { cn, getLocalToday } from "@/lib/utils";
import { classSessionHref, getOccurrencesOnDate } from "@/lib/scheduleUtils";
import { classPageReturnTo, pathWithReturn } from "@/lib/studentNavigation";
import { ClassFormDialog } from "@/features/classes/ClassFormDialog";
import { ClassSchedulePanel } from "@/features/schedule/ClassSchedulePanel";
import type { SchoolClass } from "@/types";

interface ClassOverviewTabProps {
  cls: SchoolClass;
}

export function ClassOverviewTab({ cls }: ClassOverviewTabProps) {
  const subjects = useAppStore((s) => s.subjects);
  const teachers = useAppStore((s) => s.teachers);
  const classTasks = useAppStore((s) => s.classTasks);
  const attendance = useAppStore((s) => s.attendance);
  const classSessionNotes = useAppStore((s) => s.classSessionNotes);
  const classScheduleEvents = useAppStore((s) => s.classScheduleEvents);
  const classSessionExceptions = useAppStore((s) => s.classSessionExceptions);
  const archiveClass = useAppStore((s) => s.archiveClass);
  const restoreClass = useAppStore((s) => s.restoreClass);
  const [editingOpen, setEditingOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

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
            <Link
              to={pathWithReturn(`/students?classId=${cls.id}`, classReturn)}
              className={cn(
                "rounded-lg border border-border bg-muted/20 p-3 transition-colors",
                "hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <p className="text-xs text-muted-foreground">Students</p>
              <p className="mt-1 text-xl font-semibold">{cls.studentIds.length}</p>
            </Link>
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

      <div id="schedule">
        <ClassSchedulePanel classId={cls.id} className={cls.name} />
      </div>

      <ClassFormDialog open={editingOpen} onOpenChange={setEditingOpen} editingClass={cls} />

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
