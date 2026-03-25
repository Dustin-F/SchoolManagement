import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, School } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
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
import { ClassFormDialog } from "@/features/classes/ClassFormDialog";
import { useAppStore } from "@/store";
import { formatScheduleSummary } from "@/lib/utils";
import type { SchoolClass } from "@/types";

export function ClassesPage() {
  const classes = useAppStore((s) => s.classes);
  const teachers = useAppStore((s) => s.teachers);
  const subjects = useAppStore((s) => s.subjects);
  const deleteClass = useAppStore((s) => s.deleteClass);
  const [formOpen, setFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchoolClass | null>(null);

  const getTeacherName = (id: string) => {
    const t = teachers.find((teacher) => teacher.id === id);
    return t ? `${t.firstName} ${t.lastName}` : "Unassigned";
  };

  const getSubjectName = (id: string) => {
    const s = subjects.find((sub) => sub.id === id);
    return s?.name ?? "—";
  };

  const handleEdit = (cls: SchoolClass) => {
    setEditingClass(cls);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteClass(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" has been deleted.`);
      setDeleteTarget(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingClass(null);
  };

  return (
    <div>
      <PageHeader
        title="Classes"
        description="Manage your school classes."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Class
          </Button>
        }
      />

      {classes.length === 0 ? (
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card key={cls.id} className="group relative transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <Link to={`/classes/${cls.id}`} className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {cls.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {getSubjectName(cls.subjectId)} &middot; {getTeacherName(cls.teacherId)}
                    </p>
                  </Link>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(cls)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(cls)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">{formatScheduleSummary(cls.schedule)}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary">{cls.studentIds.length} student{cls.studentIds.length !== 1 && "s"}</Badge>
                  {cls.coTeacherIds.length > 0 && (
                    <Badge variant="outline">+{cls.coTeacherIds.length} co-teacher{cls.coTeacherIds.length !== 1 && "s"}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClassFormDialog open={formOpen} onOpenChange={handleDialogClose} editingClass={editingClass} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
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
