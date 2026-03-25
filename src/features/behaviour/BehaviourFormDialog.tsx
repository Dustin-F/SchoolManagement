import { useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import { behaviourSchema, type BehaviourFormData } from "@/lib/schemas";
import type { BehaviourRecord, BehaviourCategory, BehaviourSeverity } from "@/types";

const categories: BehaviourCategory[] = ["academic", "conduct", "participation", "respect", "other"];
const severities: BehaviourSeverity[] = ["positive", "minor", "moderate", "major"];

interface BehaviourFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRecord?: BehaviourRecord | null;
  preselectedStudentId?: string;
  preselectedClassId?: string;
  preselectedSubjectId?: string;
}

export function BehaviourFormDialog({
  open,
  onOpenChange,
  editingRecord,
  preselectedStudentId,
  preselectedClassId,
  preselectedSubjectId,
}: BehaviourFormDialogProps) {
  const students = useAppStore((s) => s.students);
  const classes = useAppStore((s) => s.classes);
  const subjects = useAppStore((s) => s.subjects);
  const addBehaviour = useAppStore((s) => s.addBehaviour);
  const updateBehaviour = useAppStore((s) => s.updateBehaviour);

  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BehaviourFormData>({
    resolver: zodResolver(behaviourSchema),
    defaultValues: {
      studentId: preselectedStudentId ?? "",
      classId: preselectedClassId ?? "",
      subjectId: preselectedSubjectId ?? "",
      date: today,
      category: "conduct",
      severity: "minor",
      description: "",
      actionTaken: "",
    },
  });

  const studentIdValue = watch("studentId");
  const classIdValue = watch("classId");
  const subjectIdValue = watch("subjectId");
  const categoryValue = watch("category");
  const severityValue = watch("severity");

  useEffect(() => {
    if (editingRecord) {
      reset({
        studentId: editingRecord.studentId,
        classId: editingRecord.classId ?? "",
        subjectId: editingRecord.subjectId ?? "",
        date: editingRecord.date,
        category: editingRecord.category,
        severity: editingRecord.severity,
        description: editingRecord.description,
        actionTaken: editingRecord.actionTaken ?? "",
      });
    } else {
      reset({
        studentId: preselectedStudentId ?? "",
        classId: preselectedClassId ?? "",
        subjectId: preselectedSubjectId ?? "",
        date: today,
        category: "conduct",
        severity: "minor",
        description: "",
        actionTaken: "",
      });
    }
  }, [editingRecord, preselectedStudentId, preselectedClassId, preselectedSubjectId, reset, today]);

  const studentClasses = useMemo(
    () => studentIdValue ? classes.filter((c) => c.studentIds.includes(studentIdValue)) : [],
    [studentIdValue, classes]
  );

  useEffect(() => {
    if (editingRecord) return;
    if (!studentIdValue) {
      if (preselectedClassId) setValue("classId", preselectedClassId);
      return;
    }
    if (studentClasses.length === 0) return;
    const pick =
      preselectedClassId && studentClasses.some((c) => c.id === preselectedClassId)
        ? preselectedClassId
        : studentClasses[0].id;
    setValue("classId", pick);
  }, [studentIdValue, studentClasses, setValue, editingRecord, preselectedClassId]);

  const onSubmit = (data: BehaviourFormData) => {
    if (editingRecord) {
      updateBehaviour(editingRecord.id, data);
      toast.success("Behaviour note updated.");
    } else {
      addBehaviour(data);
      toast.success("Behaviour note added.");
    }
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingRecord ? "Edit Behaviour Note" : "Add Behaviour Note"}</DialogTitle>
          <DialogDescription>
            {editingRecord ? "Update this behaviour record." : "Record a behaviour note for a student."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select
                value={studentIdValue}
                onValueChange={(val) => setValue("studentId", val, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.studentId && <p className="text-xs text-destructive">{errors.studentId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Class (optional)</Label>
              <Select value={classIdValue ?? ""} onValueChange={(val) => setValue("classId", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {(studentIdValue ? studentClasses : classes).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject (optional)</Label>
              <Select value={subjectIdValue ?? ""} onValueChange={(val) => setValue("subjectId", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryValue} onValueChange={(val) => setValue("category", val as BehaviourCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={severityValue} onValueChange={(val) => setValue("severity", val as BehaviourSeverity)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {severities.map((sev) => (
                    <SelectItem key={sev} value={sev} className="capitalize">{sev}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="What happened..." rows={3} {...register("description")} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="actionTaken">Action Taken (optional)</Label>
            <Input id="actionTaken" placeholder="e.g. Verbal warning" {...register("actionTaken")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editingRecord ? "Save Changes" : "Add Note"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
