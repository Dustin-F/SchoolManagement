import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ChevronDown, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IncompleteTodoRowCard,
  IncompleteTodoSummaryChips,
} from "@/features/incomplete/IncompleteTodoParts";
import { useIncompleteTodoData } from "@/hooks/useIncompleteTodoData";
import { expandIncompleteTodoRows } from "@/lib/attentionUtils";
import { useAppStore } from "@/store";
import { cn, getLocalToday } from "@/lib/utils";

const DISPLAY_LIMIT = 8;

export function DashboardIncompleteCard() {
  const [open, setOpen] = useState(false);
  const { items, summary, hasLessonsToday } = useIncompleteTodoData();
  const classTasks = useAppStore((s) => s.classTasks);
  const studentTaskRecords = useAppStore((s) => s.studentTaskRecords);
  const todayStr = getLocalToday();

  const previewRows = useMemo(
    () => expandIncompleteTodoRows(items, classTasks, studentTaskRecords, todayStr).slice(0, DISPLAY_LIMIT),
    [items, classTasks, studentTaskRecords, todayStr]
  );

  const totalRows = useMemo(
    () => expandIncompleteTodoRows(items, classTasks, studentTaskRecords, todayStr).length,
    [items, classTasks, studentTaskRecords, todayStr]
  );

  const hiddenCount = totalRows - previewRows.length;

  return (
    <Card className={cn(summary.total > 0 && "border-amber-500/25")}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left hover:bg-muted/30"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-center gap-2">
          {summary.total > 0 ? (
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-foreground">Incomplete &amp; to-do</p>
            {!open && (
              <p className="truncate text-xs text-muted-foreground">
                {summary.total > 0
                  ? `${totalRows} item${totalRows !== 1 ? "s" : ""} need follow-up`
                  : "All caught up for today"}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {summary.total > 0 && (
            <Badge variant="secondary" className="tabular-nums">
              {totalRows}
            </Badge>
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
        <CardContent className="space-y-4 border-t border-border pt-4">
          {summary.total === 0 ? (
            <p className="text-sm text-muted-foreground">
              No unmarked attendance or missing work to follow up on.
            </p>
          ) : (
            <>
              <IncompleteTodoSummaryChips summary={summary} />

              {!hasLessonsToday && summary.noAttendance === 0 && (
                <p className="text-xs text-muted-foreground">
                  No classes scheduled today — showing assignment issues across all classes.
                </p>
              )}

              <ul className="space-y-2">
                {previewRows.map((row) => (
                  <li key={row.id}>
                    <IncompleteTodoRowCard row={row} />
                  </li>
                ))}
              </ul>

              {hiddenCount > 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  +{hiddenCount} more item{hiddenCount !== 1 ? "s" : ""}
                </p>
              )}
            </>
          )}

          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to="/missing-work">
                <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                View all incomplete
              </Link>
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
