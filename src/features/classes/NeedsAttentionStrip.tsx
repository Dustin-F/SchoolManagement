import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { StudentAttentionFlag } from "@/lib/attentionUtils";
import { ATTENTION_LABELS } from "@/lib/attentionUtils";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface NeedsAttentionStripProps {
  flags: StudentAttentionFlag[];
  onSelectStudent?: (studentId: string) => void;
  selectedStudentId?: string | null;
}

export function NeedsAttentionStrip({
  flags,
  onSelectStudent,
  selectedStudentId,
}: NeedsAttentionStripProps) {
  const [open, setOpen] = useState(false);

  if (flags.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-500/15 dark:text-amber-100"
          aria-label={`${flags.length} students need attention`}
        >
          <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">Needs attention</span>
          <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold leading-none text-white dark:bg-amber-500">
            {flags.length}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <p className="mb-2 px-1 text-xs font-semibold text-muted-foreground">
          Tap a student to focus
        </p>
        <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">
          {flags.map((flag) => (
            <button
              key={flag.studentId}
              type="button"
              onClick={() => {
                onSelectStudent?.(flag.studentId);
                setOpen(false);
              }}
              className={cn(
                "rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                selectedStudentId === flag.studentId
                  ? "bg-primary/10 text-foreground"
                  : "hover:bg-muted"
              )}
            >
              <span className="font-medium">{flag.studentName}</span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground">
                {flag.reasons.map((r) => ATTENTION_LABELS[r]).join(" · ")}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
