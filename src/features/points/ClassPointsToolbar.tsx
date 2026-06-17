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
import { HintTooltip } from "@/components/ui/hint-tooltip";

interface ClassPointsToolbarProps {
  cls: SchoolClass;
  students: Student[];
  sessionDate: string;
  selectedStudentId: string | null;
  /** Compact layout for inside the student detail dialog. */
  embedded?: boolean;
  readOnly?: boolean;
}

export function ClassPointsToolbar({
  cls,
  students,
  sessionDate,
  selectedStudentId,
  embedded = false,
  readOnly = false,
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
    if (readOnly) return;
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
        <HintTooltip
          content={
            selectedStudent
              ? `Awarding to ${getStudentDisplayName(selectedStudent)}. Tap a skill or press 1–4.`
              : "Select a student, then tap a skill or press 1–4."
          }
        >
          <div className="min-w-0 w-fit">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />
              {embedded ? "Award points" : "Points"}
              {!embedded ? (
                <span className="text-xs font-normal text-muted-foreground tabular-nums">
                  · {classTodayTotal} today
                </span>
              ) : null}
            </p>
          </div>
        </HintTooltip>
        <HintTooltip content="Create and edit school-wide behaviour skills.">
          <Button asChild type="button" variant="outline" size="sm" className="shrink-0">
            <Link to={`/points?tab=skills&classId=${cls.id}`}>
              <Settings2 className="mr-1.5 h-4 w-4" />
              Manage skills
            </Link>
          </Button>
        </HintTooltip>
      </div>

      {toolbarSkills.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No active skills yet.{" "}
          <Link to={`/points?tab=skills&classId=${cls.id}`} className="text-primary hover:underline">
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
                disabled={readOnly || !selectedStudentId}
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
            disabled={readOnly || !selectedStudentId}
          />
        </>
      )}
    </div>
  );
}
