import type { ClassTask, Student, StudentTaskRecord } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStudentDisplayName } from "@/lib/displayHelpers";
import { studentTaskStatusLabel } from "@/lib/studentTaskStatus";
import { cn } from "@/lib/utils";

interface GradebookViewProps {
  students: Student[];
  activeTasks: ClassTask[];
  getTaskRecord: (taskId: string, studentId: string) => StudentTaskRecord | undefined;
}

export function GradebookView({ students, activeTasks, getTaskRecord }: GradebookViewProps) {
  if (activeTasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Add tasks to see the gradebook matrix.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="sticky left-0 z-10 min-w-[140px] bg-card">Student</TableHead>
            {activeTasks.map((task) => (
              <TableHead key={task.id} className="min-w-[100px] text-center text-xs">
                <span className="line-clamp-2">{task.title}</span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="sticky left-0 z-10 bg-card font-medium text-sm">
                {getStudentDisplayName(student)}
              </TableCell>
              {activeTasks.map((task) => {
                const rec = getTaskRecord(task.id, student.id);
                const score = rec?.score;
                const status = rec?.status ?? "not_started";
                return (
                  <TableCell key={task.id} className="text-center text-xs">
                    {score != null ? (
                      <span className="font-semibold tabular-nums">
                        {score}
                        {task.maxScore != null && (
                          <span className="text-muted-foreground">/{task.maxScore}</span>
                        )}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "text-muted-foreground",
                          status === "missing" && "text-red-600 dark:text-red-400",
                          status === "completed" && "text-emerald-600"
                        )}
                      >
                        {studentTaskStatusLabel[status]}
                      </span>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
