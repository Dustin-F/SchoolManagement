import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { BehaviourFormDialog } from "@/features/behaviour/BehaviourFormDialog";
import { useAppStore } from "@/store";
import { usePagination } from "@/hooks/usePagination";
import type { BehaviourRecord } from "@/types";
import { formatDate } from "@/lib/utils";
import { getStudentName, SEVERITY_BADGE_VARIANT } from "@/lib/displayHelpers";

export function BehaviourPage() {
  const behaviour = useAppStore((s) => s.behaviour);
  const students = useAppStore((s) => s.students);
  const classes = useAppStore((s) => s.classes);
  const subjects = useAppStore((s) => s.subjects);
  const deleteBehaviour = useAppStore((s) => s.deleteBehaviour);
  const [searchParams] = useSearchParams();
  const classIdFromUrl = searchParams.get("classId");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BehaviourRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BehaviourRecord | null>(null);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  useEffect(() => {
    if (classIdFromUrl && classes.some((c) => c.id === classIdFromUrl)) {
      setClassFilter(classIdFromUrl);
    }
  }, [classIdFromUrl, classes]);

  const filtered = useMemo(() => {
    return behaviour
      .filter((b) => {
        const student = students.find((s) => s.id === b.studentId);
        const studentName = student ? `${student.firstName} ${student.lastName}` : "";
        const matchesSearch = search === "" || studentName.toLowerCase().includes(search.toLowerCase()) || b.description.toLowerCase().includes(search.toLowerCase());
        const matchesClass = classFilter === "all" || b.classId === classFilter;
        const matchesSeverity = severityFilter === "all" || b.severity === severityFilter;
        return matchesSearch && matchesClass && matchesSeverity;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [behaviour, students, search, classFilter, severityFilter]);

  const { paginated, page, setPage, totalPages, reset: resetPage } = usePagination(filtered, 20);

  useEffect(() => { resetPage(); }, [search, classFilter, severityFilter]);

  const getClassName = (id?: string) => {
    if (!id) return null;
    const c = classes.find((cls) => cls.id === id);
    return c?.name ?? null;
  };

  const getSubjectName = (id?: string) => {
    if (!id) return null;
    const s = subjects.find((sub) => sub.id === id);
    return s?.name ?? null;
  };

  const handleEdit = (record: BehaviourRecord) => {
    setEditingRecord(record);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteBehaviour(deleteTarget.id);
      toast.success("Behaviour note deleted.");
      setDeleteTarget(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingRecord(null);
  };

  return (
    <div>
      <PageHeader
        title="Behaviour"
        description={`${behaviour.length} note${behaviour.length !== 1 ? "s" : ""} total`}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Note
          </Button>
        }
      />

      {behaviour.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No behaviour notes"
          description="Add a behaviour note to start tracking."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Note
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by student or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="major">Major</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
              No behaviour notes match your filters.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginated.map((record) => {
                  const className = getClassName(record.classId);
                  const subjectName = getSubjectName(record.subjectId);
                  return (
                    <div
                      key={record.id}
                      className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{getStudentName(record.studentId, students)}</span>
                            <Badge variant={SEVERITY_BADGE_VARIANT[record.severity] ?? "secondary"}>
                              {record.severity}
                            </Badge>
                            <Badge variant="outline">{record.category}</Badge>
                            {className && <Badge variant="secondary">{className}</Badge>}
                            {subjectName && <Badge variant="secondary">{subjectName}</Badge>}
                          </div>
                          <p className="mt-2 text-sm">{record.description}</p>
                          {record.actionTaken && (
                            <p className="mt-1 text-xs text-muted-foreground">Action: {record.actionTaken}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className="text-xs text-muted-foreground">{formatDate(record.date)}</span>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(record)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(record)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="hidden sm:inline text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                    <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      <BehaviourFormDialog open={formOpen} onOpenChange={handleDialogClose} editingRecord={editingRecord} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this behaviour note? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
