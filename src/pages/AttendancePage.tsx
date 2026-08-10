import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ClipboardList, Check, X, Clock, Shield } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { PageBackButton } from "@/components/PageBackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
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
import { useAppStore } from "@/store";
import { activeClasses, activeStudents } from "@/lib/archiveUtils";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import type { AttendanceReasonCode, AttendanceStatus } from "@/types";
import {
  ATTENDANCE_REASON_CODES,
  attendanceStatusShowsReason,
} from "@/lib/attendanceConstants";
import { showUndoToast } from "@/lib/undoToast";
import { getAttendanceAlerts } from "@/lib/attentionUtils";
import { formatDate, getLocalToday } from "@/lib/utils";
import { getStudentDisplayName, getStudentName } from "@/lib/displayHelpers";
import { usePageBack } from "@/hooks/usePageBack";

const statusConfig: Record<AttendanceStatus, { label: string; color: string; icon: React.ElementType }> = {
  present: { label: "Present", color: "bg-emerald-100 text-emerald-800", icon: Check },
  absent: { label: "Absent", color: "bg-red-100 text-red-800", icon: X },
  late: { label: "Late", color: "bg-amber-100 text-amber-800", icon: Clock },
  excused: { label: "Excused", color: "bg-blue-100 text-blue-800", icon: Shield },
};

const statuses: AttendanceStatus[] = ["present", "absent", "late", "excused"];

