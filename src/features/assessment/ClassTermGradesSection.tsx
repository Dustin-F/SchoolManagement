import { Fragment, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TermFilterSelect } from "@/features/assessment/TermFilterSelect";
import { AssessmentWeightWarning } from "@/features/assessment/AssessmentWeightWarning";
import { TermGradeBreakdownPanel } from "@/features/assessment/TermGradeBreakdownPanel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStudentDisplayName } from "@/lib/displayHelpers";
import { classPageReturnTo, studentProfilePath } from "@/lib/studentNavigation";
import { getActiveTerm, termLabel } from "@/lib/assessmentUtils";
import {
  computeTermGradeBreakdown,
  effectiveTermLetter,
  effectiveTermPercent,
} from "@/lib/termGradeUtils";
import { useAppStore } from "@/store";
import type { SchoolClass, TermGrade } from "@/types";

interface ClassTermGradesSectionProps {
  cls: SchoolClass;
  readOnly?: boolean;
}

export function ClassTermGradesSection({ cls, readOnly = false }: ClassTermGradesSectionProps) {
  const location = useLocation();
  const classReturnTo = classPageReturnTo(cls.id, location.search);
  const academicTerms = useAppStore((s) => s.academicTerms);
  const termGrades = useAppStore((s) => s.termGrades);
  const students = useAppStore((s) => s.students);
  const classTasks = useAppStore((s) => s.classTasks);
  const studentTaskRecords = useAppStore((s) => s.studentTaskRecords);
  const taskAssessmentCategories = useAppStore((s) => s.taskAssessmentCategories);
  const upsertTermGrade = useAppStore((s) => s.upsertTermGrade);
  const recalculateClassTermGrades = useAppStore((s) => s.recalculateClassTermGrades);

  const [termId, setTermId] = useState(() => getActiveTerm(academicTerms)?.id ?? "all");
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { submittedPercent: string; submittedLetter: string; comment: string }>
  >({});

  const classStudents = useMemo(() => {
    const order = new Map(cls.studentIds.map((id, i) => [id, i]));
    return students
      .filter((s) => order.has(s.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }, [students, cls.studentIds]);

  const selectedTermId = termId === "all" ? getActiveTerm(academicTerms)?.id : termId;
  const selectedTerm = academicTerms.find((t) => t.id === selectedTermId);

  const rows = useMemo(() => {
    if (!selectedTermId) return [];
    return classStudents.map((student) => {
      const grade = termGrades.find(
        (g) =>
          g.studentId === student.id &&
          g.classId === cls.id &&
          g.termId === selectedTermId
      );
      return { student, grade };
    });
  }, [classStudents, termGrades, cls.id, selectedTermId]);

  const getDraft = (grade: TermGrade | undefined, studentId: string) => {
    const key = `${studentId}:${selectedTermId}`;
    if (drafts[key]) return drafts[key];
    return {
      submittedPercent:
        grade?.submittedPercent != null ? String(grade.submittedPercent) : "",
      submittedLetter: grade?.submittedLetter ?? grade?.calculatedLetter ?? "",
      comment: grade?.comment ?? "",
    };
  };

  const saveRow = (studentId: string, grade: TermGrade | undefined) => {
    if (!selectedTermId || readOnly) return;
    const d = getDraft(grade, studentId);
    const pct = d.submittedPercent.trim() === "" ? null : Number(d.submittedPercent);
    if (d.submittedPercent.trim() !== "" && (!Number.isFinite(pct) || pct! < 0 || pct! > 100)) {
      toast.error("Submitted % must be between 0 and 100.");
      return;
    }
    upsertTermGrade(studentId, cls.id, selectedTermId, {
      submittedPercent: pct,
      submittedLetter: d.submittedLetter.trim() || null,
      comment: d.comment.trim() || undefined,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            Term grades
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Weighted average from summative tasks. Missing and unscored work counts as 0%.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {academicTerms.length > 0 && (
            <TermFilterSelect
              terms={academicTerms}
              value={termId === "all" ? (selectedTermId ?? "all") : termId}
              onChange={setTermId}
              includeAll={false}
              className="h-8 w-[12rem] text-xs"
            />
          )}
          {!readOnly && selectedTermId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                recalculateClassTermGrades(cls.id, selectedTermId);
                toast.success("Calculated grades refreshed.");
              }}
            >
              Refresh calculated
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!selectedTerm ? (
          <p className="text-sm text-muted-foreground">
            No academic terms yet. Add terms in{" "}
            <Link to="/settings/assessment" className="text-primary hover:underline">
              Assessment settings
            </Link>
            .
          </p>
        ) : (
          <>
            <AssessmentWeightWarning
              categories={taskAssessmentCategories}
              subjectId={cls.subjectId}
            />
            <p className="mb-3 text-xs text-muted-foreground">{termLabel(selectedTerm)}</p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/30">
                    <TableHead className="w-8" />
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Calculated</TableHead>
                    <TableHead className="min-w-[5rem]">Submitted %</TableHead>
                    <TableHead className="min-w-[4rem]">Letter</TableHead>
                    <TableHead className="min-w-[10rem]">Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ student, grade }) => {
                    const key = `${student.id}:${selectedTermId}`;
                    const d = getDraft(grade, student.id);
                    const effective = grade ? effectiveTermPercent(grade) : null;
                    const effectiveLetter = grade ? effectiveTermLetter(grade) : null;
                    const expanded = expandedStudentId === student.id;
                    const breakdown =
                      expanded && selectedTermId
                        ? computeTermGradeBreakdown(
                            student.id,
                            cls,
                            selectedTermId,
                            classTasks,
                            studentTaskRecords,
                            taskAssessmentCategories
                          )
                        : null;

                    return (
                      <Fragment key={student.id}>
                        <TableRow>
                          <TableCell className="px-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              aria-expanded={expanded}
                              aria-label={expanded ? "Hide breakdown" : "Show breakdown"}
                              onClick={() =>
                                setExpandedStudentId(expanded ? null : student.id)
                              }
                            >
                              {expanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">
                            <Link
                              to={studentProfilePath(student.id, classReturnTo)}
                              className="text-sm hover:text-primary"
                            >
                              {getStudentDisplayName(student)}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold tabular-nums">
                            {grade?.calculatedPercent != null ? (
                              <>
                                {grade.calculatedPercent}%
                                {grade.calculatedLetter && (
                                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                                    ({grade.calculatedLetter})
                                  </span>
                                )}
                              </>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            {readOnly ? (
                              <span className="text-sm tabular-nums">
                                {grade?.submittedPercent != null
                                  ? `${grade.submittedPercent}%`
                                  : effective != null
                                    ? `${effective}%`
                                    : "—"}
                              </span>
                            ) : (
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                className="h-8 w-20 text-center text-xs tabular-nums"
                                value={d.submittedPercent}
                                placeholder={
                                  grade?.calculatedPercent != null
                                    ? String(grade.calculatedPercent)
                                    : "—"
                                }
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [key]: { ...d, submittedPercent: e.target.value },
                                  }))
                                }
                                onBlur={() => saveRow(student.id, grade)}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {readOnly ? (
                              <span className="text-sm">{effectiveLetter ?? "—"}</span>
                            ) : (
                              <Input
                                className="h-8 w-14 text-center text-xs"
                                value={d.submittedLetter}
                                placeholder={grade?.calculatedLetter ?? "—"}
                                maxLength={3}
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [key]: { ...d, submittedLetter: e.target.value },
                                  }))
                                }
                                onBlur={() => saveRow(student.id, grade)}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {readOnly ? (
                              <span className="text-xs text-muted-foreground line-clamp-2">
                                {grade?.comment ?? "—"}
                              </span>
                            ) : (
                              <Textarea
                                rows={1}
                                className="min-h-8 resize-none text-xs"
                                value={d.comment}
                                placeholder="Report comment…"
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [key]: { ...d, comment: e.target.value },
                                  }))
                                }
                                onBlur={() => saveRow(student.id, grade)}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                        {expanded && breakdown && (
                          <TableRow className="bg-muted/10 hover:bg-muted/10">
                            <TableCell colSpan={6} className="px-4 pb-4 pt-0">
                              <TermGradeBreakdownPanel
                                breakdown={breakdown}
                                classId={cls.id}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
