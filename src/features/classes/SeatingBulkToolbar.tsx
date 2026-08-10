import { useEffect, useState } from "react";
import { CheckSquare, ChevronDown, Sparkles, Users } from "lucide-react";
import type { BehaviourSkill, SchoolClass } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSeatColumns } from "@/lib/seatingUtils";
import { skillButtonClass } from "@/lib/pointsUtils";
import { cn } from "@/lib/utils";

interface SeatingBulkToolbarProps {
  cls: SchoolClass;
  selectedIds: Set<string>;
  toolbarSkills: BehaviourSkill[];
  onToggleSelectMode: () => void;
  selectMode: boolean;
  onMarkPresent: (studentIds: string[]) => void;
  onAwardSkill: (studentIds: string[], skill: BehaviourSkill) => void;
  onSelectRow: (rowIndex: number) => void;
  rowCount: number;
}

export function SeatingBulkToolbar({
  cls,
  selectedIds,
  toolbarSkills,
  onToggleSelectMode,
  selectMode,
  onMarkPresent,
  onAwardSkill,
  onSelectRow,
  rowCount,
}: SeatingBulkToolbarProps) {
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [rowSelectOpen, setRowSelectOpen] = useState(false);
  const count = selectedIds.size;
  const columns = getSeatColumns(cls);

  useEffect(() => {
    if (!selectMode) setRowSelectOpen(false);
  }, [selectMode]);

  const handleAwardSkill = (skill: BehaviourSkill) => {
    onAwardSkill([...selectedIds], skill);
    setSkillDialogOpen(false);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 p-2">
        <Button
          type="button"
          size="sm"
          variant={selectMode ? "default" : "outline"}
          className="h-8 text-xs"
          onClick={onToggleSelectMode}
        >
          <CheckSquare className="mr-1.5 h-3.5 w-3.5" />
          {selectMode ? "Done selecting" : "Select seats"}
        </Button>

        {selectMode && count > 0 && (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => onMarkPresent([...selectedIds])}
            >
              <Users className="mr-1.5 h-3.5 w-3.5" />
              Mark {count} present
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => setSkillDialogOpen(true)}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Award skill ({count})
            </Button>
          </>
        )}

        {selectMode && rowCount > 0 && (
          <div className="w-full border-t border-border/60 pt-2">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-1 text-left hover:bg-muted/40"
              onClick={() => setRowSelectOpen((v) => !v)}
              aria-expanded={rowSelectOpen}
            >
              <span className="text-[10px] font-medium text-muted-foreground">Select by row</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform",
                  rowSelectOpen && "rotate-180"
                )}
              />
            </button>
            {rowSelectOpen && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                {Array.from({ length: rowCount }, (_, i) => (
                  <Button
                    key={i}
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[10px]"
                    onClick={() => onSelectRow(i)}
                  >
                    R{i + 1}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {selectMode && (
          <span className="text-[10px] text-muted-foreground">
            {count} selected · {columns} cols
          </span>
        )}
      </div>

      <Dialog open={skillDialogOpen} onOpenChange={setSkillDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Award skill</DialogTitle>
            <DialogDescription>
              Choose a skill for {count} selected student{count !== 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          {toolbarSkills.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active skills yet. Add skills from the Points page first.
            </p>
          ) : (
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
                  onClick={() => handleAwardSkill(skill)}
                >
                  <span className="text-base leading-none">{skill.emoji ?? "•"}</span>
                  <span className="text-xs font-medium">{skill.name}</span>
                  <span className="text-xs font-bold tabular-nums">
                    {skill.points > 0 ? `+${skill.points}` : skill.points}
                  </span>
                </Button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
