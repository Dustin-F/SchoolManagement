import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RubricGradeTable } from "@/features/tasks/RubricGradeTable";
import { SimpleGradeTable } from "@/features/tasks/SimpleGradeTable";
import { TaskProgressDialog } from "@/features/tasks/TaskProgressDialog";
import type { TaskScoreUpdate } from "@/features/tasks/TaskScoreInput";
import { getStudentDisplayName } from "@/lib/displayHelpers";
import { isArchived } from "@/lib/archiveUtils";
import { isRubricMode } from "@/lib/taskScoringUtils";
import { formatTaskListProgress, isTaskOverdue } from "@/lib/taskUtils";
import { useAppStore } from "@/store";
import type { ClassTask, StudentTaskRecord } from "@/types";
import { formatDate, getLocalToday } from "@/lib/utils";

export function TaskGradePage() {
  const { classId, taskId } = useParams<{ classId: string; taskId: string }>();
  const navigate = useNavigate();
  const todayStr = getLocalToday();

  const classes = useAppStore((s) => s.classes);
  const students = useAppStore((s) => s.students);
  const classTasks = useAppStore((s) => s.classTasks);
  const studentTaskRecords = useAppStore((s) => s.studentTaskRecords);
  const updateStudentTaskRecord = useAppStore((s) => s.updateStudentTaskRecord);

  const [progressRecord, setProgressRecord] = useState<StudentTaskRecord | null>(null);
  const [progressStudentName, setProgressStudentName] = useState("");

  const cls = classes.find((c) => c.id === classId);
  const task = classTasks.find((t) => t.id === taskId);
  const classIsArchived = cls ? isArchived(cls) : false;
  const readOnly = classIsArchived;

  const classStudents = useMemo(() => {
    if (!cls) return [];
    const order = new Map(cls.studentIds.map((id, i) => [id, i]));
    return students
      .filter((s) => order.has(s.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }, [cls, students]);

  const recordByStudent = useMemo(() => {
    const map = new Map<string, StudentTaskRecord>();
    if (!taskId) return map;
    for (const r of studentTaskRecords) {
      if (r.taskId === taskId) map.set(r.studentId, r);
    }
    return map;
  }, [studentTaskRecords, taskId]);

  const progressLabel = useMemo(() => {
    if (!task || !cls) return "";
    return formatTaskListProgress(task, studentTaskRecords, cls.studentIds);
  }, [task, cls, studentTaskRecords]);

  const onTaskStatusChange = useCallback(
    (recordId: string, status: StudentTaskRecord["status"]) => {
      if (readOnly) return;
      updateStudentTaskRecord(recordId, { status });
    },
    [readOnly, updateStudentTaskRecord]
  );

  const onTaskScoreUpdate = useCallback(
    (record: StudentTaskRecord, update: TaskScoreUpdate) => {
      if (readOnly) return;
      const patch: Partial<StudentTaskRecord> = {};
      if (update.score !== undefined && update.score !== record.score) patch.score = update.score;
      if (update.letterGrade !== undefined && update.letterGrade !== record.letterGrade) {
        patch.letterGrade = update.letterGrade;
      }
      if ("criterionScores" in update) {
        const prev = record.criterionScores ?? null;
        const next = update.criterionScores ?? null;
        if (JSON.stringify(next) !== JSON.stringify(prev)) {
          patch.criterionScores = update.criterionScores ?? undefined;
        }
      }
      if (Object.keys(patch).length > 0) {
        updateStudentTaskRecord(record.id, patch);
      }
    },
    [readOnly, updateStudentTaskRecord]
  );

  const openProgress = (record: StudentTaskRecord, _task: ClassTask) => {
    if (readOnly) return;
    const st = students.find((s) => s.id === record.studentId);
    setProgressStudentName(st ? getStudentDisplayName(st) : "Student");
    setProgressRecord(record);
  };

  if (!cls || !task || task.classId !== cls.id) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-muted-foreground">Task not found.</p>
        <Button
          variant="link"
          onClick={() => navigate(classId ? `/classes/${classId}` : "/classes")}
        >
          Back to class
        </Button>
      </div>
    );
  }

  const overdue = isTaskOverdue(task, todayStr);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
        <Link to={`/classes/${cls.id}?tab=tasks`}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to {cls.name}
        </Link>
      </Button>

      <PageHeader
        title={task.title}
        description={`Due ${formatDate(task.deadline)}${progressLabel ? ` · ${progressLabel}` : ""}`}
        actions={
          !readOnly && (
            <Button size="sm" variant="outline" asChild>
              <Link to={`/classes/${cls.id}/tasks/${task.id}`}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit task
              </Link>
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="capitalize">
          {task.type}
        </Badge>
        {task.archived && <Badge variant="secondary">Archived</Badge>}
        {overdue && !task.archived && (
          <Badge variant="destructive">Overdue</Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isRubricMode(task) && (task.rubric?.length ?? 0) > 0 ? (
            <RubricGradeTable
              task={task}
              students={classStudents}
              recordByStudent={recordByStudent}
              readOnly={readOnly}
              onTaskStatusChange={onTaskStatusChange}
              onTaskScoreUpdate={onTaskScoreUpdate}
              onOpenProgress={openProgress}
            />
          ) : (
            <div className="overflow-x-auto">
              <SimpleGradeTable
                task={task}
                students={classStudents}
                recordByStudent={recordByStudent}
                readOnly={readOnly}
                onTaskStatusChange={onTaskStatusChange}
                onTaskScoreUpdate={onTaskScoreUpdate}
                onOpenProgress={openProgress}
              />
            </div>
          )}
          {classStudents.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No students enrolled in this class.
            </p>
          )}
        </CardContent>
      </Card>

      <TaskProgressDialog
        open={progressRecord !== null}
        onOpenChange={(open) => {
          if (!open) setProgressRecord(null);
        }}
        record={progressRecord}
        task={task}
        studentName={progressStudentName}
      />
    </div>
  );
}
