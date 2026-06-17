import { Link } from "react-router-dom";
import { Users, School, GraduationCap, BookOpen, ClipboardList, Sparkles, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { activeClasses, activeStudents } from "@/lib/archiveUtils";
import { DashboardCalendar } from "@/features/dashboard/DashboardCalendar";
import { DashboardIncompleteCard } from "@/features/dashboard/DashboardIncompleteCard";
import { TodaysLessonsCard } from "@/features/dashboard/TodaysLessonsCard";
import { cn, getLocalToday } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  glow: string;
  to: string;
}

function StatCard({ title, value, icon: Icon, gradient, glow, to }: StatCardProps) {
  return (
    <Link to={to} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <Card className="h-full overflow-hidden transition-transform duration-200 hover:-translate-y-0.5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
              gradient,
              glow
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-extrabold tracking-tight">{value}</div>
        </CardContent>
      </Card>
    </Link>
  );
}

const stats = [
  {
    key: "students",
    title: "Total Students",
    icon: Users,
    gradient: "from-blue-600 to-blue-700",
    glow: "shadow-blue-600/30",
    to: "/students",
  },
  {
    key: "classes",
    title: "Total Classes",
    icon: School,
    gradient: "from-sky-500 to-cyan-600",
    glow: "shadow-sky-500/30",
    to: "/classes",
  },
  {
    key: "teachers",
    title: "Total Teachers",
    icon: GraduationCap,
    gradient: "from-teal-500 to-emerald-600",
    glow: "shadow-teal-500/30",
    to: "/teachers",
  },
  {
    key: "subjects",
    title: "Total Subjects",
    icon: BookOpen,
    gradient: "from-slate-600 to-slate-700",
    glow: "shadow-slate-600/30",
    to: "/subjects",
  },
] as const;

export function DashboardPage() {
  const students = useAppStore((s) => s.students);
  const classes = useAppStore((s) => s.classes);
  const teachers = useAppStore((s) => s.teachers);
  const subjects = useAppStore((s) => s.subjects);
  const classScheduleEvents = useAppStore((s) => s.classScheduleEvents);
  const classSessionExceptions = useAppStore((s) => s.classSessionExceptions);
  const pointEvents = useAppStore((s) => s.pointEvents);
  const attendance = useAppStore((s) => s.attendance);

  const todayStr = getLocalToday();
  const todayAttendance = attendance.filter((a) => a.date === todayStr);
  const presentCount = todayAttendance.filter((a) => a.status === "present").length;
  const absentCount = todayAttendance.filter((a) => a.status === "absent").length;
  const lateCount = todayAttendance.filter((a) => a.status === "late").length;
  const todayPointsCount = pointEvents.filter((e) => e.date === todayStr).length;
  const todayPointsNet = pointEvents
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + e.points, 0);

  const counts = {
    students: activeStudents(students).length,
    classes: activeClasses(classes).length,
    teachers: teachers.length,
    subjects: subjects.length,
  };

  const isFirstRun =
    counts.students === 0 && counts.classes === 0 && counts.teachers === 0 && counts.subjects === 0;

  const attendanceLink = `/attendance?date=${todayStr}`;
  const pointsLink = `/points`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-gradient sm:text-3xl">Welcome back</h2>
        <p className="mt-1 text-muted-foreground">Here&apos;s an overview of your school today.</p>
      </div>

      {isFirstRun && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-sky-500/5">
          <CardHeader>
            <CardTitle className="text-lg">Get started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your school is empty. Add a subject and teacher, create your first class, then enroll students—or load
              sample data from the menu to explore the app.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to="/subjects">
                  <Plus className="mr-2 h-4 w-4" />
                  Add subject
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/classes">
                  <Plus className="mr-2 h-4 w-4" />
                  Create class
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/students">Add students</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.key}
            title={stat.title}
            value={counts[stat.key]}
            icon={stat.icon}
            gradient={stat.gradient}
            glow={stat.glow}
            to={stat.to}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Today at a glance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <Link
              to={attendanceLink}
              className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 p-3 text-center transition-colors hover:border-emerald-500/40"
            >
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-300">
                {presentCount}
              </div>
              <div className="text-xs font-medium text-emerald-700/80 dark:text-emerald-400">Present</div>
            </Link>
            <Link
              to={attendanceLink}
              className="rounded-xl border border-rose-500/20 bg-gradient-to-br from-rose-500/15 to-rose-600/5 p-3 text-center transition-colors hover:border-rose-500/40"
            >
              <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-300">
                {absentCount}
              </div>
              <div className="text-xs font-medium text-rose-700/80 dark:text-rose-400">Absent</div>
            </Link>
            <Link
              to={attendanceLink}
              className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/15 to-amber-600/5 p-3 text-center transition-colors hover:border-amber-500/40"
            >
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-300">
                {lateCount}
              </div>
              <div className="text-xs font-medium text-amber-700/80 dark:text-amber-400">Late</div>
            </Link>
            <Link
              to={pointsLink}
              className="rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-500/12 to-teal-500/8 p-3 text-center transition-colors hover:border-sky-500/40"
            >
              <div className="flex items-center justify-center gap-1 text-2xl font-extrabold text-sky-700 dark:text-sky-300">
                <Sparkles className="h-5 w-5" />
                {todayPointsNet > 0 ? `+${todayPointsNet}` : todayPointsNet}
              </div>
              <div className="text-xs font-medium text-sky-800/80 dark:text-sky-400">
                {todayPointsCount} point{todayPointsCount !== 1 ? "s" : ""} today
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      <DashboardIncompleteCard />

      <TodaysLessonsCard />

      <DashboardCalendar
        classes={activeClasses(classes)}
        subjects={subjects}
        teachers={teachers}
        scheduleEvents={classScheduleEvents}
        sessionExceptions={classSessionExceptions}
      />
    </div>
  );
}
