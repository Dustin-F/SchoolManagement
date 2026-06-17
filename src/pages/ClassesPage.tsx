import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  School,
  Archive,
  RotateCcw,
  ChevronDown,
  LayoutGrid,
  List,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { ClassFormDialog } from "@/features/classes/ClassFormDialog";
import { useAppStore } from "@/store";
import { activeClasses, archivedClasses } from "@/lib/archiveUtils";
import { getTeacherDisplayName } from "@/lib/displayHelpers";
import { cn } from "@/lib/utils";
import { formatScheduleSummary } from "@/lib/scheduleDisplay";
import { formatOccurrenceTime, formatSessionDateLine, getNextOccurrenceForClass } from "@/lib/scheduleUtils";
import { getLocalToday } from "@/lib/utils";
import type { SchoolClass } from "@/types";

const CLASSES_VIEW_KEY = "schoolhub-classes-view";
type ClassesView = "card" | "list";

function loadClassesView(): ClassesView {
  try {
    const saved = localStorage.getItem(CLASSES_VIEW_KEY);
    return saved === "list" ? "list" : "card";
  } catch {
    return "card";
  }
}

export function ClassesPage() {
  const navigate = useNavigate();
  const classes = useAppStore((s) => s.classes);
  const classScheduleEvents = useAppStore((s) => s.classScheduleEvents);
  const classSessionExceptions = useAppStore((s) => s.classSessionExceptions);
  const teachers = useAppStore((s) => s.teachers);
  const subjects = useAppStore((s) => s.subjects);
  const archiveClass = useAppStore((s) => s.archiveClass);
  const restoreClass = useAppStore((s) => s.restoreClass);
  const deleteClass = useAppStore((s) => s.deleteClass);
  const [formOpen, setFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<SchoolClass | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchoolClass | null>(null);
  const [archivedSectionOpen, setArchivedSectionOpen] = useState(false);
  const [view, setView] = useState<ClassesView>(loadClassesView);

  const active = activeClasses(classes);
  const archived = archivedClasses(classes);

  const setViewAndPersist = (next: ClassesView) => {
    setView(next);
    try {
      localStorage.setItem(CLASSES_VIEW_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const getTeacherName = (id: string) => {
    const t = teachers.find((teacher) => teacher.id === id);
    return t ? getTeacherDisplayName(t) : "Unassigned";
  };

  const getSubjectName = (id: string) => {
    const s = subjects.find((sub) => sub.id === id);
    return s?.name ?? "—";
  };

  const handleEdit = (cls: SchoolClass) => {
    setEditingClass(cls);
    setFormOpen(true);
  };

  const handleArchive = () => {
    if (archiveTarget) {
      archiveClass(archiveTarget.id);
      toast.success(`"${archiveTarget.name}" archived. History is preserved.`);
      setArchiveTarget(null);
    }
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteClass(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" permanently deleted.`);
      setDeleteTarget(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingClass(null);
  };

  const renderClassActions = (cls: SchoolClass, archivedRow = false) => (
    <div className="flex justify-end gap-1">
      {!archivedRow && (
        <>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(cls)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setArchiveTarget(cls)}
            aria-label="Archive class"
          >
            <Archive className="h-4 w-4" />
          </Button>
        </>
      )}
      {archivedRow && (
        <>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => {
              restoreClass(cls.id);
              toast.success(`"${cls.name}" restored.`);
            }}
            aria-label="Restore class"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => setDeleteTarget(cls)}
            aria-label="Delete class permanently"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );

  const scheduleLineForClass = (classId: string) => {
    const events = classScheduleEvents.filter((e) => e.classId === classId && !e.cancelled);
    if (events.length === 0) return "No sessions scheduled";
    const next = getNextOccurrenceForClass(classId, classScheduleEvents, classSessionExceptions, getLocalToday());
    const summary = formatScheduleSummary(events);
    if (next) {
      return `Next: ${formatSessionDateLine(next.date, getLocalToday())} · ${formatOccurrenceTime(next.startTime, next.endTime)} · ${summary}`;
    }
    return summary;
  };

  const renderClassMeta = (cls: SchoolClass, archivedRow = false) => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary">{cls.studentIds.length} student{cls.studentIds.length !== 1 && "s"}</Badge>
      {archivedRow && <Badge variant="outline">Archived</Badge>}
      {cls.coTeacherIds.length > 0 && (
        <Badge variant="outline">+{cls.coTeacherIds.length} co-teacher{cls.coTeacherIds.length !== 1 && "s"}</Badge>
      )}
    </div>
  );

  const renderClassCard = (cls: SchoolClass, archivedCard = false) => (
    <Card key={cls.id} className="group relative transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <Link to={`/classes/${cls.id}`} className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {cls.name}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {cls.classroomNumber ? `Room ${cls.classroomNumber} · ` : ""}
              {getSubjectName(cls.subjectId)} &middot; {getTeacherName(cls.teacherId)}
            </p>
          </Link>
          {renderClassActions(cls, archivedCard)}
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {classScheduleEvents.some((e) => e.classId === cls.id && !e.cancelled) ? (
            scheduleLineForClass(cls.id)
          ) : (
            <>
              No sessions scheduled.{" "}
              <Link
                to={`/classes/${cls.id}#schedule`}
                className="font-medium text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Schedule sessions
              </Link>
            </>
          )}
        </p>
        <div className="mt-3">{renderClassMeta(cls, archivedCard)}</div>
      </CardContent>
    </Card>
  );

  const renderClassTable = (items: SchoolClass[], archivedRows = false) => (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Class</TableHead>
            <TableHead className="hidden md:table-cell">Subject</TableHead>
            <TableHead className="hidden lg:table-cell">Teacher</TableHead>
            <TableHead className="hidden sm:table-cell">Schedule</TableHead>
            <TableHead>Students</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((cls) => (
            <TableRow key={cls.id}>
              <TableCell>
                <Link
                  to={`/classes/${cls.id}`}
                  className="font-medium text-foreground hover:text-primary transition-colors"
                >
                  {cls.name}
                </Link>
                {cls.classroomNumber && (
                  <p className="mt-0.5 text-xs text-muted-foreground">Room {cls.classroomNumber}</p>
                )}
                {archivedRows && (
                  <div className="mt-1 md:hidden">{renderClassMeta(cls, true)}</div>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {getSubjectName(cls.subjectId)}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground">
                {getTeacherName(cls.teacherId)}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                {scheduleLineForClass(cls.id)}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {cls.studentIds.length}
                  </Badge>
                  {archivedRows && <Badge variant="outline" className="text-xs">Archived</Badge>}
                </div>
              </TableCell>
              <TableCell>{renderClassActions(cls, archivedRows)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderActiveClasses = () => {
    if (active.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No active classes. Restore one from the archived section below.
        </p>
      );
    }
    if (view === "card") {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((cls) => renderClassCard(cls))}
        </div>
      );
    }
    return renderClassTable(active);
  };

  const renderArchivedClasses = () => {
    if (archived.length === 0) return null;
    const content =
      view === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {archived.map((cls) => renderClassCard(cls, true))}
        </div>
      ) : (
        renderClassTable(archived, true)
      );

    return (
      <div className="rounded-xl border border-border bg-muted/20">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium"
          onClick={() => setArchivedSectionOpen((v) => !v)}
        >
          <span className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-muted-foreground" />
            Archived classes ({archived.length})
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              archivedSectionOpen && "rotate-180"
            )}
          />
        </button>
        {archivedSectionOpen && <div className="border-t border-border p-4">{content}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes"
        description="Manage your school classes."
        actions={
          <>
            <div className="flex rounded-lg border border-border bg-muted/30 p-1">
              <Button
                type="button"
                variant={view === "card" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-2.5"
                onClick={() => setViewAndPersist("card")}
                aria-label="Card view"
                aria-pressed={view === "card"}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={view === "list" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-2.5"
                onClick={() => setViewAndPersist("list")}
                aria-label="List view"
                aria-pressed={view === "list"}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Class
            </Button>
          </>
        }
      />

      {active.length === 0 && archived.length === 0 ? (
        <EmptyState
          icon={School}
          title="No classes yet"
          description="Create your first class to get started."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Class
            </Button>
          }
        />
      ) : (
        <>
          {renderActiveClasses()}
          {renderArchivedClasses()}
        </>
      )}

      <ClassFormDialog
        open={formOpen}
        onOpenChange={handleDialogClose}
        editingClass={editingClass}
        onCreated={(id) => navigate(`/classes/${id}#schedule`)}
      />

      <AlertDialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive class</AlertDialogTitle>
            <AlertDialogDescription>
              Archive &quot;{archiveTarget?.name}&quot;? It will be hidden from your dashboard and class list, but
              attendance, points, and tasks are kept. You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete class permanently</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete &quot;{deleteTarget?.name}&quot; and all its tasks, attendance, and points? This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
