import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Scale, CalendarRange } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { DatePicker } from "@/components/ui/date-picker";
import { useAppStore } from "@/store";
import { totalCategoryWeight } from "@/lib/assessmentUtils";
import type { AcademicTerm, TaskAssessmentCategory } from "@/types";

export function AssessmentSettingsPage() {
  const academicTerms = useAppStore((s) => s.academicTerms);
  const taskAssessmentCategories = useAppStore((s) => s.taskAssessmentCategories);
  const subjects = useAppStore((s) => s.subjects);
  const addAcademicTerm = useAppStore((s) => s.addAcademicTerm);
  const updateAcademicTerm = useAppStore((s) => s.updateAcademicTerm);
  const deleteAcademicTerm = useAppStore((s) => s.deleteAcademicTerm);
  const addTaskAssessmentCategory = useAppStore((s) => s.addTaskAssessmentCategory);
  const updateTaskAssessmentCategory = useAppStore((s) => s.updateTaskAssessmentCategory);
  const deleteTaskAssessmentCategory = useAppStore((s) => s.deleteTaskAssessmentCategory);

  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<AcademicTerm | null>(null);
  const [deleteTermTarget, setDeleteTermTarget] = useState<AcademicTerm | null>(null);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TaskAssessmentCategory | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<TaskAssessmentCategory | null>(null);

  const sortedTerms = useMemo(
    () => [...academicTerms].sort((a, b) => a.sortOrder - b.sortOrder),
    [academicTerms]
  );

  const globalCategories = useMemo(
    () =>
      [...taskAssessmentCategories]
        .filter((c) => !c.subjectId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [taskAssessmentCategories]
  );

  const globalWeightTotal = totalCategoryWeight(globalCategories);

  const openNewTerm = () => {
    setEditingTerm(null);
    setTermDialogOpen(true);
  };

  const openEditTerm = (term: AcademicTerm) => {
    setEditingTerm(term);
    setTermDialogOpen(true);
  };

  const openNewCategory = () => {
    setEditingCategory(null);
    setCategoryDialogOpen(true);
  };

  const openEditCategory = (cat: TaskAssessmentCategory) => {
    setEditingCategory(cat);
    setCategoryDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessment settings"
        description="Configure academic terms and weighted categories for summative term grades."
      />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarRange className="h-5 w-5 text-muted-foreground" />
              Academic terms
            </CardTitle>
            <CardDescription>Semesters or quarters used to group tasks and term grades.</CardDescription>
          </div>
          <Button size="sm" onClick={openNewTerm}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add term
          </Button>
        </CardHeader>
        <CardContent>
          {sortedTerms.length === 0 ? (
            <p className="text-sm text-muted-foreground">No terms yet. Add one to tag tasks and grades.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/30">
                    <TableHead>Term</TableHead>
                    <TableHead>School year</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTerms.map((term) => (
                    <TableRow key={term.id}>
                      <TableCell className="font-medium">{term.name}</TableCell>
                      <TableCell>{term.schoolYear}</TableCell>
                      <TableCell className="text-xs tabular-nums text-muted-foreground">
                        {term.startDate} → {term.endDate}
                      </TableCell>
                      <TableCell>
                        {term.isActive ? (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => openEditTerm(term)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteTermTarget(term)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="h-5 w-5 text-muted-foreground" />
              Assessment categories
            </CardTitle>
            <CardDescription>
              Global weights for summative tasks. Should total 100% for accurate term grades.
            </CardDescription>
            <div className="mt-2">
              <Badge
                variant={globalWeightTotal === 100 ? "secondary" : "destructive"}
                className="text-xs font-normal"
              >
                Global total: {globalWeightTotal}%
              </Badge>
            </div>
          </div>
          <Button size="sm" onClick={openNewCategory}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add category
          </Button>
        </CardHeader>
        <CardContent>
          {globalCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No categories yet. Add Homework, Quizzes, Exams, etc.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/30">
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {globalCategories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{cat.weightPercent}%</TableCell>
                      <TableCell className="text-xs text-muted-foreground">All subjects</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => openEditCategory(cat)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteCategoryTarget(cat)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {taskAssessmentCategories.some((c) => c.subjectId) && (
            <p className="mt-3 text-xs text-muted-foreground">
              Subject-specific categories can be added when editing a category and selecting a subject.
            </p>
          )}
        </CardContent>
      </Card>

      <TermFormDialog
        open={termDialogOpen}
        onOpenChange={setTermDialogOpen}
        term={editingTerm}
        onSave={(data) => {
          if (editingTerm) {
            updateAcademicTerm(editingTerm.id, data);
            toast.success("Term updated.");
          } else {
            addAcademicTerm(data);
            toast.success("Term added.");
          }
          setTermDialogOpen(false);
        }}
      />

      <CategoryFormDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={editingCategory}
        subjects={subjects}
        onSave={(data) => {
          if (editingCategory) {
            updateTaskAssessmentCategory(editingCategory.id, data);
            toast.success("Category updated.");
          } else {
            addTaskAssessmentCategory(data);
            toast.success("Category added.");
          }
          setCategoryDialogOpen(false);
        }}
      />

      <AlertDialog open={deleteTermTarget !== null} onOpenChange={(o) => !o && setDeleteTermTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete term?</AlertDialogTitle>
            <AlertDialogDescription>
              Tasks and grades linked to &quot;{deleteTermTarget?.name}&quot; may not display correctly until
              reassigned to another term.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTermTarget) {
                  deleteAcademicTerm(deleteTermTarget.id);
                  toast.success("Term deleted.");
                  setDeleteTermTarget(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteCategoryTarget !== null}
        onOpenChange={(o) => !o && setDeleteCategoryTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              Summative tasks using &quot;{deleteCategoryTarget?.name}&quot; may need a new category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteCategoryTarget) {
                  deleteTaskAssessmentCategory(deleteCategoryTarget.id);
                  toast.success("Category deleted.");
                  setDeleteCategoryTarget(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TermFormDialog({
  open,
  onOpenChange,
  term,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term: AcademicTerm | null;
  onSave: (data: Omit<AcademicTerm, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const [name, setName] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(1);

  const resetFromTerm = (t: AcademicTerm | null) => {
    setName(t?.name ?? "");
    setSchoolYear(t?.schoolYear ?? "2025-26");
    setStartDate(t?.startDate ?? "");
    setEndDate(t?.endDate ?? "");
    setIsActive(t?.isActive ?? true);
    setSortOrder(t?.sortOrder ?? 1);
  };

  const handleOpenChange = (next: boolean) => {
    if (next) resetFromTerm(term);
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !schoolYear.trim() || !startDate || !endDate) {
      toast.error("Fill in all required fields.");
      return;
    }
    onSave({
      name: name.trim(),
      schoolYear: schoolYear.trim(),
      startDate,
      endDate,
      isActive,
      sortOrder,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{term ? "Edit term" : "Add term"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="term-name">Name</Label>
            <Input
              id="term-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Semester 1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="term-year">School year</Label>
            <Input
              id="term-year"
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              placeholder="2025-26"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start date</Label>
              <DatePicker value={startDate} onChange={setStartDate} />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <DatePicker value={endDate} onChange={setEndDate} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="term-order">Sort order</Label>
              <Input
                id="term-order"
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <input
                id="term-active"
                type="checkbox"
                className="h-4 w-4 rounded border border-input"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <Label htmlFor="term-active" className="cursor-pointer">
                Active term
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  subjects,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: TaskAssessmentCategory | null;
  subjects: { id: string; name: string }[];
  onSave: (data: Omit<TaskAssessmentCategory, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const [name, setName] = useState("");
  const [weightPercent, setWeightPercent] = useState(10);
  const [subjectId, setSubjectId] = useState<string>("");
  const [sortOrder, setSortOrder] = useState(1);

  const resetFromCategory = (c: TaskAssessmentCategory | null) => {
    setName(c?.name ?? "");
    setWeightPercent(c?.weightPercent ?? 10);
    setSubjectId(c?.subjectId ?? "");
    setSortOrder(c?.sortOrder ?? 1);
  };

  const handleOpenChange = (next: boolean) => {
    if (next) resetFromCategory(category);
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    if (weightPercent < 0 || weightPercent > 100) {
      toast.error("Weight must be between 0 and 100.");
      return;
    }
    onSave({
      name: name.trim(),
      weightPercent,
      subjectId: subjectId || undefined,
      sortOrder,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "Add category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Homework"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cat-weight">Weight %</Label>
              <Input
                id="cat-weight"
                type="number"
                min={0}
                max={100}
                value={weightPercent}
                onChange={(e) => setWeightPercent(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-order">Sort order</Label>
              <Input
                id="cat-order"
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Subject scope</Label>
            <Select value={subjectId || "all"} onValueChange={(v) => setSubjectId(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects (global)</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
