import { Link } from "react-router-dom";
import { Users, School, GraduationCap, BookOpen, AlertTriangle, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store";
import { formatDate } from "@/lib/utils";
import { getStudentName, SEVERITY_BADGE_VARIANT } from "@/lib/displayHelpers";

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
  const behaviour = useAppStore((s) => s.behaviour);
  const attendance = useAppStore((s) => s.attendance);

  const recentBehaviour = [...behaviour]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAttendance = attendance.filter((a) => a.date === todayStr);
  const presentCount = todayAttendance.filter((a) => a.status === "present").length;
  const absentCount = todayAttendance.filter((a) => a.status === "absent").length;
  const lateCount = todayAttendance.filter((a) => a.status === "late").length;

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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Attendance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              Today's Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAttendance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance recorded today.</p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-emerald-50 p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-700">{presentCount}</div>
                  <div className="text-xs text-emerald-600">Present</div>
                </div>
                <div className="rounded-lg bg-red-50 p-4 text-center">
                  <div className="text-2xl font-bold text-red-700">{absentCount}</div>
                  <div className="text-xs text-red-600">Absent</div>
                </div>
                <div className="rounded-lg bg-amber-50 p-4 text-center">
                  <div className="text-2xl font-bold text-amber-700">{lateCount}</div>
                  <div className="text-xs text-amber-600">Late</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Behaviour Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              Recent Behaviour Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentBehaviour.length === 0 ? (
              <p className="text-sm text-muted-foreground">No behaviour notes yet.</p>
            ) : (
              <div className="space-y-3">
                {recentBehaviour.map((record) => (
                  <div key={record.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                    <div className="min-w-0 flex-1">
                      <Link to={`/students/${record.studentId}`} className="text-sm font-medium hover:text-primary transition-colors">
                        {getStudentName(record.studentId, students)}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {record.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={SEVERITY_BADGE_VARIANT[record.severity] ?? "secondary"}>
                        {record.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(record.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
