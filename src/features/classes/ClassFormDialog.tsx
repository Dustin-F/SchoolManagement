import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { nanoid } from "nanoid";
import { Plus, Trash2 } from "lucide-react";
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
import { DAY_ORDER } from "@/lib/utils";
import type { SchoolClass, DayOfWeek } from "@/types";

const dayLabels: Record<DayOfWeek, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingClass?: SchoolClass | null;
}

export function ClassFormDialog({ open, onOpenChange, editingClass }: ClassFormDialogProps) {
  const teachers = useAppStore((s) => s.teachers);
  const subjects = useAppStore((s) => s.subjects);
  const students = useAppStore((s) => s.students);
  const addClass = useAppStore((s) => s.addClass);
  const updateClass = useAppStore((s) => s.updateClass);

  const [coTeacherIds, setCoTeacherIds] = useState<string[]>([]);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<ClassFormData["schedule"]>([]);

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
      subjectId: "",
      teacherId: "",
      coTeacherIds: [],
      studentIds: [],
      schedule: [],
    },
  });

  const teacherIdValue = watch("teacherId");
  const subjectIdValue = watch("subjectId");

  useEffect(() => {
    if (editingClass) {
      reset({
        name: editingClass.name,
        subjectId: editingClass.subjectId,
        teacherId: editingClass.teacherId,
        coTeacherIds: editingClass.coTeacherIds,
        studentIds: editingClass.studentIds,
        schedule: editingClass.schedule,
      });
      setCoTeacherIds(editingClass.coTeacherIds);
      setStudentIds(editingClass.studentIds);
      setSchedule(editingClass.schedule);
    } else {
      reset({
        name: "",
        subjectId: "",
        teacherId: "",
        coTeacherIds: [],
        studentIds: [],
        schedule: [],
      });
      setCoTeacherIds([]);
      setStudentIds([]);
      setSchedule([]);
    }
  }, [editingClass, reset]);

  useEffect(() => { setValue("coTeacherIds", coTeacherIds); }, [coTeacherIds, setValue]);
  useEffect(() => { setValue("studentIds", studentIds); }, [studentIds, setValue]);
  useEffect(() => { setValue("schedule", schedule); }, [schedule, setValue]);

  const toggleCoTeacher = (id: string) =>
    setCoTeacherIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const toggleStudent = (id: string) =>
    setStudentIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const addScheduleRow = () =>
    setSchedule((prev) => [...prev, { id: nanoid(), dayOfWeek: "monday", startTime: "08:00", endTime: "09:00" }]);
  const removeScheduleRow = (id: string) =>
    setSchedule((prev) => prev.filter((s) => s.id !== id));
  const updateScheduleRow = (id: string, field: string, value: string) =>
    setSchedule((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));

  const availableCoTeachers = teachers.filter((t) => t.id !== teacherIdValue);

  const onSubmit = (data: ClassFormData) => {
    if (editingClass) {
      updateClass(editingClass.id, data);
      toast.success(`"${data.name}" updated.`);
    } else {
      addClass(data);
      toast.success(`"${data.name}" created.`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingClass ? "Edit Class" : "Create Class"}</DialogTitle>
          <DialogDescription>
            {editingClass ? "Update the class details below." : "Fill in the details to create a new class."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Class Name</Label>
              <Input id="name" placeholder="e.g. Grade10-A IELTS" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
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
                    <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>
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
                items={availableCoTeachers.map((t) => ({ id: t.id, label: `${t.firstName} ${t.lastName}` }))}
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
              items={students.map((s) => ({ id: s.id, label: `${s.firstName} ${s.lastName}` }))}
              selectedIds={studentIds}
              onToggle={toggleStudent}
              maxHeight="10rem"
              emptyMessage="No students yet"
            />
            {studentIds.length > 0 && (
              <p className="text-xs text-muted-foreground">{studentIds.length} student{studentIds.length !== 1 && "s"} selected</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Schedule</Label>
              <Button type="button" size="sm" variant="outline" onClick={addScheduleRow}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Time Slot
              </Button>
            </div>
            {schedule.length === 0 ? (
              <p className="text-sm text-muted-foreground">No schedule entries yet. Add a time slot above.</p>
            ) : (
              <div className="space-y-2">
                {schedule.map((entry, index) => (
                  <div key={entry.id} className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2.5">
                      <Select
                        value={entry.dayOfWeek}
                        onValueChange={(val) => updateScheduleRow(entry.id, "dayOfWeek", val)}
                      >
                        <SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DAY_ORDER.map((d) => (
                            <SelectItem key={d} value={d}>{dayLabels[d]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={entry.startTime}
                          onChange={(e) => updateScheduleRow(entry.id, "startTime", e.target.value)}
                          className="w-28"
                        />
                        <span className="text-sm text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={entry.endTime}
                          onChange={(e) => updateScheduleRow(entry.id, "endTime", e.target.value)}
                          className="w-28"
                        />
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="ml-auto h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                        onClick={() => removeScheduleRow(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {errors.schedule?.[index]?.endTime?.message && (
                      <p className="text-xs text-destructive">
                        {errors.schedule?.[index]?.endTime?.message as unknown as string}
                      </p>
                    )}
                  </div>
                ))}
              </div>
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
