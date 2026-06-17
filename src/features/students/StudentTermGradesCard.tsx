import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { computeSchoolYearPercent, effectiveTermPercent } from "@/lib/termGradeUtils";
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

  const [termId, setTermId] = useState(() => getActiveTerm(academicTerms)?.id ?? "all");

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
      const grade = termGrades.find(
        (g) => g.studentId === studentId && g.classId === cls.id && g.termId === selectedTermId
      );
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
            Weighted summative averages per class. Official marks may differ from calculated.
          </p>
        </div>
        <TermFilterSelect
          terms={academicTerms}
          value={termId === "all" ? (selectedTermId ?? "all") : termId}
          onChange={setTermId}
          includeAll={false}
        />
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
                    <TableHead className="text-right">Calculated</TableHead>
                    <TableHead className="text-right">Submitted</TableHead>
                    <TableHead className="text-right">Year avg</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ cls, grade, yearAvg }) => {
                    const effective = grade ? effectiveTermPercent(grade) : null;
                    return (
                      <TableRow key={cls.id}>
                        <TableCell>
                          <Link
                            to={`/classes/${cls.id}?tab=grades`}
                            className="text-sm font-medium hover:text-primary"
                          >
                            {cls.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {grade?.calculatedPercent != null ? `${grade.calculatedPercent}%` : "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold tabular-nums">
                          {grade?.submittedPercent != null ? (
                            `${grade.submittedPercent}%`
                          ) : effective != null ? (
                            <span className="text-muted-foreground">{effective}%</span>
                          ) : (
                            "—"
                          )}
                          {grade?.submittedLetter && (
                            <Badge variant="outline" className="ml-1.5 text-[10px] font-normal">
                              {grade.submittedLetter}
                            </Badge>
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
