import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { scheduleEventSchema, type ScheduleEventFormData } from "@/lib/schemas";
import { defaultRecurrence, defaultWeeklyRecurrence } from "@/lib/scheduleMigration";
import { dayOfWeekFromDate } from "@/lib/scheduleUtils";
import { cn, DAY_ORDER } from "@/lib/utils";
import type { ClassScheduleEvent, DayOfWeek } from "@/types";

const dayLabels: Record<DayOfWeek, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

interface ScheduleEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent?: ClassScheduleEvent | null;
  /** When editing a single occurrence of a series. */
  occurrenceDate?: string;
  defaultDate?: string;
  onSave: (data: ScheduleEventFormData) => void;
}

function eventToForm(event: ClassScheduleEvent, occurrenceDate?: string): ScheduleEventFormData {
  return {
    title: event.title ?? "",
    startDate: occurrenceDate ?? event.startDate,
    startTime: event.startTime,
    endTime: event.endTime,
    recurrence: { ...event.recurrence, daysOfWeek: event.recurrence.daysOfWeek ?? [] },
  };
}

function emptyForm(defaultDate: string): ScheduleEventFormData {
  return {
    title: "",
    startDate: defaultDate,
    startTime: "09:00",
    endTime: "10:00",
    recurrence: defaultWeeklyRecurrence(dayOfWeekFromDate(defaultDate)),
  };
}

export function ScheduleEventDialog({
  open,
  onOpenChange,
  editingEvent,
  occurrenceDate,
  defaultDate,
  onSave,
}: ScheduleEventDialogProps) {
  const isOccurrenceEdit = Boolean(editingEvent && occurrenceDate && editingEvent.recurrence.frequency !== "none");

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ScheduleEventFormData>({
    resolver: zodResolver(scheduleEventSchema),
    defaultValues: emptyForm(defaultDate ?? new Date().toISOString().slice(0, 10)),
  });

  const frequency = watch("recurrence.frequency");
  const endType = watch("recurrence.endType");
  const daysOfWeek = watch("recurrence.daysOfWeek") ?? [];

  useEffect(() => {
    if (!open) return;
    if (editingEvent) {
      reset(eventToForm(editingEvent, occurrenceDate));
    } else {
      reset(emptyForm(defaultDate ?? new Date().toISOString().slice(0, 10)));
    }
  }, [open, editingEvent, occurrenceDate, defaultDate, reset]);

  const toggleDay = (day: DayOfWeek) => {
    const next = daysOfWeek.includes(day)
      ? daysOfWeek.filter((d) => d !== day)
      : [...daysOfWeek, day];
    setValue("recurrence.daysOfWeek", next, { shouldValidate: true });
  };

  const onSubmit = (data: ScheduleEventFormData) => {
    onSave({
      ...data,
      title: data.title?.trim() || undefined,
      recurrence: {
        ...data.recurrence,
        daysOfWeek:
          data.recurrence.frequency === "weekly" ? data.recurrence.daysOfWeek : undefined,
        endDate: data.recurrence.endType === "on_date" ? data.recurrence.endDate : undefined,
        occurrenceCount:
          data.recurrence.endType === "after_count" ? data.recurrence.occurrenceCount : undefined,
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingEvent ? (isOccurrenceEdit ? "Edit session" : "Edit schedule") : "Schedule session"}
          </DialogTitle>
          <DialogDescription>
            Set date, time, and recurrence — like Outlook. One-time or repeating with an end date.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schedule-title">Title (optional)</Label>
            <Input
              id="schedule-title"
              placeholder="e.g. Lab practical, Mock exam"
              {...register("title")}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Date</Label>
              <Controller
                control={control}
                name="startDate"
                render={({ field }) => (
                  <DatePicker value={field.value} onChange={field.onChange} className="w-full" />
                )}
              />
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start</Label>
              <Input id="startTime" type="time" {...register("startTime")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End</Label>
              <Input id="endTime" type="time" {...register("endTime")} />
              {errors.endTime && (
                <p className="text-xs text-destructive">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {!isOccurrenceEdit && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Repeat</Label>
                  <Controller
                    control={control}
                    name="recurrence.frequency"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(val) => {
                          field.onChange(val);
                          if (val === "none") {
                            setValue("recurrence", defaultRecurrence());
                          } else if (val === "weekly") {
                            const date = watch("startDate");
                            setValue("recurrence", defaultWeeklyRecurrence(dayOfWeekFromDate(date)));
                          } else if (val === "daily") {
                            setValue("recurrence", {
                              frequency: "daily",
                              interval: 1,
                              endType: "never",
                            });
                          } else {
                            setValue("recurrence", {
                              frequency: "monthly",
                              interval: 1,
                              endType: "never",
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Does not repeat</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {frequency !== "none" && (
                  <div className="space-y-2">
                    <Label>Every</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={52}
                        className="w-20"
                        {...register("recurrence.interval", { valueAsNumber: true })}
                      />
                      <span className="text-sm text-muted-foreground">
                        {frequency === "daily" && "day(s)"}
                        {frequency === "weekly" && "week(s)"}
                        {frequency === "monthly" && "month(s)"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {frequency === "weekly" && (
                <div className="space-y-2">
                  <Label>On days</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAY_ORDER.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-sm transition-colors",
                          daysOfWeek.includes(day)
                            ? "border-primary bg-primary/10 font-medium text-primary"
                            : "border-border text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        {dayLabels[day]}
                      </button>
                    ))}
                  </div>
                  {errors.recurrence?.daysOfWeek && (
                    <p className="text-xs text-destructive">
                      {errors.recurrence.daysOfWeek.message}
                    </p>
                  )}
                </div>
              )}

              {frequency !== "none" && (
                <div className="space-y-2">
                  <Label>Ends</Label>
                  <Controller
                    control={control}
                    name="recurrence.endType"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="never">Never</SelectItem>
                          <SelectItem value="on_date">On date</SelectItem>
                          <SelectItem value="after_count">After occurrences</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {endType === "on_date" && (
                    <Controller
                      control={control}
                      name="recurrence.endDate"
                      render={({ field }) => (
                        <DatePicker
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          className="w-full"
                        />
                      )}
                    />
                  )}
                  {endType === "after_count" && (
                    <Input
                      type="number"
                      min={1}
                      max={500}
                      placeholder="Number of sessions"
                      {...register("recurrence.occurrenceCount", { valueAsNumber: true })}
                    />
                  )}
                </div>
              )}
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingEvent ? "Save" : "Add to schedule"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
