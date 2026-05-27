import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import multiMonthPlugin from "@fullcalendar/multimonth";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventContentArg } from "@fullcalendar/core";
import type { DayOfWeek, SchoolClass, Subject, Teacher } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { getTeacherDisplayName } from "@/lib/displayHelpers";
import { toLocalDateString } from "@/lib/utils";

const dayToIndex: Record<DayOfWeek, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

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

function renderCalendarEventContent(arg: EventContentArg) {
  const root = document.createElement("div");
  root.className = "fc-school-event";

  const rows: { text: string; className: string }[] = [
    { text: arg.event.title, className: "fc-school-event__class" },
  ];
  const subject = (arg.event.extendedProps.subjectName as string) || "";
  const room = (arg.event.extendedProps.classroomNumber as string) || "";
  const timeRange =
    ((arg.event.extendedProps.timeRange as string) || arg.timeText || "") as string;
  if (subject) rows.push({ text: subject, className: "fc-school-event__line" });
  if (room) rows.push({ text: room, className: "fc-school-event__line" });
  if (timeRange) rows.push({ text: timeRange, className: "fc-school-event__line fc-school-event__time" });

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
}

export function DashboardCalendar({ classes, subjects, teachers }: DashboardCalendarProps) {
  const navigate = useNavigate();

  const events = useMemo(() => {
    const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));
    const teacherNameById = new Map(
      teachers.map((t) => [t.id, getTeacherDisplayName(t)])
    );

    return classes.flatMap((cls) =>
      cls.schedule.map((entry) => ({
        id: `${cls.id}:${entry.id}`,
        title: cls.name,
        daysOfWeek: [dayToIndex[entry.dayOfWeek]],
        startTime: entry.startTime,
        endTime: entry.endTime,
        allDay: false,
        extendedProps: {
          classId: cls.id,
          classroomNumber: cls.classroomNumber ?? "",
          subjectName: subjectNameById.get(cls.subjectId) ?? "No subject",
          teacherName: teacherNameById.get(cls.teacherId) ?? "Unassigned teacher",
          timeRange: formatScheduleRange(entry.startTime, entry.endTime),
        },
      }))
    );
  }, [classes, subjects, teachers]);

  const onEventClick = (arg: EventClickArg) => {
    const classId = arg.event.extendedProps.classId as string | undefined;
    if (!classId) return;

    const start = arg.event.start;
    const dateStr = start
      ? toLocalDateString(start)
      : arg.event.startStr?.slice(0, 10);

    navigate(dateStr ? `/classes/${classId}?date=${dateStr}` : `/classes/${classId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          Class Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No scheduled class sessions yet. Add schedule entries to classes to see them here.
          </p>
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
              initialView="timeGridWeek"
              initialDate={new Date()}
              now={new Date()}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right:
                  "timeGridDay,timeGridWeek,dayGridMonth,multiMonthYear",
              }}
              buttonText={{
                today: "Today",
                day: "Day",
                week: "Week",
                month: "Month",
                multiMonthYear: "Year",
              }}
              events={events}
              eventClick={onEventClick}
              eventContent={renderCalendarEventContent}
              eventDisplay="block"
              displayEventTime={false}
              slotMinTime="06:00:00"
              slotMaxTime="20:00:00"
              slotDuration="00:30:00"
              height={680}
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

