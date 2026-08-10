import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { CheckboxList } from "@/components/CheckboxList";
import { PersonNameFormFields } from "@/components/PersonNameFormFields";
import { useAppStore } from "@/store";
import { studentSchema, type StudentFormData } from "@/lib/schemas";
import { findDuplicateStudent } from "@/lib/studentIdentity";
import { getPrimaryName } from "@/lib/personNames";
import type { Student } from "@/types";

function formName(data: StudentFormData): string {
  return getPrimaryName(data) || "Student";
}

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingStudent?: Student | null;
  defaultClassIds?: string[];
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
  const students = useAppStore((s) => s.students);
  const addStudent = useAppStore((s) => s.addStudent);
  const updateStudent = useAppStore((s) => s.updateStudent);
  const setStudentEnrollment = useAppStore((s) => s.setStudentEnrollment);

  const defaultClassIdsKey = defaultClassIds.join(",");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([...defaultClassIds]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      name2First: "",
      name2Last: "",
      name3First: "",
      name3Last: "",
      email: "",
      dateOfBirth: "",
      parentName: "",
      parentPhone: "",
      notes: "",
      photoUrl: "",
    },
  });

  useEffect(() => {
    if (editingStudent) {
      reset({
        firstName: editingStudent.firstName ?? "",
        lastName: editingStudent.lastName ?? "",
        name2First: editingStudent.name2First ?? "",
        name2Last: editingStudent.name2Last ?? "",
        name3First: editingStudent.name3First ?? "",
        name3Last: editingStudent.name3Last ?? "",
        email: editingStudent.email ?? "",
        dateOfBirth: editingStudent.dateOfBirth ?? "",
        parentName: editingStudent.parentName ?? "",
        parentPhone: editingStudent.parentPhone ?? "",
        notes: editingStudent.notes ?? "",
        photoUrl: editingStudent.photoUrl ?? "",
      });
      const enrolled = classes.filter((c) => c.studentIds.includes(editingStudent.id)).map((c) => c.id);
      setSelectedClassIds(enrolled);
    } else {
      reset({
        firstName: "",
        lastName: "",
        name2First: "",
        name2Last: "",
        name3First: "",
        name3Last: "",
        email: "",
        dateOfBirth: "",
        parentName: "",
        parentPhone: "",
        notes: "",
        photoUrl: "",
      });
      setSelectedClassIds([...defaultClassIds]);
    }
  }, [editingStudent, reset, classes, defaultClassIdsKey]);

  const toggleClass = (id: string) =>
    setSelectedClassIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const onSubmit = (data: StudentFormData) => {
    const enrollment =
      !editingStudent && lockEnrollment ? [...defaultClassIds] : selectedClassIds;
    const duplicate = findDuplicateStudent(data, students, editingStudent?.id);
    if (duplicate) {
      const duplicateName = getPrimaryName(duplicate) || "existing student";
      toast.error(`Possible duplicate found: ${duplicateName}.`);
      return;
    }
    const payload = {
      ...data,
      firstName: (data.firstName ?? "").trim(),
      lastName: (data.lastName ?? "").trim(),
      name2First: data.name2First?.trim() || undefined,
      name2Last: data.name2Last?.trim() || undefined,
      name3First: data.name3First?.trim() || undefined,
      name3Last: data.name3Last?.trim() || undefined,
      photoUrl: data.photoUrl?.trim() || undefined,
    };
    if (editingStudent) {
      updateStudent(editingStudent.id, payload);
      setStudentEnrollment(editingStudent.id, selectedClassIds);
      toast.success(`${formName(data)} updated.`);
    } else {
      const newId = addStudent(payload);
      setStudentEnrollment(newId, enrollment);
      toast.success(`${formName(data)} added.`);
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
          <PersonNameFormFields
            register={register}
            setValue={setValue}
            errors={errors}
            showSavedTiers={!!editingStudent}
            hasName2Data={
              !!(editingStudent?.name2First?.trim() || editingStudent?.name2Last?.trim())
            }
            hasName3Data={
              !!(editingStudent?.name3First?.trim() || editingStudent?.name3Last?.trim())
            }
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" placeholder="john@example.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <DatePicker
                id="dateOfBirth"
                value={watch("dateOfBirth") ?? ""}
                onChange={(v) => setValue("dateOfBirth", v, { shouldValidate: true })}
                placeholder="Pick date of birth"
                clearable
              />
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
            <Label htmlFor="photoUrl">
              Photo URL <span className="text-muted-foreground font-normal">(optional, with consent)</span>
            </Label>
            <Input id="photoUrl" placeholder="https://…" {...register("photoUrl")} />
            {errors.photoUrl && <p className="text-xs text-destructive">{errors.photoUrl.message}</p>}
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
