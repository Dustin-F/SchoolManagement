import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskStudentGradeRow } from "@/features/tasks/TaskStudentGradeRow";
import type { TaskScoreUpdate } from "@/features/tasks/TaskScoreInput";
import type { ClassTask, Student, StudentTaskRecord, StudentTaskStatus } from "@/types";
import { formatTaskScoreHeader } from "@/lib/taskScoringUtils";

interface SimpleGradeTableProps {
  task: ClassTask;
  students: Student[];
  recordByStudent: Map<string, StudentTaskRecord>;
  readOnly?: boolean;
  onTaskStatusChange: (recordId: string, status: StudentTaskStatus) => void;
  onTaskScoreUpdate: (record: StudentTaskRecord, update: TaskScoreUpdate) => void;
  onOpenProgress?: (record: StudentTaskRecord, task: ClassTask) => void;
}

export function SimpleGradeTable({
  task,
  students,
  recordByStudent,
  readOnly = false,
  onTaskStatusChange,
  onTaskScoreUpdate,
  onOpenProgress,
}: SimpleGradeTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent border-b border-border bg-muted/30">
          <TableHead className="min-w-[180px]">Student</TableHead>
          <TableHead className="min-w-[8rem]">Status</TableHead>
          <TableHead className="min-w-[10rem]">
            Score
            <span className="ml-1 font-normal text-muted-foreground">
              ({formatTaskScoreHeader(task)})
            </span>
          </TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TaskStudentGradeRow
            key={student.id}
            student={student}
            task={task}
            record={recordByStudent.get(student.id)}
            readOnly={readOnly}
            onTaskStatusChange={onTaskStatusChange}
            onTaskScoreUpdate={onTaskScoreUpdate}
            onOpenProgress={onOpenProgress}
          />
        ))}
      </TableBody>
    </Table>
  );
}
