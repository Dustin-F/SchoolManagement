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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckboxList } from "@/components/CheckboxList";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import { classSchema, type ClassFormData } from "@/lib/schemas";
import { getStudentDisplayName, getTeacherDisplayName } from "@/lib/displayHelpers";
import type { SchoolClass } from "@/types";

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingClass?: SchoolClass | null;
  onCreated?: (classId: string) => void;
}

export function ClassFormDialog({ open, onOpenChange, editingClass, onCreated }: ClassFormDialogProps) {
  const teachers = useAppStore((s) => s.teachers);
  const subjects = useAppStore((s) => s.subjects);
  const students = useAppStore((s) => s.students);
  const addClass = useAppStore((s) => s.addClass);
  const updateClass = useAppStore((s) => s.updateClass);

  const [coTeacherIds, setCoTeacherIds] = useState<string[]>([]);
  const [studentIds, setStudentIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: "",
      classroomNumber: "",
      subjectId: "",
      teacherId: "",
      coTeacherIds: [],
      studentIds: [],
      seatColumns: 5,
      seatRows: undefined,
    },
  });

  const teacherIdValue = watch("teacherId");
  const subjectIdValue = watch("subjectId");
  const seatColumnsValue = watch("seatColumns");

  useEffect(() => {
    if (editingClass) {
      reset({
        name: editingClass.name,
        classroomNumber: editingClass.classroomNumber ?? "",
        subjectId: editingClass.subjectId,
        teacherId: editingClass.teacherId,
        coTeacherIds: editingClass.coTeacherIds,
        studentIds: editingClass.studentIds,
        seatColumns: editingClass.seatColumns ?? 5,
        seatRows: editingClass.seatRows,
      });
      setCoTeacherIds(editingClass.coTeacherIds);
      setStudentIds(editingClass.studentIds);
    } else {
      reset({
        name: "",
        classroomNumber: "",
        subjectId: "",
        teacherId: "",
        coTeacherIds: [],
        studentIds: [],
        seatColumns: 5,
        seatRows: undefined,
      });
      setCoTeacherIds([]);
      setStudentIds([]);
    }
  }, [editingClass, reset]);

  useEffect(() => { setValue("coTeacherIds", coTeacherIds); }, [coTeacherIds, setValue]);
  useEffect(() => { setValue("studentIds", studentIds); }, [studentIds, setValue]);

  const toggleCoTeacher = (id: string) =>
    setCoTeacherIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const toggleStudent = (id: string) =>
    setStudentIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const availableCoTeachers = teachers.filter((t) => t.id !== teacherIdValue);

  const onSubmit = (data: ClassFormData) => {
    const payload = {
      ...data,
      classroomNumber: data.classroomNumber?.trim() || undefined,
    };
    if (editingClass) {
      updateClass(editingClass.id, payload);
      toast.success(`"${data.name}" updated.`);
    } else {
      const id = addClass(payload);
      toast.success(`"${data.name}" created.`);
      onCreated?.(id);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingClass ? "Edit Class" : "Create Class"}</DialogTitle>
          <DialogDescription>
            {editingClass
              ? "Update class details. Schedule sessions from the class profile."
              : "Create the class, then schedule sessions from its profile page."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Class Name</Label>
              <Input id="name" placeholder="e.g. Grade10-A IELTS" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="classroomNumber">Classroom Number</Label>
              <Input id="classroomNumber" placeholder="e.g. 101, A-203" {...register("classroomNumber")} />
            </div>

            <div className="space-y-2">
              <Label>Seating columns</Label>
              <Select
                value={String(seatColumnsValue ?? 5)}
                onValueChange={(val) => setValue("seatColumns", Number(val), { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => i + 2).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} columns
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Seating rows</Label>
              <Select
                value={watch("seatRows") != null ? String(watch("seatRows")) : "auto"}
                onValueChange={(val) =>
                  setValue("seatRows", val === "auto" ? undefined : Number(val), {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (fit students)</SelectItem>
                  {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} rows
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subjectIdValue} onValueChange={(val) => setValue("subjectId", val, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subjectId && <p className="text-xs text-destructive">{errors.subjectId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Main Teacher</Label>
              <Select value={teacherIdValue} onValueChange={(val) => setValue("teacherId", val, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{getTeacherDisplayName(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.teacherId && <p className="text-xs text-destructive">{errors.teacherId.message}</p>}
            </div>
          </div>

          {availableCoTeachers.length > 0 && (
            <div className="space-y-2">
              <Label>Co-Teachers <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <CheckboxList
                items={availableCoTeachers.map((t) => ({ id: t.id, label: getTeacherDisplayName(t) }))}
                selectedIds={coTeacherIds}
                onToggle={toggleCoTeacher}
                maxHeight="7rem"
                emptyMessage="No other teachers available"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Enrolled Students <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <CheckboxList
              items={students.map((s) => ({ id: s.id, label: getStudentDisplayName(s) }))}
              selectedIds={studentIds}
              onToggle={toggleStudent}
              maxHeight="10rem"
              emptyMessage="No students yet"
            />
            {studentIds.length > 0 && (
              <p className="text-xs text-muted-foreground">{studentIds.length} student{studentIds.length !== 1 && "s"} selected</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editingClass ? "Save Changes" : "Create Class"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
