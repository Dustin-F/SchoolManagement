import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SkillFormDialog } from "@/features/points/SkillFormDialog";
import { useAppStore } from "@/store";
import { usePagination } from "@/hooks/usePagination";
import type { BehaviourSkill, PointEvent } from "@/types";
import { formatDate } from "@/lib/utils";
import { getStudentName } from "@/lib/displayHelpers";
import {
  buildWeeklyReport,
  exportPointEventsCsv,
  formatWeekRange,
  getWeekStart,
  shiftWeek,
  skillButtonClass,
} from "@/lib/pointsUtils";
import { cn } from "@/lib/utils";

type Tab = "history" | "skills" | "reports";

export function PointsPage() {
  const students = useAppStore((s) => s.students);
  const classes = useAppStore((s) => s.classes);
  const behaviourSkills = useAppStore((s) => s.behaviourSkills);
  const pointEvents = useAppStore((s) => s.pointEvents);
  const deletePointEvent = useAppStore((s) => s.deletePointEvent);
  const deleteBehaviourSkill = useAppStore((s) => s.deleteBehaviourSkill);
  const updateBehaviourSkill = useAppStore((s) => s.updateBehaviourSkill);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;
  const classIdFromUrl = searchParams.get("classId");
  const [tab, setTab] = useState<Tab>(tabParam === "skills" || tabParam === "reports" ? tabParam : "history");
  const [classFilter, setClassFilter] = useState(classIdFromUrl ?? "all");
  const [search, setSearch] = useState("");
  const [skillFormOpen, setSkillFormOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<BehaviourSkill | null>(null);
  const [deleteEventTarget, setDeleteEventTarget] = useState<PointEvent | null>(null);
  const [weekStart, setWeekStart] = useState(() => getWeekStart());

  useEffect(() => {
    if (classIdFromUrl && classes.some((c) => c.id === classIdFromUrl)) {
      setClassFilter(classIdFromUrl);
    }
  }, [classIdFromUrl, classes]);

  useEffect(() => {
    if (tabParam === "skills" || tabParam === "reports") setTab(tabParam);
  }, [tabParam]);

  const skillById = useMemo(() => new Map(behaviourSkills.map((s) => [s.id, s])), [behaviourSkills]);

  const filteredEvents = useMemo(() => {
    return [...pointEvents]
      .filter((e) => {
        if (classFilter !== "all" && e.classId !== classFilter) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const studentName = getStudentName(e.studentId, students).toLowerCase();
        const skillName = skillById.get(e.skillId)?.name.toLowerCase() ?? "";
        return studentName.includes(q) || skillName.includes(q) || (e.note ?? "").toLowerCase().includes(q);
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [pointEvents, classFilter, search, students, skillById]);

  const { paginated, page, setPage, totalPages, reset: resetPage } = usePagination(filteredEvents, 25);
  useEffect(() => { resetPage(); }, [search, classFilter]);

  const sortedSkills = useMemo(() => [...behaviourSkills].sort((a, b) => a.sortOrder - b.sortOrder), [behaviourSkills]);
  const nextSortOrder = (sortedSkills[sortedSkills.length - 1]?.sortOrder ?? 0) + 1;

  const weeklyRows = useMemo(
    () =>
      buildWeeklyReport(
        students,
        classes,
        pointEvents,
        weekStart,
        classFilter === "all" ? undefined : classFilter
      ),
    [students, classes, pointEvents, weekStart, classFilter]
  );

  const handleExport = () => {
    const csv = exportPointEventsCsv(
      filteredEvents,
      classes,
      behaviourSkills,
      (id) => getStudentName(id, students)
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schoolhub-points-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Points exported.");
  };

  const setTabAndUrl = (next: Tab) => {
    setTab(next);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("tab", next);
      return p;
    }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Points"
        description="ClassDojo-style merits and reminders — school-wide skills, class awards, history, and reports."
      />

      <div className="flex flex-wrap gap-2">
        {(["history", "skills", "reports"] as Tab[]).map((t) => (
          <Button
            key={t}
            type="button"
            size="sm"
            variant={tab === t ? "default" : "outline"}
            onClick={() => setTabAndUrl(t)}
            className="capitalize"
          >
            {t}
          </Button>
        ))}
      </div>

      {tab === "history" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs text-muted-foreground">Search</label>
              <Input
                placeholder="Student or skill…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Class</label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="outline" onClick={handleExport}>
              <Download className="mr-1.5 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead className="text-right">Pts</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No point events yet. Award points from a class page.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((e) => {
                    const skill = skillById.get(e.skillId);
                    const cls = classes.find((c) => c.id === e.classId);
                    return (
                      <TableRow key={e.id}>
                        <TableCell>{formatDate(e.date)}</TableCell>
                        <TableCell>{getStudentName(e.studentId, students)}</TableCell>
                        <TableCell>{cls?.name ?? "—"}</TableCell>
                        <TableCell>
                          <span className="mr-1">{skill?.emoji}</span>
                          {skill?.name ?? "Unknown"}
                        </TableCell>
                        <TableCell className={cn("text-right font-semibold tabular-nums", e.points > 0 ? "text-emerald-600" : "text-amber-600")}>
                          {e.points > 0 ? `+${e.points}` : e.points}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {e.note ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDeleteEventTarget(e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span className="flex items-center text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {tab === "skills" && (
        <div className="space-y-4">
          <div className="flex justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Skills are shared across the whole school. Pin skills per class from the class page (coming in class settings) or use defaults.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditingSkill(null);
                setSkillFormOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add skill
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sortedSkills.map((skill) => (
              <div
                key={skill.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3",
                  skill.active ? "border-border" : "border-dashed opacity-60",
                  skillButtonClass(skill)
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{skill.emoji ?? "•"}</span>
                  <div>
                    <p className="font-medium">{skill.name}</p>
                    <p className="text-xs opacity-80">
                      {skill.points > 0 ? `+${skill.points}` : skill.points} · {skill.type === "positive" ? "Merit" : "Reminder"}
                      {!skill.active && " · Archived"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingSkill(skill);
                      setSkillFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {skill.active ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        deleteBehaviourSkill(skill.id);
                        toast.success(`"${skill.name}" archived.`);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        updateBehaviourSkill(skill.id, { active: true });
                        toast.success(`"${skill.name}" restored.`);
                      }}
                    >
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" size="icon" onClick={() => setWeekStart(shiftWeek(weekStart, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{formatWeekRange(weekStart)}</span>
            <Button type="button" variant="outline" size="icon" onClick={() => setWeekStart(shiftWeek(weekStart, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setWeekStart(getWeekStart())}>
              This week
            </Button>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">This week</TableHead>
                  <TableHead className="text-right">Today</TableHead>
                  <TableHead className="text-right">Events</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeklyRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No students in selected class.
                    </TableCell>
                  </TableRow>
                ) : (
                  weeklyRows.map((row) => (
                    <TableRow key={`${row.classId}-${row.studentId}`}>
                      <TableCell>{row.studentName}</TableCell>
                      <TableCell>{row.className}</TableCell>
                      <TableCell className={cn("text-right font-semibold tabular-nums", row.weekPoints > 0 && "text-emerald-600", row.weekPoints < 0 && "text-amber-600")}>
                        {row.weekPoints > 0 ? `+${row.weekPoints}` : row.weekPoints}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {row.todayPoints > 0 ? `+${row.todayPoints}` : row.todayPoints}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{row.eventCount}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <SkillFormDialog
        open={skillFormOpen}
        onOpenChange={setSkillFormOpen}
        editingSkill={editingSkill}
        nextSortOrder={nextSortOrder}
      />

      <AlertDialog open={!!deleteEventTarget} onOpenChange={(o) => !o && setDeleteEventTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this point?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the award from history and updates totals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteEventTarget) deletePointEvent(deleteEventTarget.id);
                setDeleteEventTarget(null);
                toast.success("Point removed.");
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
