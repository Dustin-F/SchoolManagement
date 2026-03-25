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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import { classTaskSchema, type ClassTaskFormData } from "@/lib/schemas";
import type { ClassTask, ClassTaskType } from "@/types";

const taskTypes: ClassTaskType[] = [
  "exam",
  "presentation",
  "homework",
  "quiz",
  "project",
  "essay",
  "worksheet",
  "other",
];

interface ClassTaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  editingTask?: ClassTask | null;
}

export function ClassTaskFormDialog({
  open,
  onOpenChange,
  classId,
  editingTask,
}: ClassTaskFormDialogProps) {
  const addClassTask = useAppStore((s) => s.addClassTask);
  const updateClassTask = useAppStore((s) => s.updateClassTask);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClassTaskFormData>({
    resolver: zodResolver(classTaskSchema),
    defaultValues: {
      title: "",
      type: "homework",
      description: "",
      deadline: "",
      maxScore: "",
    },
  });

  const typeValue = watch("type");

  useEffect(() => {
    if (editingTask) {
      reset({
        title: editingTask.title,
        type: editingTask.type,
        description: editingTask.description ?? "",
        deadline: editingTask.deadline.includes("T")
          ? editingTask.deadline.split("T")[0]
          : editingTask.deadline,
        maxScore:
          editingTask.maxScore != null && editingTask.maxScore !== undefined
            ? String(editingTask.maxScore)
            : "",
      });
    } else {
      reset({
        title: "",
        type: "homework",
        description: "",
        deadline: "",
        maxScore: "",
      });
    }
  }, [editingTask, reset]);

  const onSubmit = (data: ClassTaskFormData) => {
    const raw = data.maxScore?.trim() ?? "";
    const maxScore =
      raw === "" ? null : Number.isFinite(Number(raw)) && Number(raw) >= 0 ? Number(raw) : null;
    const payload = {
      classId,
      title: data.title,
      type: data.type,
      description: data.description || undefined,
      deadline: data.deadline,
      maxScore,
    };
    if (editingTask) {
      updateClassTask(editingTask.id, payload);
      toast.success("Task updated.");
    } else {
      addClassTask(payload);
      toast.success("Task created.");
    }
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTask ? "Edit task" : "New class task"}</DialogTitle>
          <DialogDescription>
            {editingTask ? "Update assignment details." : "Add a task with a deadline for this class."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g. Unit 2 project" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={typeValue} onValueChange={(v) => setValue("type", v as ClassTaskType, { shouldValidate: true })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {taskTypes.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" type="date" {...register("deadline")} />
              {errors.deadline && <p className="text-xs text-destructive">{errors.deadline.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxScore">Max score <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input id="maxScore" type="number" min={0} step={0.5} placeholder="e.g. 100" {...register("maxScore")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description / info <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea id="description" rows={3} placeholder="Instructions or details..." {...register("description")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editingTask ? "Save" : "Create task"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
