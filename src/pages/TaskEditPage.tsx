import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { nanoid } from "nanoid";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ClipboardPen, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store";
import { classTaskSchema, type ClassTaskFormData } from "@/lib/schemas";
import { categoriesForSubject, getDefaultTermId, termLabel, categoryLabel } from "@/lib/assessmentUtils";
import { RubricCriteriaEditor } from "@/features/tasks/RubricCriteriaEditor";
import {
  DEFAULT_LETTER_GRADES,
  scoreModeLabel,
  sortLetterGrades,
} from "@/lib/taskScoringUtils";
import type { ClassTaskType, LetterGradeBand, RubricCriterion, TaskAssessmentRole, TaskScoreMode } from "@/types";
import { cn } from "@/lib/utils";

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

const scoreModes: TaskScoreMode[] = ["points", "percentage", "rubric"];

function parseOptionalNumber(raw: string | undefined): number | null {
  const trimmed = raw?.trim() ?? "";
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function TaskEditPage() {
  const { classId, taskId } = useParams<{ classId: string; taskId: string }>();
  const navigate = useNavigate();
  const isNew = taskId === "new";

  const classes = useAppStore((s) => s.classes);
  const classTasks = useAppStore((s) => s.classTasks);
  const academicTerms = useAppStore((s) => s.academicTerms);
  const taskAssessmentCategories = useAppStore((s) => s.taskAssessmentCategories);
  const addClassTask = useAppStore((s) => s.addClassTask);
  const updateClassTask = useAppStore((s) => s.updateClassTask);

  const cls = classes.find((c) => c.id === classId);
  const editingTask = !isNew ? classTasks.find((t) => t.id === taskId) : null;
  const classCategories = cls
    ? categoriesForSubject(taskAssessmentCategories, cls.subjectId)
    : [];
  const defaultTermId = getDefaultTermId(academicTerms) ?? "";
  const defaultCategoryId = classCategories[0]?.id ?? "";

  const [rubric, setRubric] = useState<RubricCriterion[]>([]);
  const [letterGrades, setLetterGrades] = useState<LetterGradeBand[]>(DEFAULT_LETTER_GRADES);
  const [useLetterGrades, setUseLetterGrades] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClassTaskFormData>({
    resolver: zodResolver(classTaskSchema),
    defaultValues: {
      title: "",
      type: "homework",
      description: "",
      instructions: "",
      deadline: "",
      scoreMode: "points",
      maxScore: "",
      assessmentRole: "summative",
      termId: defaultTermId,
      categoryId: defaultCategoryId,
    },
  });

  const typeValue = watch("type");
  const scoreMode = watch("scoreMode");
  const assessmentRole = watch("assessmentRole");
  const termIdValue = watch("termId");
  const categoryIdValue = watch("categoryId");

  useEffect(() => {
    if (!cls) return;
    if (!isNew && !editingTask) return;

    if (editingTask) {
      setRubric(editingTask.rubric ?? []);
      const hasLetters =
        (editingTask.letterGrades?.length ?? 0) > 0 ||
        (editingTask.scoreMode as string) === "letter";
      setUseLetterGrades(hasLetters);
      setLetterGrades(
        editingTask.letterGrades?.length ? sortLetterGrades(editingTask.letterGrades) : DEFAULT_LETTER_GRADES
      );
      const mode = editingTask.scoreMode ?? "points";
      reset({
        title: editingTask.title,
        type: editingTask.type,
        description: editingTask.description ?? "",
        instructions: editingTask.instructions ?? "",
        deadline: editingTask.deadline.includes("T")
          ? editingTask.deadline.split("T")[0]
          : editingTask.deadline,
        scoreMode: (mode as string) === "letter" ? "percentage" : mode,
        maxScore:
          editingTask.maxScore != null ? String(editingTask.maxScore) : "",
        assessmentRole: editingTask.assessmentRole ?? "summative",
        termId: editingTask.termId ?? defaultTermId,
        categoryId: editingTask.categoryId ?? defaultCategoryId,
      });
    } else {
      setRubric([]);
      setLetterGrades(DEFAULT_LETTER_GRADES);
      setUseLetterGrades(true);
      reset({
        title: "",
        type: "homework",
        description: "",
        instructions: "",
        deadline: "",
        scoreMode: "points",
        maxScore: "",
        assessmentRole: "summative",
        termId: defaultTermId,
        categoryId: defaultCategoryId,
      });
    }
  }, [cls, editingTask, isNew, reset, defaultTermId, defaultCategoryId]);

  if (!cls) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-muted-foreground">Class not found.</p>
        <Button variant="link" asChild>
          <Link to="/classes">Back to classes</Link>
        </Button>
      </div>
    );
  }

  if (!isNew && !editingTask) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-muted-foreground">Task not found.</p>
        <Button variant="link" asChild>
          <Link to={`/classes/${cls.id}`}>Back to class</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = (data: ClassTaskFormData) => {
    if (data.scoreMode === "rubric") {
      const valid = rubric.filter((b) => b.label.trim());
      if (valid.length === 0) {
        toast.error("Add at least one rubric criterion.");
        return;
      }
      const rubricTotal = valid.reduce((s, c) => s + (c.maxPoints ?? 0), 0);
      if (rubricTotal <= 0) {
        toast.error("Each criterion needs a max greater than 0.");
        return;
      }
    }

    const payload = {
      classId: cls.id,
      title: data.title.trim(),
      type: data.type,
      description: data.description?.trim() || undefined,
      instructions: data.instructions?.trim() || undefined,
      deadline: data.deadline,
      scoreMode: data.scoreMode,
      maxScore: data.scoreMode === "points" ? parseOptionalNumber(data.maxScore) : null,
      letterGrades: useLetterGrades
        ? sortLetterGrades(letterGrades.filter((b) => b.letter.trim()))
        : undefined,
      rubric:
        data.scoreMode === "rubric"
          ? rubric.filter((b) => b.label.trim())
          : undefined,
      assessmentRole: data.assessmentRole,
      termId: data.termId,
      categoryId: data.categoryId,
    };

    if (editingTask) {
      updateClassTask(editingTask.id, payload);
      toast.success("Task saved.");
      navigate(`/classes/${cls.id}?tab=tasks`);
      return;
    }

    const newId = addClassTask(payload);
    toast.success("Task created.");
    navigate(`/classes/${cls.id}/tasks/${newId}/grade`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
        <Link to={`/classes/${cls.id}?tab=tasks`}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to {cls.name}
        </Link>
      </Button>

      <PageHeader
        title={isNew ? "New task" : "Edit task"}
        description={`${cls.name} · ${isNew ? "Set up scoring and instructions on this page." : editingTask?.title}`}
        actions={
          !isNew && editingTask ? (
            <Button size="sm" variant="outline" asChild>
              <Link to={`/classes/${cls.id}/tasks/${editingTask.id}/grade`}>
                <ClipboardPen className="mr-1.5 h-3.5 w-3.5" />
                Grade students
              </Link>
            </Button>
          ) : undefined
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
            <CardDescription>Title, type, and deadline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="e.g. Unit 2 essay" {...register("title")} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={typeValue}
                  onValueChange={(v) => setValue("type", v as ClassTaskType, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <DatePicker
                  id="deadline"
                  value={watch("deadline") ?? ""}
                  onChange={(v) => setValue("deadline", v, { shouldValidate: true })}
                  placeholder="Pick deadline"
                />
                {errors.deadline && (
                  <p className="text-xs text-destructive">{errors.deadline.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short description</Label>
              <Textarea
                id="description"
                rows={2}
                placeholder="Brief summary shown in lists…"
                {...register("description")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assessment</CardTitle>
            <CardDescription>
              Formative tasks are for practice only. Summative tasks count toward term grades using
              category weights.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={assessmentRole}
                  onValueChange={(v) =>
                    setValue("assessmentRole", v as TaskAssessmentRole, { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formative">Formative (practice)</SelectItem>
                    <SelectItem value="summative">Summative (counts)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Term</Label>
                <Select
                  value={termIdValue}
                  onValueChange={(v) => setValue("termId", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicTerms.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {termLabel(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.termId && (
                  <p className="text-xs text-destructive">{errors.termId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={categoryIdValue}
                  onValueChange={(v) => setValue("categoryId", v, { shouldValidate: true })}
                  disabled={assessmentRole === "formative"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {classCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {categoryLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-xs text-destructive">{errors.categoryId.message}</p>
                )}
              </div>
            </div>
            {assessmentRole === "formative" && (
              <p className="text-xs text-muted-foreground">
                Formative tasks are tracked but excluded from weighted term grade calculations.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scoring</CardTitle>
            <CardDescription>
              Points, percentage, or rubric (criteria add up). Optionally add letter grades on top.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>How scores are entered</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {scoreModes.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setValue("scoreMode", mode, { shouldValidate: true });
                      if (mode === "rubric" && rubric.length === 0) {
                        setRubric([{ id: nanoid(), label: "Criterion 1", maxPoints: 10 }]);
                      }
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-3 text-left transition-colors",
                      scoreMode === mode
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border hover:bg-muted/40"
                    )}
                  >
                    <p className="text-sm font-medium">{scoreModeLabel(mode)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {mode === "points" && "One score out of a max (e.g. 17/20)"}
                      {mode === "percentage" && "One number from 0–100%"}
                      {mode === "rubric" && "Score each criterion; values add to the total"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {scoreMode === "points" && (
              <div className="space-y-2 sm:max-w-xs">
                <Label htmlFor="maxScore">Out of (max points)</Label>
                <Input
                  id="maxScore"
                  type="number"
                  min={0}
                  step={0.5}
                  placeholder="e.g. 20"
                  {...register("maxScore")}
                />
                <p className="text-xs text-muted-foreground">
                  Used for display (17/20) and to convert letter grades to points.
                </p>
              </div>
            )}

            {scoreMode === "percentage" && (
              <p className="text-sm text-muted-foreground">
                Each student gets a score from <strong className="text-foreground">0–100%</strong>.
              </p>
            )}

            {scoreMode === "rubric" && (
              <RubricCriteriaEditor rubric={rubric} onChange={setRubric} />
            )}

            <div className="space-y-3 rounded-lg border border-border bg-muted/10 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-border"
                  checked={useLetterGrades}
                  onChange={(e) => setUseLetterGrades(e.target.checked)}
                />
                <div>
                  <span className="text-sm font-medium">Use letter grades</span>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Show A, B, C… based on the total %. Set minimum % per letter — e.g. A ≥ 90%, B ≥ 80%.
                    Works with points, percentage, or rubric totals.
                  </p>
                </div>
              </label>

              {useLetterGrades && (
                <div className="space-y-2 border-t border-border pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-muted-foreground">Letter cut-offs (minimum %)</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() =>
                        setLetterGrades((prev) => [...prev, { letter: "", minPercent: 50 }])
                      }
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add grade
                    </Button>
                  </div>
                  {sortLetterGrades(letterGrades).map((band, i) => {
                    const index = letterGrades.findIndex(
                      (b) => b.letter === band.letter && b.minPercent === band.minPercent
                    );
                    return (
                      <div key={`${band.letter}-${i}`} className="flex items-center gap-2">
                        <Input
                          value={band.letter}
                          className="h-8 w-16 text-sm"
                          placeholder="A"
                          onChange={(e) =>
                            setLetterGrades((prev) =>
                              prev.map((x, j) => (j === index ? { ...x, letter: e.target.value } : x))
                            )
                          }
                        />
                        <span className="text-sm text-muted-foreground">≥</span>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          className="h-8 w-20"
                          value={band.minPercent}
                          onChange={(e) =>
                            setLetterGrades((prev) =>
                              prev.map((x, j) =>
                                j === index ? { ...x, minPercent: Number(e.target.value) || 0 } : x
                              )
                            )
                          }
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0"
                          onClick={() => setLetterGrades((prev) => prev.filter((_, j) => j !== index))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions &amp; details</CardTitle>
            <CardDescription>Full assignment info, links, or notes for your own reference.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="instructions"
              rows={8}
              placeholder="What should students do? Include resources, rubric notes, submission steps…"
              {...register("instructions")}
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isNew ? "Create task" : "Save changes"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to={`/classes/${cls.id}?tab=tasks`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
