import { useMemo } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import multiMonthPlugin from "@fullcalendar/multimonth";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventContentArg, DatesSetArg } from "@fullcalendar/core";
import type { SchoolClass, Subject, Teacher } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { getTeacherDisplayName } from "@/lib/displayHelpers";
import { calendarEventsForRange } from "@/lib/scheduleUtils";
import { toLocalDateString } from "@/lib/utils";
import { useState } from "react";

function formatScheduleTime(time: string, omitMinutesIfZero = true): string {
  const [hourStr, minuteStr = "00"] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr.slice(0, 2);
  const period = hour >= 12 ? "p" : "a";
  const hour12 = hour % 12 || 12;
  if (omitMinutesIfZero && minute === "00") return `${hour12}${period}`;
  return `${hour12}:${minute}${period}`;
}

function formatScheduleRange(start: string, end: string): string {
  return `${formatScheduleTime(start)}–${formatScheduleTime(end)}`;
}

function renderCalendarEventContent(arg: EventContentArg, singleClass?: boolean) {
  const root = document.createElement("div");
  root.className = "fc-school-event";

  const sessionTitle = (arg.event.extendedProps.sessionTitle as string) || arg.event.title;
  const subject = (arg.event.extendedProps.subjectName as string) || "";
  const room = (arg.event.extendedProps.classroomNumber as string) || "";
  const timeRange =
    ((arg.event.extendedProps.timeRange as string) || arg.timeText || "") as string;

  const rows: { text: string; className: string }[] = singleClass
    ? [{ text: sessionTitle, className: "fc-school-event__class" }]
    : [{ text: arg.event.title, className: "fc-school-event__class" }];

  if (!singleClass && subject) rows.push({ text: subject, className: "fc-school-event__line" });
  if (room) rows.push({ text: room, className: "fc-school-event__line" });
  if (timeRange) rows.push({ text: timeRange, className: "fc-school-event__line fc-school-event__time" });
  if (singleClass && subject) rows.push({ text: subject, className: "fc-school-event__line" });

  for (const { text, className } of rows) {
    const line = document.createElement("div");
    line.className = className;
    line.textContent = text;
    root.appendChild(line);
  }

  return { domNodes: [root] };
}

interface DashboardCalendarProps {
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  scheduleEvents: import("@/types").ClassScheduleEvent[];
  sessionExceptions: import("@/types").ClassSessionException[];
  /** When set, only sessions for this class are shown. */
  classId?: string;
  title?: string;
  emptyMessage?: string;
}

