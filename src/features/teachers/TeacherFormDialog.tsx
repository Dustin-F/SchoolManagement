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
import { toast } from "sonner";
import { useAppStore } from "@/store";
import { teacherSchema, type TeacherFormData } from "@/lib/schemas";
import type { Teacher } from "@/types";

interface TeacherFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTeacher?: Teacher | null;
}

export function TeacherFormDialog({ open, onOpenChange, editingTeacher }: TeacherFormDialogProps) {
  const addTeacher = useAppStore((s) => s.addTeacher);
  const updateTeacher = useAppStore((s) => s.updateTeacher);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "" },
  });

  useEffect(() => {
    if (editingTeacher) {
      reset({
        firstName: editingTeacher.firstName,
        lastName: editingTeacher.lastName,
        email: editingTeacher.email,
        phone: editingTeacher.phone ?? "",
      });
    } else {
      reset({ firstName: "", lastName: "", email: "", phone: "" });
    }
  }, [editingTeacher, reset]);

  const onSubmit = (data: TeacherFormData) => {
    if (editingTeacher) {
      updateTeacher(editingTeacher.id, data);
      toast.success(`${data.firstName} ${data.lastName} updated.`);
    } else {
      addTeacher({ ...data, subjects: [] });
      toast.success(`${data.firstName} ${data.lastName} added.`);
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="Sarah" {...register("firstName")} />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Johnson" {...register("lastName")} />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

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
