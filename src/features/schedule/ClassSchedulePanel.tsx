import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  List,
  MoreHorizontal,
  Pencil,
  PlayCircle,
  Repeat,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store";
import { findSessionNote } from "@/lib/sessionNotesUtils";
import {
  formatOccurrenceTime,
  formatRecurrenceLabel,
  formatSessionDateLine,
  getAllUpcomingOccurrences,
} from "@/lib/scheduleUtils";
import {
  getEffectiveSessionStatus,
} from "@/lib/sessionUtils";
import { cn, getLocalToday } from "@/lib/utils";
import { SessionStatusBadge } from "@/features/classes/SessionStatusBadge";
import { DashboardCalendar } from "@/features/dashboard/DashboardCalendar";
import type { ClassScheduleEvent, ScheduleEditScope } from "@/types";
import type { ScheduleOccurrence } from "@/lib/scheduleUtils";
import type { ScheduleEventFormData } from "@/lib/schemas";
import { resolveScheduleEditScope } from "@/lib/scheduleEditUtils";
import { ScheduleEventDialog } from "@/features/schedule/ScheduleEventDialog";
import { ScheduleEditScopeDialog } from "@/features/schedule/ScheduleEditScopeDialog";
import { usePagination } from "@/hooks/usePagination";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
type HorizonFilter = "30" | "90" | "365";
type ScheduleView = "list" | "calendar";

interface ClassSchedulePanelProps {
  classId: string;
  className: string;
}

