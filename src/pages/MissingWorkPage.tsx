import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
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
  type AttentionReason,
} from "@/lib/attentionUtils";
import {
  IncompleteTodoRowCard,
  IncompleteTodoSummaryChips,
} from "@/features/incomplete/IncompleteTodoParts";
import { getLocalToday } from "@/lib/utils";

export function MissingWorkPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const classFilter = searchParams.get("class") ?? "all";
  const reasonFilter = (searchParams.get("type") ?? "all") as AttentionReason | "all";

  const { items, summary, hasLessonsToday, activeClassList } = useIncompleteTodoData();
  const classTasks = useAppStore((s) => s.classTasks);
  const studentTaskRecords = useAppStore((s) => s.studentTaskRecords);
  const todayStr = getLocalToday();

  const rows = useMemo(() => {
    const expanded = expandIncompleteTodoRows(items, classTasks, studentTaskRecords, todayStr);
    return filterIncompleteTodoRows(expanded, {
      classId: classFilter,
      reason: reasonFilter,
    });
  }, [items, classTasks, studentTaskRecords, todayStr, classFilter, reasonFilter]);

  const setClassFilter = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("class");
    else next.set("class", value);
    setSearchParams(next, { replace: true });
  };

  const setReasonFilter = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("type");
    else next.set("type", value);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incomplete & to-do"
        description="Unmarked attendance, missing work, and overdue tasks across your classes."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {activeClassList.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
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
        }
      />

      {summary.total > 0 && (
        <div className="space-y-2">
          <IncompleteTodoSummaryChips summary={summary} />
          {!hasLessonsToday && summary.noAttendance === 0 && (
            <p className="text-xs text-muted-foreground">
              No classes scheduled today — attendance items only appear for classes that meet today.
            </p>
          )}
        </div>
      )}

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {summary.total === 0
              ? "All caught up — nothing needs follow-up right now."
              : "No items match the current filters."}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id}>
              <IncompleteTodoRowCard row={row} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
