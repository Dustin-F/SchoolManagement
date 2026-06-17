import { Link } from "react-router-dom";
import { BookOpen, Clock, School, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store";
import { getTodaysLessons } from "@/lib/scheduleUtils";
import { sessionNoteHasContent, findSessionNote } from "@/lib/sessionNotesUtils";
import { getLocalToday } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function TodaysLessonsCard() {
  const classes = useAppStore((s) => s.classes);
  const subjects = useAppStore((s) => s.subjects);
  const classSessionNotes = useAppStore((s) => s.classSessionNotes);
  const classScheduleEvents = useAppStore((s) => s.classScheduleEvents);
  const classSessionExceptions = useAppStore((s) => s.classSessionExceptions);
  const todayStr = getLocalToday();
  const lessons = getTodaysLessons(
    classes,
    classScheduleEvents,
    classSessionExceptions,
    subjects,
    todayStr
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <School className="h-5 w-5 text-primary" />
          Today&apos;s lessons
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No classes scheduled for today.</p>
        ) : (
          <ul className="space-y-2">
            {lessons.map((lesson) => (
              <li key={`${lesson.classId}-${lesson.eventId}-${lesson.occurrenceDate}`}>
                <Link
                  to={`/classes/${lesson.classId}?date=${todayStr}&eventId=${lesson.eventId}&occurrence=${lesson.occurrenceDate}`}
                  className="block rounded-xl border border-primary/20 bg-white/70 p-3 shadow-sm transition-all hover:border-primary/40 hover:bg-white hover:shadow-md dark:border-primary/15 dark:bg-muted/30 dark:hover:bg-muted/50"
                >
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
                    {lesson.title?.trim() || lesson.className}
                    {sessionNoteHasContent(
                      findSessionNote(
                        classSessionNotes,
                        lesson.classId,
                        todayStr,
                        lesson.eventId,
                        lesson.occurrenceDate
                      )
                    ) && (
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        <BookOpen className="mr-1 h-3 w-3" />
                        Plan
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lesson.subjectName}
                    {lesson.classroomNumber ? ` · Room ${lesson.classroomNumber}` : ""}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {lesson.startTime}–{lesson.endTime}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {lesson.studentCount} students
                    </span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
