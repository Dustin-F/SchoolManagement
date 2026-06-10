import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Settings2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store";
import type { BehaviourSkill, SchoolClass, Student } from "@/types";
import { getPersonInitials, getStudentDisplayName } from "@/lib/displayHelpers";
import {
  pointsByStudent,
  skillButtonClass,
  skillsForClassToolbar,
  sumPoints,
} from "@/lib/pointsUtils";
import { cn } from "@/lib/utils";

interface ClassPointsPanelProps {
  cls: SchoolClass;
  students: Student[];
  sessionDate: string;
}

export function ClassPointsPanel({ cls, students, sessionDate }: ClassPointsPanelProps) {
  const behaviourSkills = useAppStore((s) => s.behaviourSkills);
  const pointEvents = useAppStore((s) => s.pointEvents);
  const addPointEvent = useAppStore((s) => s.addPointEvent);
  const deletePointEvent = useAppStore((s) => s.deletePointEvent);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    students[0]?.id ?? null
  );
  const [note, setNote] = useState("");

  const toolbarSkills = useMemo(
    () => skillsForClassToolbar(behaviourSkills, cls),
    [behaviourSkills, cls]
  );

  const todayClassEvents = useMemo(
    () =>
      pointEvents.filter(
        (e) => e.classId === cls.id && e.date === sessionDate
      ),
    [pointEvents, cls.id, sessionDate]
  );

  const todayByStudent = useMemo(
    () => pointsByStudent(todayClassEvents, students.map((s) => s.id)),
    [todayClassEvents, students]
  );

  const classTodayTotal = sumPoints(todayClassEvents);

  const awardSkill = (skill: BehaviourSkill) => {
    if (!selectedStudentId) {
      toast.info("Select a student first.");
      return;
    }
    const eventId = addPointEvent({
      studentId: selectedStudentId,
      skillId: skill.id,
      classId: cls.id,
      date: sessionDate,
      points: skill.points,
      note: note.trim() || undefined,
    });
    const student = students.find((s) => s.id === selectedStudentId);
    const sign = skill.points > 0 ? "+" : "";
    toast.success(`${sign}${skill.points} ${skill.name} → ${student ? getStudentDisplayName(student) : "student"}`, {
      action: {
        label: "Undo",
        onClick: () => deletePointEvent(eventId),
      },
      duration: 5000,
    });
    setNote("");
  };

  if (students.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            Class points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Add students to award points during class.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            Class points
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a student, tap a skill. Class total today:{" "}
            <span className="font-semibold text-foreground">{classTodayTotal}</span>
          </p>
        </div>
        <Button asChild type="button" variant="outline" size="sm">
          <Link to="/points?tab=skills">
            <Settings2 className="mr-1.5 h-4 w-4" />
            Manage skills
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {students.map((student) => {
            const pts = todayByStudent.get(student.id) ?? 0;
            const selected = selectedStudentId === student.id;
            return (
              <button
                key={student.id}
                type="button"
                onClick={() => setSelectedStudentId(student.id)}
                className={cn(
                  "flex flex-col items-center rounded-lg border p-3 text-center transition-colors",
                  selected
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : "border-border bg-card hover:bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "mb-1.5 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
                    selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  )}
                >
                  {getPersonInitials(student)}
                </span>
                <span className="line-clamp-2 text-xs font-medium leading-tight">
                  {getStudentDisplayName(student)}
                </span>
                <span
                  className={cn(
                    "mt-1 text-sm font-bold tabular-nums",
                    pts > 0 && "text-emerald-600 dark:text-emerald-400",
                    pts < 0 && "text-amber-600 dark:text-amber-400",
                    pts === 0 && "text-muted-foreground"
                  )}
                >
                  {pts > 0 ? `+${pts}` : pts}
                </span>
              </button>
            );
          })}
        </div>

        {toolbarSkills.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active skills yet.{" "}
            <Link to="/points?tab=skills" className="text-primary hover:underline">
              Create school-wide skills
            </Link>
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {toolbarSkills.map((skill) => (
                <Button
                  key={skill.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn("h-auto min-h-9 flex-col gap-0.5 px-3 py-2 sm:flex-row sm:gap-2", skillButtonClass(skill))}
                  onClick={() => awardSkill(skill)}
                  disabled={!selectedStudentId}
                >
                  <span className="text-base leading-none">{skill.emoji ?? "•"}</span>
                  <span className="text-xs font-medium">{skill.name}</span>
                  <span className="text-xs font-bold tabular-nums">
                    {skill.points > 0 ? `+${skill.points}` : skill.points}
                  </span>
                </Button>
              ))}
            </div>
            <Input
              placeholder="Optional note for next point (Enter skill again to save)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="max-w-md"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
