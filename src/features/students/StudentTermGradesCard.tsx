import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Lock, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TermFilterSelect } from "@/features/assessment/TermFilterSelect";
import { AssessmentWeightWarning } from "@/features/assessment/AssessmentWeightWarning";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getActiveTerm, termLabel } from "@/lib/assessmentUtils";
import {
  computeSchoolYearPercent,
  displayTermLetter,
  displayTermPercent,
  getTermLetterBands,
  isTermGradePosted,
  normalizeTermGrade,
  runningTermPercent,
} from "@/lib/termGradeUtils";
import { useAppStore } from "@/store";
import type { SchoolClass } from "@/types";

interface StudentTermGradesCardProps {
  studentId: string;
  enrolledClasses: SchoolClass[];
}

export function StudentTermGradesCard({ studentId, enrolledClasses }: StudentTermGradesCardProps) {
  const academicTerms = useAppStore((s) => s.academicTerms);
  const termGrades = useAppStore((s) => s.termGrades);
  const taskAssessmentCategories = useAppStore((s) => s.taskAssessmentCategories);
  const schoolGradingSettings = useAppStore((s) => s.schoolGradingSettings);

  const [termId, setTermId] = useState(() => getActiveTerm(academicTerms)?.id ?? "all");
  const termLetterBands = useMemo(
    () => getTermLetterBands(schoolGradingSettings),
    [schoolGradingSettings]
  );

  const activeTerm = getActiveTerm(academicTerms);
  const selectedTermId = termId === "all" ? activeTerm?.id : termId;
  const selectedTerm = academicTerms.find((t) => t.id === selectedTermId);

  const schoolYear = selectedTerm?.schoolYear ?? activeTerm?.schoolYear ?? "";
  const termsInYear = useMemo(
    () => academicTerms.filter((t) => t.schoolYear === schoolYear),
    [academicTerms, schoolYear]
  );

  const rows = useMemo(() => {
    if (!selectedTermId) return [];
    return enrolledClasses.map((cls) => {
      const raw = termGrades.find(
        (g) => g.studentId === studentId && g.classId === cls.id && g.termId === selectedTermId
      );
      const grade = raw ? normalizeTermGrade(raw) : undefined;
      const yearAvg = computeSchoolYearPercent(termGrades, termsInYear, studentId, cls.id);
      return { cls, grade, yearAvg };
    });
  }, [enrolledClasses, termGrades, selectedTermId, studentId, termsInYear]);

  if (academicTerms.length === 0 || enrolledClasses.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            Term grades
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Running grades update with new scores. Posted grades are the official report-card mark.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <TermFilterSelect
            terms={academicTerms}
            value={termId === "all" ? (selectedTermId ?? "all") : termId}
            onChange={setTermId}
            includeAll={false}
          />
          {selectedTermId && (
            <Button size="sm" variant="outline" asChild>
              <Link to={`/students/${studentId}/report-card?termId=${selectedTermId}`}>
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Report card
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!selectedTerm ? (
          <p className="text-sm text-muted-foreground">No academic terms configured.</p>
        ) : (
          <>
            {[...new Set(enrolledClasses.map((c) => c.subjectId))].map((subjectId) => (
              <AssessmentWeightWarning
                key={subjectId}
                categories={taskAssessmentCategories}
                subjectId={subjectId}
              />
            ))}
            <p className="mb-3 text-xs text-muted-foreground">{termLabel(selectedTerm)}</p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/30">
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Running</TableHead>
                    <TableHead className="text-right">Posted</TableHead>
                    <TableHead className="text-right">Year avg</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ cls, grade, yearAvg }) => {
                    const running = grade ? runningTermPercent(grade) : null;
                    const posted = grade && isTermGradePosted(grade);
                    const displayPct = grade ? displayTermPercent(grade) : null;
                    const letter = grade ? displayTermLetter(grade, termLetterBands) : null;

                    return (
                      <TableRow key={cls.id}>
                        <TableCell>
                          <Link
                            to={`/classes/${cls.id}?tab=term-grades`}
                            className="text-sm font-medium hover:text-primary"
                          >
                            {cls.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {running != null ? (
                            <>
                              {running}%
                              {grade?.calculatedLetter && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  ({grade.calculatedLetter})
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">Incomplete</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold tabular-nums">
                          {posted && displayPct != null ? (
                            <span className="inline-flex items-center justify-end gap-1">
                              {displayPct}%
                              {letter && (
                                <Badge variant="outline" className="text-[10px] font-normal">
                                  {letter}
                                </Badge>
                              )}
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            </span>
                          ) : (
                            <span className="text-xs font-normal text-muted-foreground">
                              Not posted
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                          {yearAvg != null ? `${yearAvg}%` : "—"}
                        </TableCell>
                      </TableRow>
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
