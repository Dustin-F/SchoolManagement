import { useParams, Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { ArrowLeft, User, School, Calendar, AlertTriangle, ClipboardList, Archive, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppStore } from "@/store";
import { cn, formatDate } from "@/lib/utils";
import { ATTENDANCE_STATUS_COLORS, SEVERITY_BADGE_VARIANT } from "@/lib/displayHelpers";
import { deadlineDay, isTaskOverdue } from "@/lib/taskUtils";
import { studentTaskStatusBadgeClass, studentTaskStatusLabel } from "@/lib/studentTaskStatus";

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const students = useAppStore((s) => s.students);
  const classes = useAppStore((s) => s.classes);
  const attendance = useAppStore((s) => s.attendance);
  const behaviour = useAppStore((s) => s.behaviour);
  const subjects = useAppStore((s) => s.subjects);
  const classTasks = useAppStore((s) => s.classTasks);
  const studentTaskRecords = useAppStore((s) => s.studentTaskRecords);

  const student = students.find((s) => s.id === id);

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

  const activeTaskRows = useMemo(() => taskRows.filter((r) => !r.task.archived), [taskRows]);
  const archivedTaskRows = useMemo(() => taskRows.filter((r) => r.task.archived), [taskRows]);

  const tasksByClassActive = useMemo(() => {
    const map = new Map<string, typeof activeTaskRows>();
    for (const row of activeTaskRows) {
      const list = map.get(row.cls.id) ?? [];
      list.push(row);
      map.set(row.cls.id, list);
    }
    return map;
  }, [activeTaskRows]);

  const tasksByClassArchived = useMemo(() => {
    const map = new Map<string, typeof archivedTaskRows>();
    for (const row of archivedTaskRows) {
      const list = map.get(row.cls.id) ?? [];
      list.push(row);
      map.set(row.cls.id, list);
    }
    return map;
  }, [archivedTaskRows]);

  const [archivedTasksOpen, setArchivedTasksOpen] = useState(false);

  if (!student) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-muted-foreground">Student not found.</p>
        <Button variant="link" onClick={() => navigate("/students")}>Back to Students</Button>
      </div>
    );
  }

  const studentAttendance = attendance
    .filter((a) => a.studentId === student.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const studentBehaviour = behaviour
    .filter((b) => b.studentId === student.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const presentCount = studentAttendance.filter((a) => a.status === "present").length;
  const totalRecords = studentAttendance.length;
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/students">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold">{student.firstName} {student.lastName}</h2>
          {enrolledClasses.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {enrolledClasses.map((c) => c.name).join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" /> Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {student.dateOfBirth && <p>Born: {formatDate(student.dateOfBirth)}</p>}
            {student.email && <p>{student.email}</p>}
            {!student.dateOfBirth && !student.email && <p className="text-muted-foreground">No extra info</p>}
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
              <AlertTriangle className="h-4 w-4" /> Parent / Guardian
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{student.parentName || "—"}</p>
            <p className="text-muted-foreground">{student.parentPhone || "—"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-muted-foreground" /> Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {taskRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No class tasks yet, or you are not enrolled in classes with tasks.</p>
          ) : activeTaskRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active assignments. Open archived below if your teacher moved older tasks there.
            </p>
          ) : null}
          {activeTaskRows.length > 0 && (
            <div className="space-y-6">
              {enrolledClasses
                .filter((c) => tasksByClassActive.has(c.id))
                .map((cls) => (
                  <div key={cls.id}>
                    <div className="mb-2 flex items-center gap-2">
                      <Link to={`/classes/${cls.id}`} className="text-sm font-semibold hover:text-primary transition-colors">
                        {cls.name}
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {(tasksByClassActive.get(cls.id) ?? []).map(({ task, record }) => {
                        const overdue = isTaskOverdue(task, todayStr);
                        return (
                          <div
                            key={record.id}
                            className={`rounded-lg border p-3 text-sm ${
                              overdue ? "border-destructive/50 bg-destructive/5" : "border-border bg-muted/30"
                            }`}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{task.title}</span>
                              <Badge variant="outline" className="capitalize text-xs">{task.type}</Badge>
                              {overdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                            </div>
                            <p className="mt-1 text-muted-foreground">
                              Due {formatDate(task.deadline)}
                              {task.maxScore != null && ` · Max ${task.maxScore}`}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                              <Badge
                                variant="outline"
                                className={cn("font-medium", studentTaskStatusBadgeClass(record.status))}
                              >
                                {studentTaskStatusLabel[record.status]}
                              </Badge>
                              <span className="text-muted-foreground">
                                Score: {record.score != null ? record.score : "—"}
                              </span>
                            </div>
                            {record.feedback && (
                              <p className="mt-2 text-xs text-muted-foreground border-t border-border pt-2">
                                Feedback: {record.feedback}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
          {archivedTaskRows.length > 0 && (
            <div className="rounded-lg border border-dashed border-border bg-muted/20">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/40 rounded-t-lg"
                onClick={() => setArchivedTasksOpen((o) => !o)}
              >
                <span className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-muted-foreground" />
                  Archived assignments ({archivedTaskRows.length})
                </span>
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", archivedTasksOpen && "rotate-180")}
                />
              </button>
              {archivedTasksOpen && (
                <div className="space-y-6 border-t border-border px-3 py-4">
                  {enrolledClasses
                    .filter((c) => tasksByClassArchived.has(c.id))
                    .map((cls) => (
                      <div key={cls.id}>
                        <div className="mb-2 flex items-center gap-2">
                          <Link to={`/classes/${cls.id}`} className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
                            {cls.name}
                          </Link>
                        </div>
                        <div className="space-y-2">
                          {(tasksByClassArchived.get(cls.id) ?? []).map(({ task, record }) => (
                            <div
                              key={record.id}
                              className="rounded-lg border border-border bg-background/80 p-3 text-sm text-muted-foreground"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-foreground">{task.title}</span>
                                <Badge variant="secondary" className="capitalize text-xs">{task.type}</Badge>
                                <Badge variant="outline" className="text-xs">Archived</Badge>
                              </div>
                              <p className="mt-1">
                                Due {formatDate(task.deadline)}
                                {task.maxScore != null && ` · Max ${task.maxScore}`}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                <Badge
                                  variant="outline"
                                  className={cn("font-medium", studentTaskStatusBadgeClass(record.status))}
                                >
                                  {studentTaskStatusLabel[record.status]}
                                </Badge>
                                <span>Score: {record.score != null ? record.score : "—"}</span>
                              </div>
                              {record.feedback && (
                                <p className="mt-2 text-xs border-t border-border pt-2">
                                  Feedback: {record.feedback}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Behaviour Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {studentBehaviour.length === 0 ? (
            <p className="text-sm text-muted-foreground">No behaviour records yet.</p>
          ) : (
            <div className="space-y-3">
              {studentBehaviour.map((record) => {
                const sub = subjects.find((s) => s.id === record.subjectId);
                return (
                  <div key={record.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={SEVERITY_BADGE_VARIANT[record.severity] ?? "secondary"}>
                            {record.severity}
                          </Badge>
                          <Badge variant="outline">{record.category}</Badge>
                          {sub && <Badge variant="secondary">{sub.name}</Badge>}
                        </div>
                        <p className="mt-2 text-sm">{record.description}</p>
                        {record.actionTaken && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Action: {record.actionTaken}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatDate(record.date)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
