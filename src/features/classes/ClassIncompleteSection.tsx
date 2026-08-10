import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store";
import { useIncompleteTodoData } from "@/hooks/useIncompleteTodoData";
import {
  ATTENTION_FILTER_OPTIONS,
  expandIncompleteTodoRows,
  filterIncompleteTodoRows,
  summarizeIncompleteTodo,
  type AttentionReason,
} from "@/lib/attentionUtils";
import { getOccurrencesOnDate } from "@/lib/scheduleUtils";
import {
  IncompleteTodoRowCard,
  IncompleteTodoSummaryChips,
} from "@/features/incomplete/IncompleteTodoParts";

interface ClassIncompleteSectionProps {
  classId: string;
}

export function ClassIncompleteSection({ classId }: ClassIncompleteSectionProps) {
  const [reasonFilter, setReasonFilter] = useState<AttentionReason | "all">("all");
  const { items, todayStr } = useIncompleteTodoData();
  const classTasks = useAppStore((s) => s.classTasks);
  const studentTaskRecords = useAppStore((s) => s.studentTaskRecords);
  const classScheduleEvents = useAppStore((s) => s.classScheduleEvents);
  const classSessionExceptions = useAppStore((s) => s.classSessionExceptions);

  const classItems = useMemo(
    () => items.filter((item) => item.classId === classId),
    [items, classId]
  );
  const summary = useMemo(() => summarizeIncompleteTodo(classItems), [classItems]);

  const hasLessonToday = useMemo(
    () =>
      getOccurrencesOnDate(classId, todayStr, classScheduleEvents, classSessionExceptions).length >
      0,
    [classId, todayStr, classScheduleEvents, classSessionExceptions]
  );

  const rows = useMemo(() => {
    const expanded = expandIncompleteTodoRows(classItems, classTasks, studentTaskRecords, todayStr);
    return filterIncompleteTodoRows(expanded, { classId, reason: reasonFilter });
  }, [classItems, classTasks, studentTaskRecords, todayStr, classId, reasonFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">Incomplete & to-do</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Unmarked attendance, missing work, and overdue tasks for this class.
          </p>
        </div>
        <Select
          value={reasonFilter}
          onValueChange={(value) => setReasonFilter(value as AttentionReason | "all")}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {ATTENTION_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {summary.total > 0 && (
        <div className="space-y-2">
          <IncompleteTodoSummaryChips summary={summary} />
          {!hasLessonToday && summary.noAttendance === 0 && (
            <p className="text-xs text-muted-foreground">
              No session scheduled today — attendance items only appear when this class meets today.
            </p>
          )}
        </div>
      )}

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {summary.total === 0
              ? "All caught up — nothing needs follow-up for this class."
              : "No items match the current filter."}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-2">
            {rows.map((row) => (
              <IncompleteTodoRowCard key={row.id} row={row} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function useClassIncompleteCount(classId: string): number {
  const { items } = useIncompleteTodoData();
  return useMemo(() => items.filter((item) => item.classId === classId).length, [items, classId]);
}
