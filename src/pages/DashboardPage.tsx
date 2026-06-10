import { Users, School, GraduationCap, BookOpen, ClipboardList, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store";
import { DashboardCalendar } from "@/features/dashboard/DashboardCalendar";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const students = useAppStore((s) => s.students);
  const classes = useAppStore((s) => s.classes);
  const teachers = useAppStore((s) => s.teachers);
  const subjects = useAppStore((s) => s.subjects);
  const pointEvents = useAppStore((s) => s.pointEvents);
  const attendance = useAppStore((s) => s.attendance);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAttendance = attendance.filter((a) => a.date === todayStr);
  const presentCount = todayAttendance.filter((a) => a.status === "present").length;
  const absentCount = todayAttendance.filter((a) => a.status === "absent").length;
  const lateCount = todayAttendance.filter((a) => a.status === "late").length;
  const todayPointsCount = pointEvents.filter((e) => e.date === todayStr).length;
  const todayPointsNet = pointEvents
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + e.points, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-muted-foreground">Here's an overview of your school.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Students" value={students.length} icon={Users} color="bg-blue-600" />
        <StatCard title="Total Classes" value={classes.length} icon={School} color="bg-emerald-600" />
        <StatCard title="Total Teachers" value={teachers.length} icon={GraduationCap} color="bg-violet-600" />
        <StatCard title="Total Subjects" value={subjects.length} icon={BookOpen} color="bg-amber-600" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
            Today at a glance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-emerald-50 p-3 text-center dark:bg-emerald-950/35">
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{presentCount}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400">Present</div>
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-center dark:bg-red-950/35">
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">{absentCount}</div>
              <div className="text-xs text-red-600 dark:text-red-400">Absent</div>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-center dark:bg-amber-950/35">
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{lateCount}</div>
              <div className="text-xs text-amber-600 dark:text-amber-400">Late</div>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-950/35">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-blue-700 dark:text-blue-300">
                <Sparkles className="h-5 w-5" />
                {todayPointsNet > 0 ? `+${todayPointsNet}` : todayPointsNet}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                {todayPointsCount} point{todayPointsCount !== 1 ? "s" : ""} today
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DashboardCalendar
        classes={classes}
        subjects={subjects}
        teachers={teachers}
      />
    </div>
  );
}
