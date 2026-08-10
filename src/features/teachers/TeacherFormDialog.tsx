import { useEffect } from "react";
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
import { PersonNameFormFields } from "@/components/PersonNameFormFields";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import { teacherSchema, type TeacherFormData } from "@/lib/schemas";
import { getTeacherDisplayName } from "@/lib/displayHelpers";
import type { Teacher } from "@/types";

interface TeacherFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTeacher?: Teacher | null;
}

function normalizeTeacherPayload(data: TeacherFormData) {
  return {
    ...data,
    firstName: (data.firstName ?? "").trim(),
    lastName: (data.lastName ?? "").trim(),
    name2First: data.name2First?.trim() || undefined,
    name2Last: data.name2Last?.trim() || undefined,
    name3First: data.name3First?.trim() || undefined,
    name3Last: data.name3Last?.trim() || undefined,
  };
}

export function TeacherFormDialog({ open, onOpenChange, editingTeacher }: TeacherFormDialogProps) {
  const addTeacher = useAppStore((s) => s.addTeacher);
  const updateTeacher = useAppStore((s) => s.updateTeacher);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      name2First: "",
      name2Last: "",
      name3First: "",
      name3Last: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (editingTeacher) {
      reset({
        firstName: editingTeacher.firstName ?? "",
        lastName: editingTeacher.lastName ?? "",
        name2First: editingTeacher.name2First ?? "",
        name2Last: editingTeacher.name2Last ?? "",
        name3First: editingTeacher.name3First ?? "",
        name3Last: editingTeacher.name3Last ?? "",
        email: editingTeacher.email,
        phone: editingTeacher.phone ?? "",
      });
    } else {
      reset({
        firstName: "",
        lastName: "",
        name2First: "",
        name2Last: "",
        name3First: "",
        name3Last: "",
        email: "",
        phone: "",
      });
    }
  }, [editingTeacher, reset]);

  const onSubmit = (data: TeacherFormData) => {
    const payload = normalizeTeacherPayload(data);
    if (editingTeacher) {
      updateTeacher(editingTeacher.id, payload);
      toast.success(`${getTeacherDisplayName({ ...editingTeacher, ...payload })} updated.`);
    } else {
      addTeacher({ ...payload, subjects: [] });
      toast.success(`${getTeacherDisplayName({ ...payload, id: "", createdAt: "", updatedAt: "" })} added.`);
    }
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingTeacher ? "Edit Teacher" : "Add Teacher"}</DialogTitle>
          <DialogDescription>
            {editingTeacher ? "Update teacher information." : "Enter the teacher's details."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <PersonNameFormFields
            register={register}
            setValue={setValue}
            errors={errors}
            showSavedTiers={!!editingTeacher}
            hasName2Data={
              !!(editingTeacher?.name2First?.trim() || editingTeacher?.name2Last?.trim())
            }
            hasName3Data={
              !!(editingTeacher?.name3First?.trim() || editingTeacher?.name3Last?.trim())
            }
          />

          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input id="email" type="email" placeholder="s.johnson@school.edu" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" placeholder="555-0100" {...register("phone")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingTeacher ? "Save Changes" : "Add Teacher"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
