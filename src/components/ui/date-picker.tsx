import { useMemo, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DayOfWeek } from "@/types";
import { isDateOnScheduledWeekday } from "@/lib/scheduleUtils";
import { cn, formatDate, isIsoDateString, parseIsoDateString, toLocalDateString } from "@/lib/utils";

export interface DatePickerProps {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Show a clear button for optional dates. */
  clearable?: boolean;
  /** @deprecated Use highlightDates for concrete scheduled session dates. */
  scheduleDaysOfWeek?: DayOfWeek[];
  /** Highlight specific ISO dates that have scheduled sessions. */
  highlightDates?: string[];
}

function calendarBounds() {
  const startMonth = new Date();
  startMonth.setFullYear(startMonth.getFullYear() - 1);
  startMonth.setDate(1);

  const endMonth = new Date();
  endMonth.setFullYear(endMonth.getFullYear() + 2);
  endMonth.setMonth(11, 31);

  return { startMonth, endMonth };
}

export function DatePicker({
  id,
  value = "",
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
  clearable = false,
  scheduleDaysOfWeek,
  highlightDates,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseIsoDateString(value);
  const highlightSet = new Set(highlightDates ?? []);
  const highlightWeekdays = (scheduleDaysOfWeek?.length ?? 0) > 0;
  const highlightConcrete = highlightSet.size > 0;
  const { startMonth, endMonth } = useMemo(() => calendarBounds(), []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {isIsoDateString(value) ? formatDate(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? new Date()}
          startMonth={startMonth}
          endMonth={endMonth}
          captionLayout="dropdown"
          modifiers={{
            ...(highlightWeekdays
              ? {
                  scheduled: (date) => isDateOnScheduledWeekday(scheduleDaysOfWeek!, date),
                }
              : {}),
            ...(highlightConcrete
              ? {
                  scheduled: (date) => highlightSet.has(toLocalDateString(date)),
                }
              : {}),
          }}
          modifiersClassNames={
            highlightWeekdays || highlightConcrete
              ? {
                  scheduled:
                    "bg-primary/15 font-semibold text-primary ring-1 ring-primary/25 rounded-md",
                }
              : undefined
          }
          onSelect={(date) => {
            if (!date) return;
            onChange?.(toLocalDateString(date));
            setOpen(false);
          }}
        />
        {highlightWeekdays || highlightConcrete ? (
          <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
            Highlighted days have scheduled sessions.
          </div>
        ) : null}
        {clearable && value ? (
          <div className="border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange?.("");
                setOpen(false);
              }}
            >
              Clear date
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
