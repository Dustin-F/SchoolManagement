import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store";
import { getStudentDisplayName } from "@/lib/displayHelpers";
import { getLocalToday } from "@/lib/utils";
import { isTaskOverdue } from "@/lib/taskUtils";
import { studentTaskStatusLabel } from "@/lib/studentTaskStatus";

export function MissingWorkPage() {
  const classes = useAppStore((s) => s.classes);
  const students = useAppStore((s) => s.students);
  const classTasks = useAppStore((s) => s.classTasks);
  const studentTaskRecords = useAppStore((s) => s.studentTaskRecords);
  const [classFilter, setClassFilter] = useState<string>("all");
  const todayStr = getLocalToday();

  const items = useMemo(() => {
    const result: {
      studentId: string;
      studentName: string;
      classId: string;
      className: string;
      taskId: string;
      taskTitle: string;
      status: string;
      overdue: boolean;
    }[] = [];

    for (const task of classTasks) {
      if (task.archived) continue;
      const cls = classes.find((c) => c.id === task.classId);
      if (!cls) continue;
      if (classFilter !== "all" && task.classId !== classFilter) continue;

      for (const studentId of cls.studentIds) {
        const rec = studentTaskRecords.find(
          (r) => r.taskId === task.id && r.studentId === studentId
        );
        if (!rec) continue;
        if (rec.status === "completed") continue;
        const overdue = isTaskOverdue(task, todayStr);
        if (rec.status === "missing" || overdue) {
          const student = students.find((s) => s.id === studentId);
          result.push({
            studentId,
            studentName: student ? getStudentDisplayName(student) : "Student",
            classId: cls.id,
            className: cls.name,
            taskId: task.id,
            taskTitle: task.title,
            status: studentTaskStatusLabel[rec.status],
            overdue,
          });
        }
      }
    }

    return result.sort(
      (a, b) =>
        Number(b.overdue) - Number(a.overdue) ||
        a.className.localeCompare(b.className) ||
        a.studentName.localeCompare(b.studentName)
    );
  }, [classTasks, classes, students, studentTaskRecords, classFilter, todayStr]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Missing work"
        description="Incomplete tasks across all classes."
        actions={
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No missing or overdue work right now.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={`${item.taskId}-${item.studentId}`}>
              <Card>
                <CardContent className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{item.studentName}</p>
                    <p className="text-sm text-muted-foreground">
                      <Link to={`/classes/${item.classId}`} className="hover:text-primary hover:underline">
                        {item.className}
                      </Link>
                      {" · "}
                      {item.taskTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.overdue && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Overdue
                      </Badge>
                    )}
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
