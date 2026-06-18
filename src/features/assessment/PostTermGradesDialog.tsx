import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStudentDisplayName } from "@/lib/displayHelpers";
import {
  getTermLetterBands,
  letterForTermPercent,
  normalizeTermGrade,
} from "@/lib/termGradeUtils";
import { useAppStore } from "@/store";
import type { SchoolClass, Student, TermGrade } from "@/types";

interface PostTermGradesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cls: SchoolClass;
  termId: string;
  students: Student[];
  rows: { student: Student; grade: TermGrade | undefined }[];
}

export function PostTermGradesDialog({
  open,
  onOpenChange,
  cls,
  termId,
  students,
  rows,
}: PostTermGradesDialogProps) {
  const schoolGradingSettings = useAppStore((s) => s.schoolGradingSettings);
  const postTermGrade = useAppStore((s) => s.postTermGrade);
  const bands = useMemo(() => getTermLetterBands(schoolGradingSettings), [schoolGradingSettings]);

  const postable = useMemo(
    () =>
      rows.filter(({ grade }) => {
        const g = grade ? normalizeTermGrade(grade) : null;
        return g?.calculatedPercent != null && g.postStatus !== "posted";
      }),
    [rows]
  );

  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const toggle = (studentId: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(studentId);
      else next.delete(studentId);
      return next;
    });
  };

  const selectAll = (on: boolean) => {
    setSelected(on ? new Set(postable.map((r) => r.student.id)) : new Set());
  };

  const handlePost = () => {
    if (selected.size === 0) {
      toast.error("Select at least one student to post.");
      return;
    }
    let count = 0;
    for (const studentId of selected) {
      const grade = rows.find((r) => r.student.id === studentId)?.grade;
      if (!grade || grade.calculatedPercent == null) continue;
      const raw = overrides[studentId]?.trim();
      const postedPercent =
        raw === "" || raw === undefined
          ? grade.calculatedPercent
          : Number(raw);
      if (raw !== "" && raw !== undefined && !Number.isFinite(postedPercent)) {
        toast.error(`Invalid override for ${getStudentDisplayName(students.find((s) => s.id === studentId)!)}`);
        return;
      }
      postTermGrade(studentId, cls.id, termId, {
        postedPercent: postedPercent ?? grade.calculatedPercent,
        postedLetter:
          postedPercent != null ? letterForTermPercent(postedPercent, bands) : null,
      });
      count += 1;
    }
    toast.success(`Posted grades for ${count} student${count === 1 ? "" : "s"}.`);
    onOpenChange(false);
    setSelected(new Set());
    setOverrides({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Post term grades</DialogTitle>
          <DialogDescription>
            Locks the official report-card mark for each student. Running grades keep updating
            until you post. You can override the percent before posting.
          </DialogDescription>
        </DialogHeader>

        {postable.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No students with a calculable running grade are ready to post.
          </p>
        ) : (
          <div className="max-h-[24rem] overflow-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border border-input"
                      checked={selected.size === postable.length && postable.length > 0}
                      onChange={(e) => selectAll(e.target.checked)}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Running</TableHead>
                  <TableHead className="text-right">Post as %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {postable.map(({ student, grade }) => {
                  const g = normalizeTermGrade(grade!);
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border border-input"
                          checked={selected.has(student.id)}
                          onChange={(e) => toggle(student.id, e.target.checked)}
                          aria-label={`Select ${getStudentDisplayName(student)}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {getStudentDisplayName(student)}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {g.calculatedPercent}%
                        {g.calculatedLetter && (
                          <span className="ml-1 text-muted-foreground">({g.calculatedLetter})</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          className="ml-auto h-8 w-20 text-center text-xs tabular-nums"
                          placeholder={String(g.calculatedPercent ?? "")}
                          value={overrides[student.id] ?? ""}
                          onChange={(e) =>
                            setOverrides((prev) => ({
                              ...prev,
                              [student.id]: e.target.value,
                            }))
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handlePost} disabled={postable.length === 0}>
            Post selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
