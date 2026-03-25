import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Users, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePagination } from "@/hooks/usePagination";
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
import { useAppStore } from "@/store";
import type { Student } from "@/types";

export function StudentsPage() {
  const students = useAppStore((s) => s.students);
  const classes = useAppStore((s) => s.classes);
  const deleteStudent = useAppStore((s) => s.deleteStudent);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");

  const getStudentClasses = (studentId: string) =>
    classes.filter((c) => c.studentIds.includes(studentId));

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        search === "" ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase());
      const matchesClass =
        classFilter === "all" ||
        classes.some((c) => c.id === classFilter && c.studentIds.includes(s.id));
      return matchesSearch && matchesClass;
    });
  }, [students, classes, search, classFilter]);

  const { paginated, page, setPage, totalPages, reset: resetPage } = usePagination(filtered, 20);

  useEffect(() => { resetPage(); }, [search, classFilter]);

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteStudent(deleteTarget.id);
      toast.success(`${deleteTarget.firstName} ${deleteTarget.lastName} has been removed.`);
      setDeleteTarget(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingStudent(null);
  };

  return (
    <div>
      <PageHeader
        title="Students"
        description={`${students.length} student${students.length !== 1 ? "s" : ""} total`}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        }
      />

      {students.length === 0 ? (
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
                {classes.map((c) => (
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
                            {student.firstName} {student.lastName}
                          </Link>
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
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(student)}>
                              <Trash2 className="h-4 w-4" />
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

      <StudentFormDialog open={formOpen} onOpenChange={handleDialogClose} editingStudent={editingStudent} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deleteTarget?.firstName} {deleteTarget?.lastName}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
