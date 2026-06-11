import { Link } from "react-router-dom";
import { Clock, School, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store";
import { getTodaysLessons } from "@/lib/scheduleUtils";
import { getLocalToday } from "@/lib/utils";

export function TodaysLessonsCard() {
  const classes = useAppStore((s) => s.classes);
  const subjects = useAppStore((s) => s.subjects);
  const todayStr = getLocalToday();
  const lessons = getTodaysLessons(classes, subjects, todayStr);

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
              <li key={`${lesson.classId}-${lesson.entry.id}`}>
                <Link
                  to={`/classes/${lesson.classId}?date=${todayStr}`}
                  className="block rounded-xl border border-primary/20 bg-white/70 p-3 shadow-sm transition-all hover:border-primary/40 hover:bg-white hover:shadow-md dark:border-primary/15 dark:bg-muted/30 dark:hover:bg-muted/50"
                >
                  <p className="font-semibold text-foreground">{lesson.className}</p>
                  <p className="text-xs text-muted-foreground">
                    {lesson.subjectName}
                    {lesson.classroomNumber ? ` · Room ${lesson.classroomNumber}` : ""}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {lesson.entry.startTime}–{lesson.entry.endTime}
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