export function DashboardCalendar({
  classes,
  subjects,
  teachers,
  scheduleEvents,
  sessionExceptions,
  classId,
  title = "Class Calendar",
  emptyMessage = "No scheduled sessions yet. Open a class profile to add sessions.",
}: DashboardCalendarProps) {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [range, setRange] = useState(() => {
    const start = new Date();
    start.setDate(1);
    start.setMonth(start.getMonth() - 1);
    const end = new Date();
    end.setMonth(end.getMonth() + 3);
    end.setDate(0);
    return {
      start: toLocalDateString(start),
      end: toLocalDateString(end),
    };
  });

  const scopedClasses = useMemo(
    () => (classId ? classes.filter((c) => c.id === classId) : classes),
    [classes, classId]
  );
  const scopedEvents = useMemo(
    () =>
      scheduleEvents.filter(
        (e) => !e.cancelled && (!classId || e.classId === classId)
      ),
    [scheduleEvents, classId]
  );

  const events = useMemo(() => {
    const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));
    const teacherNameById = new Map(
      teachers.map((t) => [t.id, getTeacherDisplayName(t)])
    );
    const classById = new Map(scopedClasses.map((c) => [c.id, c]));

    return calendarEventsForRange(
      scopedClasses,
      scopedEvents,
      sessionExceptions,
      range.start,
      range.end
    ).map((ev) => {
      const cls = classById.get(ev.extendedProps.classId);
      const startTime = ev.start.slice(11, 16);
      const endTime = ev.end.slice(11, 16);
      const sessionTitle = ev.title === cls?.name ? cls.name : ev.title;
      return {
        ...ev,
        title: classId ? sessionTitle : ev.title === cls?.name ? cls.name : ev.title,
        extendedProps: {
          ...ev.extendedProps,
          classId: ev.extendedProps.classId,
          subjectName: cls ? subjectNameById.get(cls.subjectId) ?? "No subject" : "",
          teacherName: cls ? teacherNameById.get(cls.teacherId) ?? "Unassigned" : "",
          timeRange: formatScheduleRange(startTime, endTime),
          sessionTitle,
        },
      };
    });
  }, [scopedClasses, scopedEvents, subjects, teachers, sessionExceptions, range, classId]);

  const onDatesSet = (arg: DatesSetArg) => {
    if (!arg.start || !arg.end) return;
    const start = toLocalDateString(arg.start);
    const end = toLocalDateString(new Date(arg.end.getTime() - 24 * 60 * 60 * 1000));
    setRange({ start, end });
  };

  const onEventClick = (arg: EventClickArg) => {
    const classId = arg.event.extendedProps.classId as string | undefined;
    const eventId = arg.event.extendedProps.eventId as string | undefined;
    const occurrenceDate = arg.event.extendedProps.occurrenceDate as string | undefined;
    if (!classId) return;

    const start = arg.event.start;
    const dateStr = start
      ? toLocalDateString(start)
      : arg.event.startStr?.slice(0, 10);

    if (dateStr && eventId) {
      navigate(
        `/classes/${classId}?date=${dateStr}&eventId=${eventId}&occurrence=${occurrenceDate ?? dateStr}`
      );
      return;
    }
    navigate(dateStr ? `/classes/${classId}?date=${dateStr}` : `/classes/${classId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {scopedEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="dashboard-calendar rounded-lg border border-border bg-card p-2 sm:p-3">
            <FullCalendar
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                listPlugin,
                multiMonthPlugin,
                interactionPlugin,
              ]}
              initialView={isMobile ? "listWeek" : "timeGridWeek"}
              initialDate={new Date()}
              now={new Date()}
              datesSet={onDatesSet}
              headerToolbar={
                isMobile
                  ? {
                      left: "prev,next",
                      center: "title",
                      right: "listWeek,timeGridDay",
                    }
                  : {
                      left: "prev,next today",
                      center: "title",
                      right: "timeGridDay,timeGridWeek,dayGridMonth,multiMonthYear",
                    }
              }
              buttonText={{
                today: "Today",
                day: "Day",
                week: "Week",
                month: "Month",
                multiMonthYear: "Year",
              }}
              events={events}
              eventClick={onEventClick}
              eventContent={(arg) => renderCalendarEventContent(arg, Boolean(classId))}
              eventDisplay="block"
              displayEventTime={false}
              slotMinTime="06:00:00"
              slotMaxTime="20:00:00"
              slotDuration="00:30:00"
              height={isMobile ? "auto" : 680}
              expandRows
              nowIndicator
              dayMaxEvents
              stickyHeaderDates
              eventTimeFormat={{
                hour: "numeric",
                minute: "2-digit",
                meridiem: "short",
              }}
              eventDidMount={(info) => {
                const room = info.event.extendedProps.classroomNumber as string;
                const subject = info.event.extendedProps.subjectName as string;
                const teacher = info.event.extendedProps.teacherName as string;
                const timeRange = info.event.extendedProps.timeRange as string;
                const lines = [
                  info.event.title,
                  subject,
                  room,
                  timeRange,
                  teacher,
                ].filter(Boolean);
                info.el.title = lines.join("\n");

                if (!info.view.type.startsWith("timeGrid")) return;
                const lineCount = [
                  info.event.title,
                  subject,
                  room,
                  timeRange,
                ].filter(Boolean).length;
                const minHeightPx = Math.max(64, lineCount * 16 + 10);
                const currentHeight = info.el.getBoundingClientRect().height;
                if (currentHeight < minHeightPx) {
                  info.el.style.height = `${minHeightPx}px`;
                  const harness = info.el.parentElement;
                  if (harness?.classList.contains("fc-timegrid-event-harness")) {
                    harness.style.height = `${minHeightPx}px`;
                  }
                }
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
