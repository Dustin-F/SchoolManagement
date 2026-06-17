import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import type {
  AttendanceRecord,
  AttendanceStatus,
  BehaviourSkill,
  ClassTask,
  SchoolClass,
  Student,
  StudentTaskRecord,
} from "@/types";
import { ClassPointsToolbar } from "@/features/points/ClassPointsToolbar";
import { ClassSeatingGrid } from "@/features/classes/ClassSeatingGrid";
import { RosterStudentDetailDialog } from "@/features/classes/RosterStudentDetailDialog";
import { NeedsAttentionStrip } from "@/features/classes/NeedsAttentionStrip";
import { SeatingControlsPanel } from "@/features/classes/SeatingControlsPanel";
import {
  RosterAttendanceButtons,
  RosterPointsBadge,
  RosterStudentDetailPanel,
  RosterStudentIdentity,
} from "@/features/classes/RosterStudentDetailPanel";
import { Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HintTooltip } from "@/components/ui/hint-tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppStore } from "@/store";
import { getStudentAttentionFlags } from "@/lib/attentionUtils";
import { getSeatColumns, getSeatRows, resolveSeatGrid } from "@/lib/seatingUtils";
import { skillsForClassToolbar } from "@/lib/pointsUtils";
import { cn, getLocalToday } from "@/lib/utils";
import { classPageReturnTo } from "@/lib/studentNavigation";

type RosterViewMode = "seating" | "list";

const rosterViewStorageKey = (classId: string) => `schoolhub-roster-view-${classId}`;

interface StudentRosterTableProps {
  cls: SchoolClass;
  sessionDate: string;
  todayStr?: string;
  students: Student[];
  activeTasks: ClassTask[];
  studentTaskRecords: StudentTaskRecord[];
  dayAttendanceRows: AttendanceRecord[];
  pointsTodayByStudent: Map<string, number>;
  selectedStudentId?: string | null;
  onSelectedStudentChange?: (studentId: string | null) => void;
  onMarkAttendance: (studentId: string, status: AttendanceStatus) => void;
  onAwardSkill?: (studentId: string, skill: BehaviourSkill) => void;
  onAwardSkillBulk?: (studentIds: string[], skill: BehaviourSkill) => void;
  readOnly?: boolean;
}

