import type { ClassScheduleEvent } from "@/types";
import { formatRecurrenceLabel } from "@/lib/scheduleUtils";
import { DAY_SHORT } from "@/lib/utils";

export function formatScheduleSummary(events: ClassScheduleEvent[]): string {
  if (events.length === 0) return "No sessions scheduled";
  const parts = events.slice(0, 3).map((event) => {
    const time = `${event.startTime}–${event.endTime}`;
    if (event.recurrence.frequency === "none") {
      return event.title?.trim() || `Once ${event.startDate} ${time}`;
    }
    if (event.recurrence.frequency === "weekly" && event.recurrence.daysOfWeek?.length) {
      const days = event.recurrence.daysOfWeek.map((d) => DAY_SHORT[d]).join("/");
      return `${days} ${time}`;
    }
    return `${formatRecurrenceLabel(event)} ${time}`;
  });
  const extra = events.length > 3 ? ` +${events.length - 3} more` : "";
  return parts.join(", ") + extra;
}
