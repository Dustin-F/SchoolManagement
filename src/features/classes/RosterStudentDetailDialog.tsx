import type { AttendanceStatus, SchoolClass, Student } from "@/types";
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
  onMarkAttendance: (status: AttendanceStatus) => void;
  readOnly?: boolean;
  returnTo?: string;
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
  onMarkAttendance,
  readOnly = false,
  returnTo,
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
              activeTasks={[]}
              getTaskRecord={() => undefined}
              archivedTaskCount={0}
              todayStr=""
              onMarkAttendance={onMarkAttendance}
              onTaskStatusChange={() => {}}
              onTaskScoreUpdate={() => {}}
              onOpenProgress={() => {}}
              readOnly={readOnly}
              showTasks={false}
              showSeatNames
              returnTo={returnTo}
              variant="dialog"
              className="border-0 p-0 shadow-none"
            />
            {!readOnly && (
              <div className="border-t border-border pt-4">
                <ClassPointsToolbar
                  cls={cls}
                  students={students}
                  sessionDate={sessionDate}
                  selectedStudentId={student.id}
                  embedded
                />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
