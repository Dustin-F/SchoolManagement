import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { TermFilterSelect } from "@/features/assessment/TermFilterSelect";
import { UnitFormDialog } from "@/features/classes/UnitFormDialog";
import { unitsForClass } from "@/data/seedUnits";
import { termLabel } from "@/lib/assessmentUtils";
import { formatDate } from "@/lib/utils";
import { useAppStore } from "@/store";
import type { ClassUnit, ClassUnitStatus } from "@/types";
import type { ClassUnitFormData } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const statusStyle: Record<ClassUnitStatus, string> = {
  planned: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/15 text-primary",
  completed: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
};

interface ClassUnitsSectionProps {
  classId: string;
  readOnly?: boolean;
}

export function ClassUnitsSection({ classId, readOnly = false }: ClassUnitsSectionProps) {
  const classUnits = useAppStore((s) => s.classUnits);
  const classTasks = useAppStore((s) => s.classTasks);
  const academicTerms = useAppStore((s) => s.academicTerms);
  const addClassUnit = useAppStore((s) => s.addClassUnit);
  const updateClassUnit = useAppStore((s) => s.updateClassUnit);
  const deleteClassUnit = useAppStore((s) => s.deleteClassUnit);

  const [termFilter, setTermFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ClassUnit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassUnit | null>(null);

  const allUnits = useMemo(
    () => unitsForClass(classUnits, classId),
    [classUnits, classId]
  );

  const filteredUnits = useMemo(() => {
    if (termFilter === "all") return allUnits;
    return allUnits.filter((u) => u.termId === termFilter);
  }, [allUnits, termFilter]);

  const taskCountByUnit = useMemo(() => {
    const map = new Map<string, number>();
    for (const task of classTasks) {
      if (task.classId !== classId || !task.unitId || task.archived) continue;
      map.set(task.unitId, (map.get(task.unitId) ?? 0) + 1);
    }
    return map;
  }, [classTasks, classId]);

  const nextSortOrder = (allUnits[allUnits.length - 1]?.sortOrder ?? 0) + 1;

  const handleSave = (data: ClassUnitFormData) => {
    if (editingUnit) {
      updateClassUnit(editingUnit.id, data);
      toast.success("Unit updated.");
    } else {
      addClassUnit({ ...data, classId });
      toast.success("Unit created.");
    }
    setFormOpen(false);
    setEditingUnit(null);
  };

  const openCreate = () => {
    setEditingUnit(null);
    setFormOpen(true);
  };

  const openEdit = (unit: ClassUnit) => {
    setEditingUnit(unit);
    setFormOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            Units
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            IB-style unit planner — link tasks to units when creating assignments.
          </p>
        </div>
        {!readOnly && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New unit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {academicTerms.length > 0 && (
          <TermFilterSelect
            terms={academicTerms}
            value={termFilter}
            onChange={setTermFilter}
            className="h-8 w-[12rem] text-xs"
          />
        )}

        {filteredUnits.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No units yet. Create one to plan inquiry, dates, and curriculum alignment.
          </p>
        ) : (
          <div className="space-y-2">
            {filteredUnits.map((unit) => {
              const expanded = expandedId === unit.id;
              const taskCount = taskCountByUnit.get(unit.id) ?? 0;
              const term = academicTerms.find((t) => t.id === unit.termId);

              return (
                <div
                  key={unit.id}
                  className="rounded-lg border border-border bg-muted/10"
                >
                  <div className="flex items-start gap-2 px-3 py-2.5">
                    <button
                      type="button"
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setExpandedId(expanded ? null : unit.id)}
                      aria-expanded={expanded}
                    >
                      {expanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className="text-left font-medium hover:text-primary"
                          onClick={() => setExpandedId(expanded ? null : unit.id)}
                        >
                          {unit.title}
                        </button>
                        {unit.status && (
                          <Badge
                            variant="secondary"
                            className={cn("text-xs capitalize", statusStyle[unit.status])}
                          >
                            {unit.status.replace("_", " ")}
                          </Badge>
                        )}
                        {taskCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {taskCount} task{taskCount !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(unit.startDate)}
                          {unit.endDate ? ` – ${formatDate(unit.endDate)}` : ""}
                        </span>
                        {unit.durationWeeks != null && <span>· {unit.durationWeeks} wks</span>}
                        {term && <span>· {termLabel(term)}</span>}
                      </p>
                      {unit.inquiry && !expanded && (
                        <p className="mt-1 line-clamp-1 text-xs italic text-muted-foreground">
                          {unit.inquiry}
                        </p>
                      )}
                    </div>
                    {!readOnly && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(unit)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(unit)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {expanded && (
                    <div className="space-y-3 border-t border-border/80 px-3 py-3 text-sm">
                      {unit.inquiry && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Inquiry
                          </p>
                          <p className="mt-1 italic">{unit.inquiry}</p>
                        </div>
                      )}
                      {unit.description && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Overview
                          </p>
                          <p className="mt-1 whitespace-pre-wrap">{unit.description}</p>
                        </div>
                      )}
                      {unit.curriculumNotes && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Curriculum
                          </p>
                          <p className="mt-1 whitespace-pre-wrap">{unit.curriculumNotes}</p>
                        </div>
                      )}
                      {taskCount > 0 && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Linked tasks
                          </p>
                          <ul className="mt-1 space-y-1">
                            {classTasks
                              .filter((t) => t.unitId === unit.id && !t.archived)
                              .map((t) => (
                                <li key={t.id}>
                                  <Link
                                    to={`/classes/${classId}/tasks/${t.id}`}
                                    className="text-primary hover:underline"
                                  >
                                    {t.title}
                                  </Link>
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <UnitFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditingUnit(null);
        }}
        classId={classId}
        academicTerms={academicTerms}
        editingUnit={editingUnit}
        defaultSortOrder={nextSortOrder}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete unit</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{deleteTarget?.title}&quot;? Tasks linked to this unit will be unlinked, not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  deleteClassUnit(deleteTarget.id);
                  toast.success("Unit deleted.");
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
