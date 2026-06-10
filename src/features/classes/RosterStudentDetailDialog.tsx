import type {
  AttendanceStatus,
  ClassTask,
  Student,
  StudentTaskRecord,
  StudentTaskStatus,
} from "@/types";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { RosterStudentDetailPanel } from "@/features/classes/RosterStudentDetailPanel";

interface RosterStudentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  pointsToday: number;
  attendanceStatus: AttendanceStatus | null;
  activeTasks: ClassTask[];
  getTaskRecord: (taskId: string, studentId: string) => StudentTaskRecord | undefined;
  archivedTaskCount: number;
  todayStr: string;
  onMarkAttendance: (status: AttendanceStatus) => void;
  onTaskStatusChange: (recordId: string, status: StudentTaskStatus) => void;
  onTaskScoreBlur: (record: StudentTaskRecord, raw: string) => void;
  onOpenProgress: (record: StudentTaskRecord, task: ClassTask) => void;
}

export function RosterStudentDetailDialog({
  open,
  onOpenChange,
  student,
  pointsToday,
  attendanceStatus,
  activeTasks,
  getTaskRecord,
  archivedTaskCount,
  todayStr,
  onMarkAttendance,
  onTaskStatusChange,
  onTaskScoreBlur,
  onOpenProgress,
}: RosterStudentDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,40rem)] max-w-lg overflow-y-auto sm:max-w-xl">
        {student && (
          <RosterStudentDetailPanel
            student={student}
            pointsToday={pointsToday}
            attendanceStatus={attendanceStatus}
            activeTasks={activeTasks}
            getTaskRecord={getTaskRecord}
            archivedTaskCount={archivedTaskCount}
            todayStr={todayStr}
            onMarkAttendance={onMarkAttendance}
            onTaskStatusChange={onTaskStatusChange}
            onTaskScoreBlur={onTaskScoreBlur}
            onOpenProgress={onOpenProgress}
            showSeatNames
            variant="dialog"
            className="border-0 p-0 shadow-none"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