export function StudentRosterTable({
  cls,
  sessionDate,
  todayStr: todayStrProp,
  students,
  activeTasks,
  studentTaskRecords,
  dayAttendanceRows,
  pointsTodayByStudent,
  selectedStudentId: selectedStudentIdProp,
  onSelectedStudentChange,
  onMarkAttendance,
  onAwardSkill,
  onAwardSkillBulk,
  readOnly = false,
}: StudentRosterTableProps) {
  const location = useLocation();
  const classReturnTo = classPageReturnTo(cls.id, location.search);
  const todayStr = todayStrProp ?? getLocalToday();
  const behaviourSkills = useAppStore((s) => s.behaviourSkills);
  const [viewMode, setViewMode] = useState<RosterViewMode>(() => {
    const saved = localStorage.getItem(rosterViewStorageKey(cls.id));
    if (saved === "list") return "list";
    if (saved === "tasks" || saved === "gradebook") return "seating";
    if (saved === "seating") return "seating";
    return "seating";
  });
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    students[0]?.id ?? null
  );
  const [seatDialogStudentId, setSeatDialogStudentId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(new Set());

  const selectedStudentId = selectedStudentIdProp ?? internalSelectedId;
  const setSelectedStudentId = (id: string | null) => {
    if (onSelectedStudentChange) onSelectedStudentChange(id);
    else setInternalSelectedId(id);
  };

  useEffect(() => {
    if (students.length === 0) {
      setSelectedStudentId(null);
      return;
    }
    if (!selectedStudentId || !students.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  useEffect(() => {
    localStorage.setItem(rosterViewStorageKey(cls.id), viewMode);
  }, [cls.id, viewMode]);

  const attentionFlags = useMemo(
    () =>
      getStudentAttentionFlags(
        students,
        sessionDate,
        todayStr,
        dayAttendanceRows,
        activeTasks,
        studentTaskRecords,
        pointsTodayByStudent
      ),
    [
      students,
      sessionDate,
      todayStr,
      dayAttendanceRows,
      activeTasks,
      studentTaskRecords,
      pointsTodayByStudent,
    ]
  );

  const toolbarSkills = useMemo(
    () => skillsForClassToolbar(behaviourSkills, cls),
    [behaviourSkills, cls]
  );

  const grid = useMemo(() => resolveSeatGrid(cls, cls.studentIds), [cls]);
  const columns = getSeatColumns(cls);
  const rowCount = getSeatRows(cls, cls.studentIds.length);

  const seatDialogStudent = students.find((s) => s.id === seatDialogStudentId) ?? null;

  const handleSeatCardClick = (studentId: string) => {
    if (selectMode) {
      setBulkSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(studentId)) next.delete(studentId);
        else next.add(studentId);
        return next;
      });
      return;
    }
    setSelectedStudentId(studentId);
    setSeatDialogStudentId(studentId);
  };

  const selectRow = (rowIndex: number) => {
    const start = rowIndex * columns;
    const ids = grid
      .slice(start, start + columns)
      .filter((id): id is string => id != null);
    setBulkSelectedIds(new Set(ids));
  };

  const getAttendanceStatus = (studentId: string): AttendanceStatus | null => {
    const record = dayAttendanceRows.find((a) => a.studentId === studentId);
    return record ? record.status : null;
  };

  const renderViewToggle = () => (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex flex-1 rounded-lg border border-border bg-muted/30 p-1">
        {(["seating", "list"] as const).map((mode) => (
          <HintTooltip
            key={mode}
            content={
              mode === "seating"
                ? "Seating plan with drag-and-drop layout."
                : "Attendance and points by student."
            }
          >
            <Button
              type="button"
              variant={viewMode === mode ? "default" : "ghost"}
              size="sm"
              className="h-8 flex-1 text-xs capitalize sm:text-sm"
              onClick={() => setViewMode(mode)}
            >
              {mode}
            </Button>
          </HintTooltip>
        ))}
      </div>
      <HintTooltip content="P: present · 1–4: award skills · →: next student">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Keyboard shortcuts">
          <Keyboard className="h-4 w-4 text-muted-foreground" />
        </Button>
      </HintTooltip>
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
          <RosterStudentIdentity student={student} selected={selected} returnTo={classReturnTo} />
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <RosterAttendanceButtons
            current={getAttendanceStatus(student.id)}
            onMark={(status) => onMarkAttendance(student.id, status)}
            disabled={readOnly}
          />
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
          activeTasks={[]}
          getTaskRecord={() => undefined}
          archivedTaskCount={0}
          todayStr={todayStr}
          onMarkAttendance={(status) => onMarkAttendance(student.id, status)}
          onTaskStatusChange={() => {}}
          onTaskScoreUpdate={() => {}}
          onOpenProgress={() => {}}
          readOnly={readOnly}
          showTasks={false}
          returnTo={classReturnTo}
          className={cn("border-0 shadow-none", selected && "bg-primary/5")}
        />
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {attentionFlags.length > 0 ? (
        <div className="flex justify-start">
          <NeedsAttentionStrip
            flags={attentionFlags}
            selectedStudentId={selectedStudentId}
            onSelectStudent={(id) => {
              setSelectedStudentId(id);
              if (viewMode === "seating") setSeatDialogStudentId(id);
            }}
          />
        </div>
      ) : null}

      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students yet. Add someone to start tracking.</p>
      ) : (
        <>
          {viewMode === "list" && !readOnly && (
            <div className="sticky top-16 z-20 -mx-4 border-y border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/90 sm:-mx-6 sm:px-6">
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
              {!readOnly && (
                <SeatingControlsPanel
                  cls={cls}
                  selectedIds={bulkSelectedIds}
                  toolbarSkills={toolbarSkills}
                  selectMode={selectMode}
                  rowCount={rowCount}
                  onToggleSelectMode={() => {
                    setSelectMode((v) => {
                      const next = !v;
                      if (next) {
                        setSelectedStudentId(null);
                        setSeatDialogStudentId(null);
                      }
                      return next;
                    });
                    setBulkSelectedIds(new Set());
                  }}
                  onMarkPresent={(ids) => ids.forEach((id) => onMarkAttendance(id, "present"))}
                  onAwardSkill={(ids, skill) => {
                    if (onAwardSkillBulk) onAwardSkillBulk(ids, skill);
                    else ids.forEach((id) => onAwardSkill?.(id, skill));
                  }}
                  onSelectRow={selectRow}
                />
              )}
              <ClassSeatingGrid
                cls={cls}
                students={students}
                selectedStudentId={selectedStudentId}
                bulkSelectedIds={selectMode ? bulkSelectedIds : undefined}
                onSelectStudent={handleSeatCardClick}
                pointsTodayByStudent={pointsTodayByStudent}
                getAttendanceStatus={getAttendanceStatus}
                readOnly={readOnly}
              />
              <RosterStudentDetailDialog
                returnTo={classReturnTo}
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
                readOnly={readOnly}
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
                      <TableHead className="min-w-[72px] text-right">Points today</TableHead>
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
