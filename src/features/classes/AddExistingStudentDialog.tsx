import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

interface AddExistingStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  enrolledStudentIds: string[];
}

export function AddExistingStudentDialog({
  open,
  onOpenChange,
  classId,
  enrolledStudentIds,
}: AddExistingStudentDialogProps) {
  const students = useAppStore((s) => s.students);
  const enrollStudentInClass = useAppStore((s) => s.enrollStudentInClass);
  const [selectedId, setSelectedId] = useState("");

  const available = students.filter((s) => !enrolledStudentIds.includes(s.id));

  useEffect(() => {
    if (open) setSelectedId("");
  }, [open]);

  const handleAdd = () => {
    if (!selectedId) {
      toast.error("Select a student.");
      return;
    }
    enrollStudentInClass(classId, selectedId);
    toast.success("Student added to class.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add student to class</DialogTitle>
          <DialogDescription>
            Choose a student who is not already enrolled in this class.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label>Student</Label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder={available.length === 0 ? "No students available" : "Select a student"} />
            </SelectTrigger>
            <SelectContent>
              {available.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {available.length === 0 && (
            <p className="text-sm text-muted-foreground">All students are already enrolled, or there are no students yet.</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!selectedId || available.length === 0}>Add to class</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
