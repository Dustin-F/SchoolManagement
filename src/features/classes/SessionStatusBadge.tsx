import { Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SESSION_STATUS_HINTS,
  SESSION_STATUS_LABELS,
  MANUAL_SESSION_STATUSES,
  sessionStatusBadgeCn,
  type ClassSessionStatus,
} from "@/lib/sessionUtils";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";

interface SessionStatusBadgeProps {
  classId: string;
  sessionDate: string;
  eventId?: string;
  occurrenceDate?: string;
  status: ClassSessionStatus;
  disabled?: boolean;
  compact?: boolean;
}

export function SessionStatusBadge({
  classId,
  sessionDate,
  eventId,
  occurrenceDate,
  status,
  disabled,
  compact,
}: SessionStatusBadgeProps) {
  const upsertClassSession = useAppStore((s) => s.upsertClassSession);

  const sessionPatch = (patch: Parameters<typeof upsertClassSession>[2]) => {
    upsertClassSession(classId, sessionDate, {
      eventId,
      occurrenceDate,
      ...patch,
    });
  };

  const applyStatus = (next: ClassSessionStatus) => {
    if (next === status) return;
    const ts = new Date().toISOString();

    if (next === "planned") {
      sessionPatch({
        status: "planned",
        completedAt: undefined,
        cancelledAt: undefined,
        cancelledReason: undefined,
      });
      toast.success("Session marked as planned.");
      return;
    }

    if (next === "completed") {
      sessionPatch({
        status: "completed",
        completedAt: ts,
        cancelledAt: undefined,
        cancelledReason: undefined,
      });
      toast.success("Session marked as completed.");
      return;
    }

    sessionPatch({
      status: "cancelled",
      cancelledAt: ts,
      completedAt: undefined,
    });
    toast.success("Session cancelled.");
  };

  const clickable = !disabled && status !== "in_progress";

  if (!clickable) {
    return (
      <Badge
        variant="outline"
        title={SESSION_STATUS_HINTS[status]}
        className={sessionStatusBadgeCn(status, false, compact)}
      >
        {SESSION_STATUS_LABELS[status]}
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          title={SESSION_STATUS_HINTS[status]}
          className={cn(
            "inline-flex rounded-full border px-2.5 py-0.5 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            sessionStatusBadgeCn(status, true, compact)
          )}
        >
          {SESSION_STATUS_LABELS[status]}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {MANUAL_SESSION_STATUSES.map((option) => (
          <DropdownMenuItem
            key={option}
            className={cn(
              option === "cancelled" && "text-destructive focus:text-destructive",
              option === "completed" &&
                status !== option &&
                "text-green-700 focus:text-green-700 dark:text-green-300 dark:focus:text-green-300"
            )}
            onClick={(e) => {
              e.stopPropagation();
              applyStatus(option);
            }}
          >
            <Check
              className={cn("mr-2 h-4 w-4 shrink-0", status !== option && "opacity-0")}
            />
            {SESSION_STATUS_LABELS[option]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
