import type {
  AttendanceStatus,
  ClassTask,
  SchoolClass,
  Student,
  StudentTaskRecord,
  StudentTaskStatus,
} from "@/types";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { RosterStudentDetailPanel } from "@/features/classes/RosterStudentDetailPanel";
import { ClassPointsToolbar } from "@/features/points/ClassPointsToolbar";

interface RosterStudentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cls: SchoolClass;
  students: Student[];
  sessionDate: string;
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
  cls,
  students,
  sessionDate,
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
          <div className="space-y-5">
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
            <div className="border-t border-border pt-4">
              <ClassPointsToolbar
                cls={cls}
                students={students}
                sessionDate={sessionDate}
                selectedStudentId={student.id}
                embedded
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
