import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Users, Search, Upload, Archive, RotateCcw, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { PageBackButton } from "@/components/PageBackButton";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { StudentFormDialog } from "@/features/students/StudentFormDialog";
import { StudentImportDialog } from "@/features/students/StudentImportDialog";
import { useAppStore } from "@/store";
import { activeClasses, activeStudents, archivedStudents } from "@/lib/archiveUtils";
import { getStudentDisplayName, getExtraNameLine } from "@/lib/displayHelpers";
import { getPersonNameLines } from "@/lib/personNames";
import { cn } from "@/lib/utils";
import { usePageBack } from "@/hooks/usePageBack";
import type { Student } from "@/types";

export function StudentsPage() {
  const [searchParams] = useSearchParams();
  const classIdFromUrl = searchParams.get("classId");
  const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
  const students = useAppStore((s) => s.students);
  const classes = useAppStore((s) => s.classes);
  const archiveStudent = useAppStore((s) => s.archiveStudent);
  const restoreStudent = useAppStore((s) => s.restoreStudent);
  const deleteStudent = useAppStore((s) => s.deleteStudent);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [archivedSectionOpen, setArchivedSectionOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState(classIdFromUrl ?? "all");
  const [pageSize, setPageSize] = useState("25");
  const { backPath, showBack, backLabel } = usePageBack("/students");

  useEffect(() => {
    if (classIdFromUrl && classes.some((c) => c.id === classIdFromUrl)) {
      setClassFilter(classIdFromUrl);
    }
  }, [classIdFromUrl, classes]);

  const activeStudentList = activeStudents(students);
  const archivedStudentList = archivedStudents(students);
  const classOptions = activeClasses(classes);

  const getStudentClasses = (studentId: string) =>
    classes.filter((c) => c.studentIds.includes(studentId));

  const filtered = useMemo(() => {
    return activeStudentList.filter((s) => {
      const matchesSearch =
        search === "" ||
        `${getStudentDisplayName(s)} ${getPersonNameLines(s).join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesClass =
        classFilter === "all" ||
        classes.some((c) => c.id === classFilter && c.studentIds.includes(s.id));
      return matchesSearch && matchesClass;
    });
  }, [activeStudentList, classes, search, classFilter]);

  const { paginated, page, setPage, totalPages, reset: resetPage } = usePagination(
    filtered,
    Number(pageSize)
  );

  useEffect(() => { resetPage(); }, [search, classFilter, pageSize]);

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormOpen(true);
  };

  const handleArchive = () => {
    if (archiveTarget) {
      archiveStudent(archiveTarget.id);
      toast.success(`${getStudentDisplayName(archiveTarget)} archived. History is preserved.`);
      setArchiveTarget(null);
    }
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteStudent(deleteTarget.id);
      toast.success(`${getStudentDisplayName(deleteTarget)} permanently deleted.`);
      setDeleteTarget(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingStudent(null);
  };

  return (
    <div>
      {showBack && <PageBackButton to={backPath} label={backLabel} />}
      <PageHeader
        title="Students"
        description={`${activeStudentList.length} active · ${archivedStudentList.length} archived`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import Excel
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </div>
        }
      />

      {activeStudentList.length === 0 && archivedStudentList.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="Add your first student to get started."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead className="hidden md:table-cell">Parent / Guardian</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No students match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((student) => {
                    const studentClasses = getStudentClasses(student.id);
                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Link
                            to={`/students/${student.id}`}
                            className="font-medium text-foreground hover:text-primary transition-colors"
                          >
                            {getStudentDisplayName(student)}
                          </Link>
                          {getExtraNameLine(student) && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {getExtraNameLine(student)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {studentClasses.length > 0
                              ? studentClasses.map((c) => (
                                  <Badge key={c.id} variant="secondary" className="text-xs">{c.name}</Badge>
                                ))
                              : <span className="text-xs text-muted-foreground">None</span>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {student.parentName || "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {student.parentPhone || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(student)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setArchiveTarget(student)} aria-label="Archive student">
                              <Archive className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <TablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            pageSize={Number(pageSize)}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={(size) => setPageSize(String(size))}
          />

          {archivedStudentList.length > 0 && (
            <div className="mt-6 rounded-xl border border-border bg-muted/20">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium"
                onClick={() => setArchivedSectionOpen((v) => !v)}
              >
                <span className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-muted-foreground" />
                  Archived students ({archivedStudentList.length})
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    archivedSectionOpen && "rotate-180"
                  )}
                />
              </button>
              {archivedSectionOpen && (
                <div className="overflow-x-auto border-t border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="w-32 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivedStudentList.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Link
                              to={`/students/${student.id}`}
                              className="font-medium text-foreground hover:text-primary transition-colors"
                            >
                              {getStudentDisplayName(student)}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => {
                                  restoreStudent(student.id);
                                  toast.success(`${getStudentDisplayName(student)} restored.`);
                                }}
                                aria-label="Restore student"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget(student)}
                                aria-label="Delete student permanently"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <StudentFormDialog open={formOpen} onOpenChange={handleDialogClose} editingStudent={editingStudent} />
      <StudentImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <AlertDialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive student</AlertDialogTitle>
            <AlertDialogDescription>
              Archive {archiveTarget ? getStudentDisplayName(archiveTarget) : "this student"}? They will be removed
              from active class rosters but attendance, points, and grades are kept. You can restore them later.
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
            <AlertDialogTitle>Delete student permanently</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete {deleteTarget ? getStudentDisplayName(deleteTarget) : "this student"} and all their
              attendance, points, and task records? This cannot be undone.
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
