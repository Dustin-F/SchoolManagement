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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import { subjectSchema, type SubjectFormData } from "@/lib/schemas";
import type { Subject } from "@/types";

interface SubjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSubject?: Subject | null;
}

export function SubjectFormDialog({ open, onOpenChange, editingSubject }: SubjectFormDialogProps) {
  const addSubject = useAppStore((s) => s.addSubject);
  const updateSubject = useAppStore((s) => s.updateSubject);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { name: "", code: "", description: "" },
  });

  useEffect(() => {
    if (editingSubject) {
      reset({
        name: editingSubject.name,
        code: editingSubject.code ?? "",
        description: editingSubject.description ?? "",
      });
    } else {
      reset({ name: "", code: "", description: "" });
    }
  }, [editingSubject, reset]);

  const onSubmit = (data: SubjectFormData) => {
    if (editingSubject) {
      updateSubject(editingSubject.id, data);
      toast.success(`"${data.name}" updated.`);
    } else {
      addSubject(data);
      toast.success(`"${data.name}" created.`);
    }
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingSubject ? "Edit Subject" : "Add Subject"}</DialogTitle>
          <DialogDescription>
            {editingSubject ? "Update the subject details." : "Create a new subject."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Subject Name</Label>
              <Input id="name" placeholder="Mathematics" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code (optional)</Label>
              <Input id="code" placeholder="MATH" {...register("code")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" placeholder="Brief description..." rows={2} {...register("description")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingSubject ? "Save Changes" : "Add Subject"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
