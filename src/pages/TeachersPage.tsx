import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, GraduationCap, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { TeacherFormDialog } from "@/features/teachers/TeacherFormDialog";
import { useAppStore } from "@/store";
import type { Teacher } from "@/types";

export function TeachersPage() {
  const teachers = useAppStore((s) => s.teachers);
  const classes = useAppStore((s) => s.classes);
  const deleteTeacher = useAppStore((s) => s.deleteTeacher);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (search === "") return teachers;
    return teachers.filter((t) =>
      `${t.firstName} ${t.lastName} ${t.email}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [teachers, search]);

  const getTeacherClasses = (teacherId: string) => {
    return classes.filter(
      (c) => c.teacherId === teacherId || c.coTeacherIds.includes(teacherId)
    );
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteTeacher(deleteTarget.id);
      toast.success(`${deleteTarget.firstName} ${deleteTarget.lastName} has been removed.`);
      setDeleteTarget(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingTeacher(null);
  };

  return (
    <div>
      <PageHeader
        title="Teachers"
        description={`${teachers.length} teacher${teachers.length !== 1 ? "s" : ""} total`}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Teacher
          </Button>
        }
      />

      {teachers.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No teachers yet"
          description="Add your first teacher to get started."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search teachers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((teacher) => {
              const teacherClasses = getTeacherClasses(teacher.id);
              const mainClasses = classes.filter((c) => c.teacherId === teacher.id);
              const coClasses = classes.filter((c) => c.coTeacherIds.includes(teacher.id));

              return (
                <Card key={teacher.id} className="group transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                            {teacher.firstName[0]}{teacher.lastName[0]}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {teacher.firstName} {teacher.lastName}
                            </h3>
                            {teacher.email && <p className="text-sm text-muted-foreground">{teacher.email}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(teacher)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(teacher)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {teacher.phone && (
                      <p className="mt-2 text-sm text-muted-foreground">{teacher.phone}</p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {mainClasses.map((c) => (
                        <Badge key={c.id} variant="default" className="text-xs">
                          {c.name}
                        </Badge>
                      ))}
                      {coClasses.map((c) => (
                        <Badge key={c.id} variant="outline" className="text-xs">
                          {c.name} (co)
                        </Badge>
                      ))}
                      {teacherClasses.length === 0 && (
                        <span className="text-xs text-muted-foreground">No classes assigned</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <TeacherFormDialog open={formOpen} onOpenChange={handleDialogClose} editingTeacher={editingTeacher} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Teacher</AlertDialogTitle>
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
