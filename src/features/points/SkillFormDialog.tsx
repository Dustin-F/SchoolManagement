import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner";
import { useAppStore } from "@/store";
import { behaviourSkillSchema, type BehaviourSkillFormData } from "@/lib/schemas";
import type { BehaviourSkill } from "@/types";

interface SkillFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSkill?: BehaviourSkill | null;
  nextSortOrder?: number;
}

export function SkillFormDialog({
  open,
  onOpenChange,
  editingSkill,
  nextSortOrder = 0,
}: SkillFormDialogProps) {
  const addBehaviourSkill = useAppStore((s) => s.addBehaviourSkill);
  const updateBehaviourSkill = useAppStore((s) => s.updateBehaviourSkill);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BehaviourSkillFormData>({
    resolver: zodResolver(behaviourSkillSchema),
    defaultValues: {
      name: "",
      emoji: "",
      points: 1,
      type: "positive",
      active: true,
      sortOrder: nextSortOrder,
    },
  });

  const typeValue = watch("type");

  useEffect(() => {
    if (!open) return;
    if (editingSkill) {
      reset({
        name: editingSkill.name,
        emoji: editingSkill.emoji ?? "",
        points: editingSkill.points,
        type: editingSkill.type,
        active: editingSkill.active,
        sortOrder: editingSkill.sortOrder,
      });
    } else {
      reset({
        name: "",
        emoji: "",
        points: 1,
        type: "positive",
        active: true,
        sortOrder: nextSortOrder,
      });
    }
  }, [open, editingSkill, nextSortOrder, reset]);

  const onSubmit = (data: BehaviourSkillFormData) => {
    const payload = {
      ...data,
      emoji: data.emoji?.trim() || undefined,
      points: data.type === "needs_work" && data.points > 0 ? -data.points : data.points,
    };
    if (editingSkill) {
      updateBehaviourSkill(editingSkill.id, payload);
      toast.success(`"${data.name}" updated.`);
    } else {
      addBehaviourSkill(payload);
      toast.success(`"${data.name}" added.`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingSkill ? "Edit skill" : "New skill"}</DialogTitle>
          <DialogDescription>
            School-wide skills appear on every class points toolbar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="skill-name">Name</Label>
              <Input id="skill-name" placeholder="e.g. Great participation" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-emoji">Emoji (optional)</Label>
              <Input id="skill-emoji" placeholder="👏" maxLength={4} {...register("emoji")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-points">Points</Label>
              <Input id="skill-points" type="number" step={1} {...register("points", { valueAsNumber: true })} />
              {errors.points && <p className="text-xs text-destructive">{errors.points.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={typeValue}
                onValueChange={(v) => setValue("type", v as BehaviourSkillFormData["type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positive (merit)</SelectItem>
                  <SelectItem value="needs_work">Needs work (reminder)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-order">Sort order</Label>
              <Input id="skill-order" type="number" {...register("sortOrder", { valueAsNumber: true })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingSkill ? "Save" : "Add skill"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
