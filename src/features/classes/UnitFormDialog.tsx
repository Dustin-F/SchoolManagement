import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { classUnitSchema, type ClassUnitFormData } from "@/lib/schemas";
import { termLabel } from "@/lib/assessmentUtils";
import type { AcademicTerm, ClassUnit, ClassUnitStatus } from "@/types";

const statuses: ClassUnitStatus[] = ["planned", "in_progress", "completed"];

interface UnitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  academicTerms: AcademicTerm[];
  editingUnit?: ClassUnit | null;
  defaultSortOrder?: number;
  onSave: (data: ClassUnitFormData) => void;
}

export function UnitFormDialog({
  open,
  onOpenChange,
  academicTerms,
  editingUnit,
  defaultSortOrder = 1,
  onSave,
}: UnitFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClassUnitFormData>({
    resolver: zodResolver(classUnitSchema),
    defaultValues: {
      title: "",
      description: "",
      inquiry: "",
      curriculumNotes: "",
      startDate: "",
      endDate: "",
      durationWeeks: undefined,
      termId: "",
      sortOrder: defaultSortOrder,
      status: "planned",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (editingUnit) {
      reset({
        title: editingUnit.title,
        description: editingUnit.description ?? "",
        inquiry: editingUnit.inquiry ?? "",
        curriculumNotes: editingUnit.curriculumNotes ?? "",
        startDate: editingUnit.startDate,
        endDate: editingUnit.endDate ?? "",
        durationWeeks: editingUnit.durationWeeks,
        termId: editingUnit.termId ?? "",
        sortOrder: editingUnit.sortOrder,
        status: editingUnit.status ?? "planned",
      });
    } else {
      reset({
        title: "",
        description: "",
        inquiry: "",
        curriculumNotes: "",
        startDate: "",
        endDate: "",
        durationWeeks: undefined,
        termId: academicTerms[0]?.id ?? "",
        sortOrder: defaultSortOrder,
        status: "planned",
      });
    }
  }, [open, editingUnit, reset, academicTerms, defaultSortOrder]);

  const statusValue = watch("status");
  const termIdValue = watch("termId");
  const startDate = watch("startDate");
  const endDate = watch("endDate");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingUnit ? "Edit unit" : "New unit"}</DialogTitle>
          <DialogDescription>
            Plan curriculum units with inquiry questions — ideal for IB and thematic teaching.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((data) => {
            onSave({
              ...data,
              description: data.description?.trim() || undefined,
              inquiry: data.inquiry?.trim() || undefined,
              curriculumNotes: data.curriculumNotes?.trim() || undefined,
              endDate: data.endDate?.trim() || undefined,
              termId: data.termId?.trim() || undefined,
              durationWeeks: data.durationWeeks || undefined,
            });
          })}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="unit-title">Title</Label>
            <Input id="unit-title" placeholder="e.g. Unit 3 — Forces & motion" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit-inquiry">Inquiry / essential question</Label>
            <Textarea
              id="unit-inquiry"
              rows={2}
              placeholder="What big question drives this unit?"
              {...register("inquiry")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit-description">Overview</Label>
            <Textarea
              id="unit-description"
              rows={2}
              placeholder="Brief summary for teachers and students…"
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit-curriculum">Curriculum notes</Label>
            <Textarea
              id="unit-curriculum"
              rows={2}
              placeholder="Standards, ATL skills, IB objectives…"
              {...register("curriculumNotes")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start date</Label>
              <DatePicker
                id="unit-start"
                value={startDate ?? ""}
                onChange={(v) => setValue("startDate", v, { shouldValidate: true })}
              />
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <DatePicker
                id="unit-end"
                value={endDate ?? ""}
                onChange={(v) => setValue("endDate", v)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="unit-weeks">Duration (weeks)</Label>
              <Input
                id="unit-weeks"
                type="number"
                min={1}
                max={52}
                {...register("durationWeeks", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Term</Label>
              <Select
                value={termIdValue || "none"}
                onValueChange={(v) => setValue("termId", v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No term</SelectItem>
                  {academicTerms.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {termLabel(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusValue ?? "planned"}
                onValueChange={(v) => setValue("status", v as ClassUnitStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {editingUnit ? "Save unit" : "Create unit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
