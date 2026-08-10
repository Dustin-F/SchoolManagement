import { useEffect, useState } from "react";
import { ChevronDown, LayoutGrid } from "lucide-react";
import type { BehaviourSkill, SchoolClass } from "@/types";
import { SeatingBulkToolbar } from "@/features/classes/SeatingBulkToolbar";
import { SeatLayoutPicker } from "@/features/classes/ClassSeatingGrid";
import { cn } from "@/lib/utils";

interface SeatingControlsPanelProps {
  cls: SchoolClass;
  selectedIds: Set<string>;
  toolbarSkills: BehaviourSkill[];
  selectMode: boolean;
  rowCount: number;
  onToggleSelectMode: () => void;
  onMarkPresent: (studentIds: string[]) => void;
  onAwardSkill: (studentIds: string[], skill: BehaviourSkill) => void;
  onSelectRow: (rowIndex: number) => void;
}

export function SeatingControlsPanel({
  cls,
  selectedIds,
  toolbarSkills,
  selectMode,
  rowCount,
  onToggleSelectMode,
  onMarkPresent,
  onAwardSkill,
  onSelectRow,
}: SeatingControlsPanelProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (selectMode) setOpen(true);
  }, [selectMode]);

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-muted/30 sm:px-4"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-center gap-2">
          <LayoutGrid className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-sm font-medium">Layout & bulk select</p>
            {!open && (
              <p className="truncate text-xs text-muted-foreground">
                Grid size, select seats, mark rows present
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {selectMode && selectedIds.size > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {selectedIds.size} selected
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </div>
      </button>

      {open && (
        <div className="space-y-3 border-t border-border px-3 py-3 sm:px-4">
          <SeatingBulkToolbar
            cls={cls}
            selectedIds={selectedIds}
            toolbarSkills={toolbarSkills}
            selectMode={selectMode}
            onToggleSelectMode={onToggleSelectMode}
            onMarkPresent={onMarkPresent}
            onAwardSkill={onAwardSkill}
            onSelectRow={onSelectRow}
            rowCount={rowCount}
          />
          <SeatLayoutPicker cls={cls} />
        </div>
      )}
    </div>
  );
}