export function AttendancePage() {
  const classes = useAppStore((s) => s.classes);
  const students = useAppStore((s) => s.students);
  const attendance = useAppStore((s) => s.attendance);
  const addAttendance = useAppStore((s) => s.addAttendance);
  const updateAttendance = useAppStore((s) => s.updateAttendance);
  const deleteAttendance = useAppStore((s) => s.deleteAttendance);
  const [searchParams] = useSearchParams();
  const classIdFromUrl = searchParams.get("classId");
  const dateFromUrl = searchParams.get("date");
  const { backPath, showBack, backLabel } = usePageBack("/attendance");

  const today = getLocalToday();
  const activeClassList = activeClasses(classes);
  const [selectedClassId, setSelectedClassId] = useState(activeClassList[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState(today);
  const [view, setView] = useState<"mark" | "history">("mark");

  useEffect(() => {
    if (classIdFromUrl && activeClassList.some((c) => c.id === classIdFromUrl)) {
      setSelectedClassId(classIdFromUrl);
    }
  }, [classIdFromUrl, activeClassList]);

  useEffect(() => {
    if (dateFromUrl && /^\d{4}-\d{2}-\d{2}$/.test(dateFromUrl)) {
      setSelectedDate(dateFromUrl);
    }
  }, [dateFromUrl]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const classStudents = useMemo(
    () =>
      selectedClass
        ? activeStudents(students).filter((s) => selectedClass.studentIds.includes(s.id))
        : [],
    [students, selectedClass]
  );

  // Existing attendance for selected class + date
  const dayAttendance = useMemo(
    () => attendance.filter((a) => a.classId === selectedClassId && a.date === selectedDate),
    [attendance, selectedClassId, selectedDate]
  );

  const getStudentStatus = (studentId: string): AttendanceStatus | null => {
    const record = dayAttendance.find((a) => a.studentId === studentId);
    return record ? record.status : null;
  };

  const handleMark = (
    studentId: string,
    status: AttendanceStatus,
    reasonCode?: AttendanceReasonCode
  ) => {
    const existing = dayAttendance.find((a) => a.studentId === studentId);
    const prevStatus = existing?.status ?? null;
    const prevReason = existing?.reasonCode;
    if (existing) {
      updateAttendance(existing.id, { status, reasonCode });
      showUndoToast(`Attendance: ${status}`, () => {
        if (prevStatus) updateAttendance(existing.id, { status: prevStatus, reasonCode: prevReason });
        else deleteAttendance(existing.id);
      });
    } else {
      const newId = addAttendance({
        studentId,
        classId: selectedClassId,
        date: selectedDate,
        status,
        reasonCode,
      });
      showUndoToast(`Attendance: ${status}`, () => deleteAttendance(newId));
    }
  };

  const attendanceAlerts = useMemo(
    () =>
      selectedClass
        ? getAttendanceAlerts(classStudents, selectedClass.id, attendance)
        : [],
    [selectedClass, classStudents, attendance]
  );

  const handleMarkAllPresent = () => {
    classStudents.forEach((s) => {
      if (!getStudentStatus(s.id)) {
        addAttendance({
          studentId: s.id,
          classId: selectedClassId,
          date: selectedDate,
          status: "present",
        });
      }
    });
    toast.success("All unmarked students marked as present.");
  };

  // History: all records for selected class, sorted newest first
  const historyRecords = useMemo(() => {
    return attendance
      .filter((a) => a.classId === selectedClassId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendance, selectedClassId]);

  const { paginated: paginatedHistory, page: historyPage, setPage: setHistoryPage, totalPages: historyTotalPages, reset: resetHistoryPage } = usePagination(historyRecords, 25);
  const { paginated: paginatedMarkStudents, page: markPage, setPage: setMarkPage, totalPages: markTotalPages, reset: resetMarkPage } = usePagination(classStudents, 25);

  useEffect(() => { resetHistoryPage(); }, [selectedClassId]);
  useEffect(() => { resetMarkPage(); }, [selectedClassId, selectedDate]);

  return (
    <div>
      {showBack && <PageBackButton to={backPath} label={backLabel} />}
      <PageHeader
        title="Attendance"
        description="Mark and review attendance by class."
      />

      {/* Controls */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Class</Label>
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {activeClassList.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Date</Label>
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            className="w-full sm:w-44"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant={view === "mark" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("mark")}
          >
            Mark Attendance
          </Button>
          <Button
            variant={view === "history" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("history")}
          >
            History
          </Button>
        </div>
      </div>

      {attendanceAlerts.length > 0 && (
        <Card className="mb-4 border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-wrap gap-2 py-3">
            {attendanceAlerts.map((a) => (
              <Badge key={`${a.studentId}-${a.message}`} variant="outline" className="text-xs">
                {a.studentName}: {a.message}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {!selectedClassId ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ClipboardList className="mb-4 h-12 w-12" />
          <p>Select a class to get started.</p>
        </div>
      ) : view === "mark" ? (
        /* ── Mark Attendance View ── */
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {classes.find((c) => c.id === selectedClassId)?.name} &mdash; {formatDate(selectedDate)}
            </CardTitle>
            <Button size="sm" variant="outline" onClick={handleMarkAllPresent}>
              Mark All Present
            </Button>
          </CardHeader>
          <CardContent>
            {classStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No students in this class.</p>
            ) : (
              <>
              <div className="space-y-2">
                {paginatedMarkStudents.map((student) => {
                  const current = getStudentStatus(student.id);
                  const record = dayAttendance.find((a) => a.studentId === student.id);
                  const showReason = current ? attendanceStatusShowsReason(current) : false;
                  return (
                    <div
                      key={student.id}
                      className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="font-medium">
                        {getStudentDisplayName(student)}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {statuses.map((status) => {
                          const cfg = statusConfig[status];
                          const isActive = current === status;
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleMark(student.id, status, record?.reasonCode)}
                              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                                isActive
                                  ? cfg.color + " ring-2 ring-offset-1 ring-current"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              <cfg.icon className="h-3 w-3" />
                              {cfg.label}
                            </button>
                          );
                        })}
                        {showReason && (
                          <Select
                            value={record?.reasonCode ?? ""}
                            onValueChange={(v) =>
                              handleMark(student.id, current!, v as AttendanceReasonCode)
                            }
                          >
                            <SelectTrigger className="h-8 w-36 text-xs">
                              <SelectValue placeholder="Reason" />
                            </SelectTrigger>
                            <SelectContent>
                              {ATTENDANCE_REASON_CODES.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                  {r.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <TablePagination
                page={markPage}
                totalPages={markTotalPages}
                onPageChange={setMarkPage}
                totalItems={classStudents.length}
              />
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        /* ── History View ── */
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
          </CardHeader>
          <CardContent>
            {historyRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground">No records yet for this class.</p>
            ) : (
              <>
                <div className="rounded-xl border border-border bg-card overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{formatDate(record.date)}</TableCell>
                          <TableCell className="font-medium">{getStudentName(record.studentId, students)}</TableCell>
                          <TableCell>
                            <Badge className={statusConfig[record.status].color}>
                              {statusConfig[record.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{record.notes || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {historyTotalPages > 1 && (
                  <TablePagination
                    page={historyPage}
                    totalPages={historyTotalPages}
                    onPageChange={setHistoryPage}
                    totalItems={historyRecords.length}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
