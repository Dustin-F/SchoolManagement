import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckboxList } from "@/components/CheckboxList";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import { studentSchema, type StudentFormData } from "@/lib/schemas";
import type { Student } from "@/types";

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingStudent?: Student | null;
  /** When creating, pre-select these classes (e.g. current class from class detail). */
  defaultClassIds?: string[];
  /** Hide class picker; new students are enrolled only in `defaultClassIds`. */
  lockEnrollment?: boolean;
}

export function StudentFormDialog({
  open,
  onOpenChange,
  editingStudent,
  defaultClassIds = [],
  lockEnrollment = false,
}: StudentFormDialogProps) {
  const classes = useAppStore((s) => s.classes);
  const addStudent = useAppStore((s) => s.addStudent);
  const updateStudent = useAppStore((s) => s.updateStudent);
  const setStudentEnrollment = useAppStore((s) => s.setStudentEnrollment);

  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  /** Callers like `defaultClassIds={[cls.id]}` pass a new array every render; use a stable key for the effect. */
  const defaultClassIdsKey = defaultClassIds.join("\0");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      dateOfBirth: "",
      parentName: "",
      parentPhone: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (editingStudent) {
      reset({
        firstName: editingStudent.firstName,
        lastName: editingStudent.lastName,
        email: editingStudent.email ?? "",
        dateOfBirth: editingStudent.dateOfBirth ?? "",
        parentName: editingStudent.parentName ?? "",
        parentPhone: editingStudent.parentPhone ?? "",
        notes: editingStudent.notes ?? "",
      });
      const enrolled = classes.filter((c) => c.studentIds.includes(editingStudent.id)).map((c) => c.id);
      setSelectedClassIds(enrolled);
    } else {
      reset({
        firstName: "",
        lastName: "",
        email: "",
        dateOfBirth: "",
        parentName: "",
        parentPhone: "",
        notes: "",
      });
      setSelectedClassIds([...defaultClassIds]);
    }
  }, [editingStudent, reset, classes, defaultClassIdsKey]);

  const toggleClass = (id: string) =>
    setSelectedClassIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const onSubmit = (data: StudentFormData) => {
    const enrollment =
      !editingStudent && lockEnrollment ? [...defaultClassIds] : selectedClassIds;
    if (editingStudent) {
      updateStudent(editingStudent.id, data);
      setStudentEnrollment(editingStudent.id, selectedClassIds);
      toast.success(`${data.firstName} ${data.lastName} updated.`);
    } else {
      const newId = addStudent(data);
      setStudentEnrollment(newId, enrollment);
      toast.success(`${data.firstName} ${data.lastName} added.`);
    }
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingStudent ? "Edit Student" : lockEnrollment ? "Add student to class" : "Add Student"}</DialogTitle>
          <DialogDescription>
            {editingStudent
              ? "Update student information."
              : lockEnrollment
                ? "This student will be enrolled in this class when saved."
                : "Enter the student's details."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="John" {...register("firstName")} />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Doe" {...register("lastName")} />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" placeholder="john@example.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
            </div>
          </div>

          {!editingStudent && lockEnrollment ? (
            <p className="text-sm text-muted-foreground rounded-md border border-dashed border-border px-3 py-2">
              Enrollment is limited to this class from this screen.
            </p>
          ) : (
            <div className="space-y-2">
              <Label>Classes <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <CheckboxList
                items={classes.map((c) => ({ id: c.id, label: c.name }))}
                selectedIds={selectedClassIds}
                onToggle={toggleClass}
                maxHeight="10rem"
                emptyMessage="No classes available"
              />
              {selectedClassIds.length > 0 && (
                <p className="text-xs text-muted-foreground">{selectedClassIds.length} class{selectedClassIds.length !== 1 && "es"} selected</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="parentName">Parent / Guardian</Label>
              <Input id="parentName" placeholder="Jane Doe" {...register("parentName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentPhone">Parent Phone</Label>
              <Input id="parentPhone" placeholder="555-0100" {...register("parentPhone")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" placeholder="Any additional notes..." rows={2} {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editingStudent ? "Save Changes" : "Add Student"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
