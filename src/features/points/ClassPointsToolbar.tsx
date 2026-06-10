import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Settings2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store";
import type { BehaviourSkill, SchoolClass, Student } from "@/types";
import { getStudentDisplayName } from "@/lib/displayHelpers";
import { skillButtonClass, skillsForClassToolbar, sumPoints } from "@/lib/pointsUtils";
import { cn } from "@/lib/utils";

interface ClassPointsToolbarProps {
  cls: SchoolClass;
  students: Student[];
  sessionDate: string;
  selectedStudentId: string | null;
}

export function ClassPointsToolbar({
  cls,
  students,
  sessionDate,
  selectedStudentId,
}: ClassPointsToolbarProps) {
  const behaviourSkills = useAppStore((s) => s.behaviourSkills);
  const pointEvents = useAppStore((s) => s.pointEvents);
  const addPointEvent = useAppStore((s) => s.addPointEvent);
  const deletePointEvent = useAppStore((s) => s.deletePointEvent);

  const [note, setNote] = useState("");

  const toolbarSkills = useMemo(
    () => skillsForClassToolbar(behaviourSkills, cls),
    [behaviourSkills, cls]
  );

  const classTodayTotal = useMemo(
    () =>
      sumPoints(
        pointEvents.filter((e) => e.classId === cls.id && e.date === sessionDate)
      ),
    [pointEvents, cls.id, sessionDate]
  );

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const awardSkill = (skill: BehaviourSkill) => {
    if (!selectedStudentId) {
      toast.info("Select a student in the roster first.");
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
    const sign = skill.points > 0 ? "+" : "";
    toast.success(
      `${sign}${skill.points} ${skill.name} → ${selectedStudent ? getStudentDisplayName(selectedStudent) : "student"}`,
      {
        action: {
          label: "Undo",
          onClick: () => deletePointEvent(eventId),
        },
        duration: 5000,
      }
    );
    setNote("");
  };

  if (students.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />
            Points
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {selectedStudent ? (
              <>
                Awarding to{" "}
                <span className="font-semibold text-foreground">
                  {getStudentDisplayName(selectedStudent)}
                </span>
              </>
            ) : (
              "Tap a student row below, then tap a skill."
            )}
            <span className="mx-1.5 text-border">·</span>
            Class today:{" "}
            <span className="font-semibold text-foreground tabular-nums">{classTodayTotal}</span>
          </p>
        </div>
        <Button asChild type="button" variant="outline" size="sm" className="shrink-0">
          <Link to="/points?tab=skills">
            <Settings2 className="mr-1.5 h-4 w-4" />
            Manage skills
          </Link>
        </Button>
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
                className={cn(
                  "h-auto min-h-9 flex-col gap-0.5 px-3 py-2 sm:flex-row sm:gap-2",
                  skillButtonClass(skill)
                )}
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
            placeholder="Optional note for the next point"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="max-w-md"
            disabled={!selectedStudentId}
          />
        </>
      )}
    </div>
  );
}
