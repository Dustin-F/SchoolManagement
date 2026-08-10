import { Fragment, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  Lock,
  RefreshCw,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { TermFilterSelect } from "@/features/assessment/TermFilterSelect";
import { AssessmentWeightWarning } from "@/features/assessment/AssessmentWeightWarning";
import { TermGradeBreakdownPanel } from "@/features/assessment/TermGradeBreakdownPanel";
import { PostTermGradesDialog } from "@/features/assessment/PostTermGradesDialog";
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
  computeTermGradeCompletion,
  displayTermLetter,
  getTermLetterBands,
  isTermGradePosted,
  normalizeTermGrade,
  officialTermPercent,
  runningTermPercent,
} from "@/lib/termGradeUtils";
import { useAppStore } from "@/store";
import type { SchoolClass, TermGrade } from "@/types";
import { cn } from "@/lib/utils";

interface ClassTermGradesSectionProps {
  cls: SchoolClass;
  readOnly?: boolean;
}

function GradeProgressBar({ graded, total }: { graded: number; total: number }) {
  const pct = total > 0 ? Math.round((graded / total) * 100) : 0;
  return (
    <div className="flex min-w-[5.5rem] flex-col gap-1">
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground">
        {graded}/{total} graded
      </span>
    </div>
  );
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
  const schoolGradingSettings = useAppStore((s) => s.schoolGradingSettings);
  const recalculateClassTermGrades = useAppStore((s) => s.recalculateClassTermGrades);
  const postTermGrade = useAppStore((s) => s.postTermGrade);
  const unpostTermGradeForStudent = useAppStore((s) => s.unpostTermGradeForStudent);
  const updateTermGradeComment = useAppStore((s) => s.updateTermGradeComment);

  const [termId, setTermId] = useState(() => getActiveTerm(academicTerms)?.id ?? "all");
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const termLetterBands = useMemo(
    () => getTermLetterBands(schoolGradingSettings),
    [schoolGradingSettings]
  );

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
      return { student, grade: grade ? normalizeTermGrade(grade) : undefined };
    });
  }, [classStudents, termGrades, cls.id, selectedTermId]);

  const summary = useMemo(() => {
    let posted = 0;
    let incomplete = 0;
    for (const { grade } of rows) {
      if (!grade) continue;
      if (isTermGradePosted(grade)) posted += 1;
      else if (grade.calculatedPercent == null) incomplete += 1;
    }
    return { posted, incomplete, total: rows.length };
  }, [rows]);

  const getCommentDraft = (grade: TermGrade | undefined, studentId: string) => {
    const key = `${studentId}:${selectedTermId}`;
    if (commentDrafts[key] !== undefined) return commentDrafts[key];
    return grade?.comment ?? "";
  };

  const saveComment = (studentId: string, grade: TermGrade | undefined) => {
    if (!selectedTermId || readOnly) return;
    const key = `${studentId}:${selectedTermId}`;
    const comment = getCommentDraft(grade, studentId).trim();
    updateTermGradeComment(studentId, cls.id, selectedTermId, comment || undefined);
    setCommentDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              Term grades
            </CardTitle>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Running grade</span> updates as you
              enter scores. <span className="font-medium text-foreground">Post grades</span> to
              lock the official report-card mark.
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
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    recalculateClassTermGrades(cls.id, selectedTermId);
                    toast.success("Running grades refreshed.");
                  }}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Refresh
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setPostDialogOpen(true)}
                >
                  <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />
                  Post grades
                </Button>
              </>
            )}
          </div>
        </div>

        {selectedTerm && (
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">{termLabel(selectedTerm)}</Badge>
            <Badge variant="outline">{summary.posted} posted</Badge>
            <Badge variant="outline">{summary.total - summary.posted} in progress</Badge>
            {summary.incomplete > 0 && (
              <Badge variant="destructive">{summary.incomplete} incomplete</Badge>
            )}
          </div>
        )}
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
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/30">
                    <TableHead className="w-8" />
                    <TableHead>Student</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">
                      <span className="block">Running grade</span>
                      <span className="text-[10px] font-normal text-muted-foreground">live</span>
                    </TableHead>
                    <TableHead className="text-right">
                      <span className="block">Posted grade</span>
                      <span className="text-[10px] font-normal text-muted-foreground">official</span>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="min-w-[9rem]">Comment</TableHead>
                    {!readOnly && <TableHead className="w-24 text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ student, grade }) => {
                    const expanded = expandedStudentId === student.id;
                    const completion =
                      selectedTermId &&
                      computeTermGradeCompletion(
                        student.id,
                        cls,
                        selectedTermId,
                        classTasks,
                        studentTaskRecords,
                        taskAssessmentCategories
                      );
                    const breakdown =
                      expanded && selectedTermId
                        ? computeTermGradeBreakdown(
                            student.id,
                            cls,
                            selectedTermId,
                            classTasks,
                            studentTaskRecords,
                            taskAssessmentCategories,
                            schoolGradingSettings
                          )
                        : null;
                    const running = grade ? runningTermPercent(grade) : null;
                    const runningLetter = grade?.calculatedLetter;
                    const posted = grade ? officialTermPercent(grade) : null;
                    const postedLetter = grade ? displayTermLetter(grade, termLetterBands) : null;
                    const postedStatus = grade && isTermGradePosted(grade);
                    const incomplete = grade?.calculatedPercent == null && completion && completion.total > 0;
                    const commentKey = `${student.id}:${selectedTermId}`;
                    const commentDraft = getCommentDraft(grade, student.id);

                    return (
                      <Fragment key={student.id}>
                        <TableRow className={cn(postedStatus && "bg-muted/20")}>
                          <TableCell className="px-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
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
                          <TableCell>
                            {completion && completion.total > 0 ? (
                              <GradeProgressBar
                                graded={completion.graded}
                                total={completion.total}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">No summative tasks</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold tabular-nums">
                            {incomplete ? (
                              <span className="text-muted-foreground">Incomplete</span>
                            ) : running != null ? (
                              <>
                                {running}%
                                {runningLetter && (
                                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                                    ({runningLetter})
                                  </span>
                                )}
                              </>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums">
                            {postedStatus && posted != null ? (
                              <>
                                <span className="font-semibold">{posted}%</span>
                                {postedLetter && (
                                  <span className="ml-1 text-xs text-muted-foreground">
                                    ({postedLetter})
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">Not posted</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {postedStatus ? (
                              <Badge variant="secondary" className="gap-1 text-[10px]">
                                <Lock className="h-3 w-3" />
                                Posted
                              </Badge>
                            ) : incomplete ? (
                              <Badge variant="destructive" className="text-[10px]">
                                Incomplete
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                In progress
                              </Badge>
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
                                value={commentDraft}
                                placeholder="Report comment…"
                                onChange={(e) =>
                                  setCommentDrafts((prev) => ({
                                    ...prev,
                                    [commentKey]: e.target.value,
                                  }))
                                }
                                onBlur={() => saveComment(student.id, grade)}
                              />
                            )}
                          </TableCell>
                          {!readOnly && (
                            <TableCell className="text-right">
                              {postedStatus ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    unpostTermGradeForStudent(student.id, cls.id, selectedTermId!);
                                    toast.success("Grade reopened for editing.");
                                  }}
                                >
                                  <Unlock className="mr-1 h-3 w-3" />
                                  Reopen
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  disabled={running == null}
                                  onClick={() => {
                                    postTermGrade(student.id, cls.id, selectedTermId!);
                                    toast.success("Grade posted.");
                                  }}
                                >
                                  Post
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                        {expanded && breakdown && (
                          <TableRow className="bg-muted/10 hover:bg-muted/10">
                            <TableCell colSpan={readOnly ? 7 : 8} className="px-4 pb-4 pt-0">
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

      {selectedTermId && (
        <PostTermGradesDialog
          open={postDialogOpen}
          onOpenChange={setPostDialogOpen}
          cls={cls}
          termId={selectedTermId}
          students={classStudents}
          rows={rows}
        />
      )}
    </Card>
  );
}
