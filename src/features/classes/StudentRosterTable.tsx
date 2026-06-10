import { useEffect, useMemo, useState } from "react";
import type {
  AttendanceRecord,
  AttendanceStatus,
  ClassTask,
  SchoolClass,
  Student,
  StudentTaskRecord,
  StudentTaskStatus,
} from "@/types";
import { ClassPointsToolbar } from "@/features/points/ClassPointsToolbar";
import { ClassSeatingGrid, SeatLayoutPicker } from "@/features/classes/ClassSeatingGrid";
import { RosterStudentDetailDialog } from "@/features/classes/RosterStudentDetailDialog";
import {
  RosterAttendanceButtons,
  RosterPointsBadge,
  RosterStudentDetailPanel,
  RosterStudentIdentity,
  RosterTaskControls,
} from "@/features/classes/RosterStudentDetailPanel";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type RosterViewMode = "seating" | "list";

interface StudentRosterTableProps {
  cls: SchoolClass;
  sessionDate: string;
  students: Student[];
  activeTasks: ClassTask[];
  studentTaskRecords: StudentTaskRecord[];
  dayAttendanceRows: AttendanceRecord[];
  pointsTodayByStudent: Map<string, number>;
  onMarkAttendance: (studentId: string, status: AttendanceStatus) => void;
  onTaskStatusChange: (recordId: string, status: StudentTaskStatus) => void;
  onTaskScoreBlur: (record: StudentTaskRecord, raw: string) => void;
  onOpenProgress: (record: StudentTaskRecord, task: ClassTask) => void;
  archivedTaskCount: number;
}

export function StudentRosterTable({
  cls,
  sessionDate,
  students,
  activeTasks,
  studentTaskRecords,
  dayAttendanceRows,
  pointsTodayByStudent,
  onMarkAttendance,
  onTaskStatusChange,
  onTaskScoreBlur,
  onOpenProgress,
  archivedTaskCount,
}: StudentRosterTableProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [viewMode, setViewMode] = useState<RosterViewMode>("seating");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    students[0]?.id ?? null
  );
  const [seatDialogStudentId, setSeatDialogStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (students.length === 0) {
      setSelectedStudentId(null);
      return;
    }
    if (!selectedStudentId || !students.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

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

  const seatDialogStudent = students.find((s) => s.id === seatDialogStudentId) ?? null;

  const handleSeatCardClick = (studentId: string) => {
    setSelectedStudentId(studentId);
    setSeatDialogStudentId(studentId);
  };

  const taskControlProps = {
    activeTasks,
    getTaskRecord,
    archivedTaskCount,
    todayStr,
    onTaskStatusChange,
    onTaskScoreBlur,
    onOpenProgress,
  };

  const renderViewToggle = () => (
    <div className="mb-3 flex rounded-lg border border-border bg-muted/30 p-1">
      <Button
        type="button"
        variant={viewMode === "seating" ? "default" : "ghost"}
        size="sm"
        className="flex-1 h-8 text-xs sm:text-sm"
        onClick={() => setViewMode("seating")}
      >
        Seating
      </Button>
      <Button
        type="button"
        variant={viewMode === "list" ? "default" : "ghost"}
        size="sm"
        className="flex-1 h-8 text-xs sm:text-sm"
        onClick={() => setViewMode("list")}
      >
        List
      </Button>
    </div>
  );

  const renderListDesktopRow = (student: Student) => {
    const pts = pointsTodayByStudent.get(student.id) ?? 0;
    const selected = selectedStudentId === student.id;
    return (
      <TableRow
        key={student.id}
        className={cn(
          "cursor-pointer align-top transition-colors",
          selected && "bg-primary/5 hover:bg-primary/10"
        )}
        onClick={() => setSelectedStudentId(student.id)}
      >
        <TableCell>
          <RosterStudentIdentity student={student} selected={selected} />
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <RosterAttendanceButtons
            current={getAttendanceStatus(student.id)}
            onMark={(status) => onMarkAttendance(student.id, status)}
          />
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <RosterTaskControls student={student} {...taskControlProps} />
        </TableCell>
        <TableCell className="text-right">
          <RosterPointsBadge pts={pts} />
        </TableCell>
      </TableRow>
    );
  };

  const renderListMobileCard = (student: Student) => {
    const pts = pointsTodayByStudent.get(student.id) ?? 0;
    const selected = selectedStudentId === student.id;
    return (
      <div
        key={student.id}
        role="button"
        tabIndex={0}
        onClick={() => setSelectedStudentId(student.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSelectedStudentId(student.id);
          }
        }}
        className={cn(
          "rounded-xl border transition-colors",
          selected ? "border-primary ring-2 ring-primary/25" : "border-border"
        )}
      >
        <RosterStudentDetailPanel
          student={student}
          pointsToday={pts}
          attendanceStatus={getAttendanceStatus(student.id)}
          onMarkAttendance={(status) => onMarkAttendance(student.id, status)}
          {...taskControlProps}
          className={cn(
            "border-0 shadow-none",
            selected && "bg-primary/5"
          )}
        />
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students yet. Add someone to start tracking.</p>
      ) : (
        <>
          {viewMode === "list" && (
            <div className="sticky top-16 z-20 -mx-6 border-y border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/90">
              <ClassPointsToolbar
                cls={cls}
                students={students}
                sessionDate={sessionDate}
                selectedStudentId={selectedStudentId}
              />
            </div>
          )}

          {renderViewToggle()}

          {viewMode === "seating" ? (
            <>
              <SeatLayoutPicker cls={cls} />
              <ClassSeatingGrid
                cls={cls}
                students={students}
                selectedStudentId={selectedStudentId}
                onSelectStudent={handleSeatCardClick}
                pointsTodayByStudent={pointsTodayByStudent}
                getAttendanceStatus={getAttendanceStatus}
              />
              <RosterStudentDetailDialog
                open={seatDialogStudentId !== null}
                onOpenChange={(open) => {
                  if (!open) setSeatDialogStudentId(null);
                }}
                cls={cls}
                students={students}
                sessionDate={sessionDate}
                student={seatDialogStudent}
                pointsToday={
                  seatDialogStudent
                    ? (pointsTodayByStudent.get(seatDialogStudent.id) ?? 0)
                    : 0
                }
                attendanceStatus={
                  seatDialogStudent ? getAttendanceStatus(seatDialogStudent.id) : null
                }
                onMarkAttendance={(status) => {
                  if (seatDialogStudent) onMarkAttendance(seatDialogStudent.id, status);
                }}
                {...taskControlProps}
              />
            </>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="min-w-[180px]">Student</TableHead>
                      <TableHead className="min-w-[120px]">Attendance</TableHead>
                      <TableHead className="min-w-[280px]">Tasks &amp; grades</TableHead>
                      <TableHead className="min-w-[72px] text-right">Today</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => renderListDesktopRow(student))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {students.map((student) => renderListMobileCard(student))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