export function ClassSchedulePanel({ classId, className }: ClassSchedulePanelProps) {
  const navigate = useNavigate();
  const today = getLocalToday();
  const classes = useAppStore((s) => s.classes);
  const subjects = useAppStore((s) => s.subjects);
  const teachers = useAppStore((s) => s.teachers);
  const events = useAppStore((s) => s.classScheduleEvents);
  const exceptions = useAppStore((s) => s.classSessionExceptions);
  const sessionNotes = useAppStore((s) => s.classSessionNotes);
  const addScheduleEvent = useAppStore((s) => s.addScheduleEvent);
  const updateScheduleEvent = useAppStore((s) => s.updateScheduleEvent);
  const deleteScheduleEvent = useAppStore((s) => s.deleteScheduleEvent);
  const upsertClassSession = useAppStore((s) => s.upsertClassSession);

  const classEvents = useMemo(
    () => events.filter((e) => e.classId === classId && !e.cancelled),
    [events, classId]
  );

  const [horizon, setHorizon] = useState<HorizonFilter>("90");
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);
  const [view, setView] = useState<ScheduleView>("list");

  const allUpcoming = useMemo(
    () =>
      getAllUpcomingOccurrences(
        classId,
        events,
        exceptions,
        today,
        Number(horizon)
      ),
    [classId, events, exceptions, today, horizon]
  );

  const { paginated: pageItems, page, setPage, totalPages, reset: resetPage } =
    usePagination(allUpcoming, pageSize);

  useEffect(() => {
    resetPage();
  }, [horizon, pageSize, classId, resetPage]);

  const seriesSummary = useMemo(() => {
    return classEvents.map((event) => ({
      event,
      label: formatRecurrenceLabel(event),
      time: formatOccurrenceTime(event.startTime, event.endTime),
    }));
  }, [classEvents]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ClassScheduleEvent | null>(null);
  const [editingOccurrence, setEditingOccurrence] = useState<string | undefined>();
  const [pendingScopeAction, setPendingScopeAction] = useState<"edit" | "delete">("edit");
  const [selectedScope, setSelectedScope] = useState<ScheduleEditScope>("series");
  const [defaultDate, setDefaultDate] = useState(today);

  const openSession = (occ: ScheduleOccurrence) => {
    const note = findSessionNote(
      sessionNotes,
      classId,
      occ.date,
      occ.eventId,
      occ.occurrenceDate
    );
    upsertClassSession(classId, occ.date, {
      eventId: occ.eventId,
      occurrenceDate: occ.occurrenceDate,
      status: note?.status ?? "planned",
    });
    navigate(
      `/classes/${classId}?date=${occ.date}&eventId=${occ.eventId}&occurrence=${occ.occurrenceDate}`
    );
  };

  const sessionStatus = (occ: ScheduleOccurrence) => {
    const note = findSessionNote(
      sessionNotes,
      classId,
      occ.date,
      occ.eventId,
      occ.occurrenceDate
    );
    return getEffectiveSessionStatus(note, { date: occ.date, endTime: occ.endTime });
  };

  const sessionPrepared = (occ: ScheduleOccurrence) => {
    const note = findSessionNote(
      sessionNotes,
      classId,
      occ.date,
      occ.eventId,
      occ.occurrenceDate
    );
    return note?.lessonPrepared ?? false;
  };

  const startAdd = () => {
    setEditingEvent(null);
    setEditingOccurrence(undefined);
    setSelectedScope("series");
    setDefaultDate(today);
    setDialogOpen(true);
  };

  const startEdit = (event: ClassScheduleEvent, occurrenceDate?: string) => {
    const isSeries = event.recurrence.frequency !== "none" && occurrenceDate;
    if (isSeries) {
      setEditingEvent(event);
      setEditingOccurrence(occurrenceDate);
      setPendingScopeAction("edit");
      setScopeOpen(true);
      return;
    }
    setEditingEvent(event);
    setEditingOccurrence(occurrenceDate);
    setSelectedScope("series");
    setDialogOpen(true);
  };

  const startDelete = (event: ClassScheduleEvent, occurrenceDate?: string) => {
    if (event.recurrence.frequency !== "none" && occurrenceDate) {
      setEditingEvent(event);
      setEditingOccurrence(occurrenceDate);
      setPendingScopeAction("delete");
      setScopeOpen(true);
      return;
    }
    deleteScheduleEvent(event.id, "series");
    toast.success("Session removed from schedule.");
  };

  const applyScope = (scope: ScheduleEditScope) => {
    if (!editingEvent) return;
    const resolved = resolveScheduleEditScope(editingEvent, scope, editingOccurrence);
    if (pendingScopeAction === "delete") {
      deleteScheduleEvent(editingEvent.id, resolved, editingOccurrence);
      toast.success("Session removed from schedule.");
      return;
    }
    setSelectedScope(resolved);
    setDialogOpen(true);
  };

  const handleSave = (data: ScheduleEventFormData) => {
    if (editingEvent) {
      updateScheduleEvent(
        editingEvent.id,
        data,
        selectedScope,
        editingOccurrence
      );
      toast.success("Schedule updated.");
      return;
    }
    addScheduleEvent(classId, data);
    toast.success("Session added to schedule.");
  };

  const onHorizonChange = (value: HorizonFilter) => {
    setHorizon(value);
  };

  const onPageSizeChange = (value: string) => {
    setPageSize(Number(value) as (typeof PAGE_SIZE_OPTIONS)[number]);
  };

  const pageStart = (page - 1) * pageSize;
  const rangeLabel =
    allUpcoming.length === 0
      ? "No sessions"
      : `Showing ${pageStart + 1}–${Math.min(pageStart + pageSize, allUpcoming.length)} of ${allUpcoming.length}`;

  return (
    <>
      <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Schedule</h3>
          <p className="text-sm text-muted-foreground">
            Manage sessions and recurring patterns for {className}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5"
            role="group"
            aria-label="Schedule view"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-8 gap-1.5", view === "list" && "bg-background shadow-sm")}
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
              List
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("h-8 gap-1.5", view === "calendar" && "bg-background shadow-sm")}
              onClick={() => setView("calendar")}
            >
              <CalendarDays className="h-4 w-4" />
              Calendar
            </Button>
          </div>
          <Button type="button" onClick={startAdd} className="shrink-0">
            <CalendarPlus className="mr-1.5 h-4 w-4" />
            Schedule session
          </Button>
        </div>
      </div>

      {view === "calendar" ? (
        <DashboardCalendar
          classId={classId}
          title="Schedule calendar"
          emptyMessage='No sessions scheduled yet. Use "Schedule session" to add one.'
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          scheduleEvents={events}
          sessionExceptions={exceptions}
        />
      ) : (
      <Card>
        <CardHeader className="space-y-3 pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                Upcoming sessions
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Each row is a real class date. Open a session for attendance, points, and notes.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={horizon} onValueChange={(v) => onHorizonChange(v as HorizonFilter)}>
                <SelectTrigger className="h-8 w-[9.5rem] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Next 30 days</SelectItem>
                  <SelectItem value="90">Next 90 days</SelectItem>
                  <SelectItem value="365">Next 12 months</SelectItem>
                </SelectContent>
              </Select>
              <Select value={String(pageSize)} onValueChange={onPageSizeChange}>
                <SelectTrigger className="h-8 w-[5.5rem] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {allUpcoming.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
              No upcoming sessions in this range. Add a one-off or recurring session below.
            </p>
          ) : (
            <>
              <div className="divide-y divide-border rounded-lg border border-border">
                {pageItems.map((occ) => {
                  const status = sessionStatus(occ);
                  const event = classEvents.find((e) => e.id === occ.eventId);
                  const prepared = sessionPrepared(occ);
                  return (
                    <div
                      key={`${occ.eventId}:${occ.occurrenceDate}`}
                      className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => openSession(occ)}
                      >
                        <p className="font-medium text-foreground">
                          {occ.title?.trim() || className}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {formatSessionDateLine(occ.date, today)}
                          <span aria-hidden className="mx-1.5">·</span>
                          {formatOccurrenceTime(occ.startTime, occ.endTime)}
                        </p>
                      </button>
                      <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                        {prepared && (
                          <Badge variant="secondary" className="text-[10px]">
                            Prepared
                          </Badge>
                        )}
                        <SessionStatusBadge
                          classId={classId}
                          sessionDate={occ.date}
                          eventId={occ.eventId}
                          occurrenceDate={occ.occurrenceDate}
                          status={status}
                          compact
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => openSession(occ)}
                        >
                          <PlayCircle className="mr-1 h-3.5 w-3.5" />
                          Open
                        </Button>
                        {event && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => startEdit(event, occ.occurrenceDate)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => startDelete(event, occ.occurrenceDate)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">{rangeLabel}</p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="min-w-[4.5rem] text-center text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Repeat className="h-4 w-4 text-muted-foreground" />
            Recurring schedule rules
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            These patterns generate the sessions above — edit a rule to change future dates.
          </p>
        </CardHeader>
        <CardContent>
          {seriesSummary.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
              No recurring rules yet. Use &quot;Schedule session&quot; to add weekly or one-off
              classes.
            </p>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border">
              {seriesSummary.map(({ event, label, time }) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between gap-3 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {event.title?.trim() || label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {label}
                      <span aria-hidden className="mx-1.5">·</span>
                      {time}
                      {event.recurrence.endType === "on_date" && event.recurrence.endDate && (
                        <>
                          <span aria-hidden className="mx-1.5">·</span>
                          Until{" "}
                          {new Date(`${event.recurrence.endDate}T00:00:00`).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => startEdit(event)}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => startDelete(event)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      <ScheduleEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingEvent={editingEvent}
        occurrenceDate={editingOccurrence}
        editScope={editingEvent ? selectedScope : undefined}
        defaultDate={defaultDate}
        onSave={handleSave}
      />

      <ScheduleEditScopeDialog
        open={scopeOpen}
        onOpenChange={setScopeOpen}
        action={pendingScopeAction}
        onSelect={applyScope}
      />
    </>
  );
}
