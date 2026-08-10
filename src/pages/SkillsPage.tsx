import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { SkillFormDialog } from "@/features/points/SkillFormDialog";
import { useAppStore } from "@/store";
import type { BehaviourSkill } from "@/types";
import { skillButtonClass } from "@/lib/pointsUtils";
import { cn } from "@/lib/utils";

export function SkillsPage() {
  const behaviourSkills = useAppStore((s) => s.behaviourSkills);
  const deleteBehaviourSkill = useAppStore((s) => s.deleteBehaviourSkill);
  const updateBehaviourSkill = useAppStore((s) => s.updateBehaviourSkill);

  const [skillFormOpen, setSkillFormOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<BehaviourSkill | null>(null);

  const sortedSkills = useMemo(
    () => [...behaviourSkills].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [behaviourSkills]
  );

  const nextSortOrder =
    sortedSkills.length === 0 ? 0 : Math.max(...sortedSkills.map((s) => s.sortOrder)) + 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Point skills"
        description="Create the positive and negative skills you award during class sessions."
        actions={
          <Button
            type="button"
            onClick={() => {
              setEditingSkill(null);
              setSkillFormOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add skill
          </Button>
        }
      />

      {sortedSkills.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No skills yet. Add a few (e.g. Participation +1, Off task −1), then award them from a class session.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sortedSkills.map((skill) => (
            <div
              key={skill.id}
              className={cn(
                "flex items-center justify-between rounded-lg border p-3",
                skill.active ? "border-border" : "border-dashed opacity-60",
                skillButtonClass(skill)
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-xl">{skill.emoji ?? "•"}</span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{skill.name}</p>
                  <p className="text-xs opacity-80">
                    {skill.points > 0 ? `+${skill.points}` : skill.points} ·{" "}
                    {skill.type === "positive" ? "Positive" : "Negative"}
                    {!skill.active && " · Archived"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={`Edit ${skill.name}`}
                  onClick={() => {
                    setEditingSkill(skill);
                    setSkillFormOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {skill.active ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={`Archive ${skill.name}`}
                    onClick={() => {
                      deleteBehaviourSkill(skill.id);
                      toast.success(`"${skill.name}" archived.`);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      updateBehaviourSkill(skill.id, { active: true });
                      toast.success(`"${skill.name}" restored.`);
                    }}
                  >
                    Restore
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <SkillFormDialog
        open={skillFormOpen}
        onOpenChange={setSkillFormOpen}
        editingSkill={editingSkill}
        nextSortOrder={nextSortOrder}
      />
    </div>
  );
}
