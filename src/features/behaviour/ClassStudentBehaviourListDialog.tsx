import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import { formatDate } from "@/lib/utils";
import type { BehaviourRecord } from "@/types";
import { Pencil, StickyNote, Trash2 } from "lucide-react";

const severityVariant: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  positive: "success",
  minor: "warning",
  moderate: "secondary",
  major: "destructive",
};

interface ClassStudentBehaviourListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  studentId: string | undefined;
  studentName: string;
  onAddNote: (studentId: string) => void;
  onEditNote: (record: BehaviourRecord) => void;
}

export function ClassStudentBehaviourListDialog({
  open,
  onOpenChange,
  classId,
  studentId,
  studentName,
  onAddNote,
  onEditNote,
}: ClassStudentBehaviourListDialogProps) {
  const behaviour = useAppStore((s) => s.behaviour);
  const subjects = useAppStore((s) => s.subjects);
  const deleteBehaviour = useAppStore((s) => s.deleteBehaviour);
  const [deleteTarget, setDeleteTarget] = useState<BehaviourRecord | null>(null);

  const rows = useMemo(() => {
    if (!studentId) return [];
    return behaviour
      .filter((b) => b.studentId === studentId && b.classId === classId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [behaviour, studentId, classId]);

  const handleAdd = () => {
    if (!studentId) return;
    onAddNote(studentId);
    onOpenChange(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteBehaviour(deleteTarget.id);
    toast.success("Note deleted.");
    setDeleteTarget(null);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[min(85vh,560px)] flex flex-col gap-0 p-0">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle>Behaviour notes</DialogTitle>
          <DialogDescription>
            {studentName} — {rows.length} {rows.length === 1 ? "note" : "notes"} for this class. Add a new one from
            the button below.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2">
          {rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No notes logged for this student in this class yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {rows.map((record) => {
                const sub = record.subjectId ? subjects.find((s) => s.id === record.subjectId) : undefined;
                return (
                  <li
                    key={record.id}
                    className="rounded-lg border border-border bg-muted/20 p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant={severityVariant[record.severity] ?? "secondary"} className="capitalize">
                            {record.severity}
                          </Badge>
                          <Badge variant="outline" className="capitalize text-xs">
                            {record.category}
                          </Badge>
                          {sub && (
                            <Badge variant="secondary" className="text-xs font-normal">
                              {sub.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDate(record.date)}</p>
                        <p className="text-foreground">{record.description}</p>
                        {record.actionTaken && (
                          <p className="text-xs text-muted-foreground">Action: {record.actionTaken}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-0.5">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="Edit note"
                          onClick={() => {
                            onOpenChange(false);
                            onEditNote(record);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete note"
                          onClick={() => setDeleteTarget(record)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="border-t border-border p-4 sm:justify-between gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" onClick={handleAdd}>
            <StickyNote className="mr-2 h-4 w-4" />
            Add note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this note?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the behaviour note permanently. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
