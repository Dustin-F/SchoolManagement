import { useParams, Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  User,
  School,
  Calendar,
  Sparkles,
  Archive,
  Pencil,
  RotateCcw,
  Trash2,
  ChevronDown,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { StudentFormDialog } from "@/features/students/StudentFormDialog";
import { StudentTasksSection } from "@/features/students/StudentTasksSection";
import { TaskProgressDialog } from "@/features/tasks/TaskProgressDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppStore } from "@/store";
import { isArchived } from "@/lib/archiveUtils";
import { cn, formatDate, getLocalToday } from "@/lib/utils";
import { ATTENDANCE_STATUS_COLORS, getExtraNameLine, getPersonNameLines, getStudentDisplayName } from "@/lib/displayHelpers";
import { skillButtonClass } from "@/lib/pointsUtils";
import { deadlineDay } from "@/lib/taskUtils";
import { getStudentProfileBackPath } from "@/lib/studentNavigation";
import type { ClassTask, StudentTaskRecord } from "@/types";

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const backPath = getStudentProfileBackPath(location.state, searchParams);
  const students = useAppStore((s) => s.students);
  const classes = useAppStore((s) => s.classes);
  const attendance = useAppStore((s) => s.attendance);
  const pointEvents = useAppStore((s) => s.pointEvents);
  const behaviourSkills = useAppStore((s) => s.behaviourSkills);
  const classTasks = useAppStore((s) => s.classTasks);
  const studentTaskRecords = useAppStore((s) => s.studentTaskRecords);
  const archiveStudent = useAppStore((s) => s.archiveStudent);
  const restoreStudent = useAppStore((s) => s.restoreStudent);
  const deleteStudent = useAppStore((s) => s.deleteStudent);

  const [editStudentOpen, setEditStudentOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTaskRow, setSelectedTaskRow] = useState<{
    task: ClassTask;
    record: StudentTaskRecord;
  } | null>(null);
  const [attendanceHistoryOpen, setAttendanceHistoryOpen] = useState(false);

  const student = students.find((s) => s.id === id);
  const studentIsArchived = student ? isArchived(student) : false;

  const enrolledClasses = useMemo(() => {
    if (!student) return [];
    return classes.filter((c) => c.studentIds.includes(student.id));
  }, [student, classes]);

  const taskRows = useMemo(() => {
    if (!student) return [];
    const enrolledIds = new Set(enrolledClasses.map((c) => c.id));
    const rows: { task: (typeof classTasks)[0]; record: (typeof studentTaskRecords)[0]; cls: (typeof classes)[0] }[] = [];
    for (const rec of studentTaskRecords) {
      if (rec.studentId !== student.id) continue;
      const task = classTasks.find((t) => t.id === rec.taskId);
      if (!task) continue;
      const cls = classes.find((c) => c.id === task.classId);
      if (!cls || !enrolledIds.has(cls.id)) continue;
      rows.push({ task, record: rec, cls });
    }
    rows.sort((a, b) => deadlineDay(a.task.deadline).localeCompare(deadlineDay(b.task.deadline)));
    return rows;
  }, [student, enrolledClasses, classTasks, studentTaskRecords, classes]);

  if (!student) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-muted-foreground">Student not found.</p>
        <Button variant="link" onClick={() => navigate(backPath)}>Go back</Button>
      </div>
    );
  }

  const studentAttendance = attendance
    .filter((a) => a.studentId === student.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const studentPointEvents = pointEvents
    .filter((e) => e.studentId === student.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt.localeCompare(a.createdAt));
  const skillById = new Map(behaviourSkills.map((s) => [s.id, s]));
  const totalPoints = studentPointEvents.reduce((sum, e) => sum + e.points, 0);

  const presentCount = studentAttendance.filter((a) => a.status === "present").length;
  const totalRecords = studentAttendance.length;
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  const todayStr = getLocalToday();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Go back"
          onClick={() => navigate(backPath)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {student.photoUrl && (
          <img
            src={student.photoUrl}
            alt=""
            className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/20"
          />
        )}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gradient">{getStudentDisplayName(student)}</h2>
          {getExtraNameLine(student) && (
            <p className="text-sm text-muted-foreground">
              {getExtraNameLine(student)}
            </p>
          )}
          {enrolledClasses.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {enrolledClasses.map((c) => c.name).join(", ")}
            </p>
          )}
        </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Button type="button" variant="outline" onClick={() => setEditStudentOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          {studentIsArchived ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                restoreStudent(student.id);
                toast.success(`${getStudentDisplayName(student)} restored.`);
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => setArchiveOpen(true)}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
          )}
          {studentIsArchived && (
            <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {studentIsArchived && (
        <Card className="border-muted-foreground/25 bg-muted/30">
          <CardContent className="py-4 text-sm text-muted-foreground">
            This student is archived and removed from active class rosters. History below is preserved. Restore them to
            enroll in classes again.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" /> Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {getPersonNameLines(student).map((line) => (
              <p key={line}>{line}</p>
            ))}
            {student.dateOfBirth && <p>Born: {formatDate(student.dateOfBirth)}</p>}
            {student.email && <p>{student.email}</p>}
            {student.notes && (
              <p className="border-t border-border pt-2 text-muted-foreground">{student.notes}</p>
            )}
            {getPersonNameLines(student).length === 0 &&
              !student.dateOfBirth &&
              !student.email &&
              !student.notes && <p className="text-muted-foreground">No extra info</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <School className="h-4 w-4" /> Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrolledClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not enrolled</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {enrolledClasses.map((c) => (
                  <Link key={c.id} to={`/classes/${c.id}`}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10">{c.name}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" /> Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{attendanceRate}%</p>
            <p className="text-xs text-muted-foreground">{presentCount}/{totalRecords} days present</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" /> Parent / Guardian
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{student.parentName || "—"}</p>
            <p className="text-muted-foreground">{student.parentPhone || "—"}</p>
          </CardContent>
        </Card>
      </div>

      <StudentTasksSection
        taskRows={taskRows}
        todayStr={todayStr}
        onSelectTask={(row) => setSelectedTaskRow({ task: row.task, record: row.record })}
      />

      <TaskProgressDialog
        open={selectedTaskRow !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTaskRow(null);
        }}
        record={selectedTaskRow?.record ?? null}
        task={selectedTaskRow?.task ?? null}
        studentName={getStudentDisplayName(student)}
        readOnly={studentIsArchived}
        variant="detail"
      />

      <Card>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-6 py-4 text-left hover:bg-muted/30"
          onClick={() => setAttendanceHistoryOpen((o) => !o)}
        >
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              Attendance history
            </CardTitle>
            {studentAttendance.length > 0 && (
              <Badge variant="secondary" className="font-normal tabular-nums">
                {studentAttendance.length}
              </Badge>
            )}
            {totalRecords > 0 && (
              <span className="text-xs text-muted-foreground">{attendanceRate}% present</span>
            )}
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              attendanceHistoryOpen && "rotate-180"
            )}
          />
        </button>
        {attendanceHistoryOpen && (
          <CardContent className="pt-0">
            {studentAttendance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance records yet.</p>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentAttendance.map((record) => {
                      const cls = classes.find((c) => c.id === record.classId);
                      return (
                        <TableRow key={record.id}>
                          <TableCell>{formatDate(record.date)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{cls?.name ?? "—"}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ATTENDANCE_STATUS_COLORS[record.status]}`}>
                              {record.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{record.notes || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            Points
            {totalPoints !== 0 && (
              <Badge variant="secondary" className="tabular-nums">
                {totalPoints > 0 ? `+${totalPoints}` : totalPoints} total
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentPointEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No points recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {studentPointEvents.map((event) => {
                const skill = skillById.get(event.skillId);
                const cls = classes.find((c) => c.id === event.classId);
                return (
                  <div key={event.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {skill ? (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                                skillButtonClass(skill)
                              )}
                            >
                              {skill.emoji && <span>{skill.emoji}</span>}
                              {skill.name}
                            </span>
                          ) : (
                            <Badge variant="outline">Unknown skill</Badge>
                          )}
                          {cls && <Badge variant="secondary">{cls.name}</Badge>}
                          <span
                            className={cn(
                              "text-sm font-semibold tabular-nums",
                              event.points > 0 && "text-emerald-600",
                              event.points < 0 && "text-amber-600"
                            )}
                          >
                            {event.points > 0 ? `+${event.points}` : event.points}
                          </span>
                        </div>
                        {event.note && <p className="mt-2 text-sm text-muted-foreground">{event.note}</p>}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatDate(event.date)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <StudentFormDialog
        open={editStudentOpen}
        onOpenChange={setEditStudentOpen}
        editingStudent={student}
      />

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive student</AlertDialogTitle>
            <AlertDialogDescription>
              Archive {getStudentDisplayName(student)}? They will be removed from active class rosters but attendance,
              points, and grades are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                archiveStudent(student.id);
                toast.success(`${getStudentDisplayName(student)} archived.`);
                setArchiveOpen(false);
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete student permanently</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete {getStudentDisplayName(student)} and all their records? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteStudent(student.id);
                toast.success(`${getStudentDisplayName(student)} deleted.`);
                navigate(backPath);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
