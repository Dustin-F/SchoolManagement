import { forwardRef } from "react";
import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { termLabel } from "@/lib/assessmentUtils";
import { getExtraNameLine, getPersonNameLines, getStudentDisplayName, getTeacherDisplayName } from "@/lib/displayHelpers";
import {
  type AttendanceSummary,
  type BehaviourSummary,
  behaviourReportSummary,
  REPORT_SCHOOL_NAME,
  REPORT_SCHOOL_TAGLINE,
} from "@/lib/reportCardUtils";
import {
  computeTermGradeBreakdown,
  displayTermLetter,
  displayTermPercent,
  isTermGradePosted,
  normalizeTermGrade,
  runningTermPercent,
  type TermGradeBreakdown,
} from "@/lib/termGradeUtils";
import type {
  AcademicTerm,
  ClassTask,
  LetterGradeBand,
  SchoolClass,
  Student,
  StudentTaskRecord,
  Subject,
  TaskAssessmentCategory,
  Teacher,
  TermGrade,
} from "@/types";
import { cn, formatDate } from "@/lib/utils";

interface ClassGradeRow {
  cls: SchoolClass;
  subject?: Subject;
  teacher?: Teacher;
  grade: TermGrade | null;
  breakdown: TermGradeBreakdown;
}

interface ReportCardDocumentProps {
  student: Student;
  term: AcademicTerm;
  enrolledClasses: SchoolClass[];
  classRows: ClassGradeRow[];
  attendance: AttendanceSummary;
  behaviour: BehaviourSummary;
  behaviourEmptyHint?: string;
  termLetterBands: LetterGradeBand[];
  issuedDate?: string;
  /** Screen-only controls (term picker, etc.) */
  toolbar?: ReactNode;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="report-card-section-title border-b border-border pb-1 text-sm font-semibold uppercase tracking-wide text-foreground">
      {children}
    </h3>
  );
}

function StatBox({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function formatTaskPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function ClassGradeBlock({
  row,
  termLetterBands,
}: {
  row: ClassGradeRow;
  termLetterBands: LetterGradeBand[];
}) {
  const { cls, subject, teacher, grade, breakdown } = row;
  const normalized = grade ? normalizeTermGrade(grade) : null;
  const posted = normalized ? isTermGradePosted(normalized) : false;
  const running = normalized ? runningTermPercent(normalized) : null;

  return (
    <div className="report-card-class-block rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold">{cls.name}</p>
          <p className="text-xs text-muted-foreground">
            {subject?.name && <span>{subject.name}</span>}
            {subject && teacher && <span aria-hidden> · </span>}
            {teacher && <span>Teacher: {getTeacherDisplayName(teacher)}</span>}
          </p>
        </div>
        <div className="text-right">
          {posted && normalized ? (
            <div className="inline-flex flex-col items-end gap-0.5">
              <span className="text-xs font-medium uppercase text-muted-foreground">Official grade</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tabular-nums">
                  {displayTermPercent(normalized)}
                  {displayTermPercent(normalized) != null ? "%" : ""}
                </span>
                <Badge variant="secondary">{displayTermLetter(normalized, termLetterBands)}</Badge>
                <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Grade not yet posted</div>
          )}
          {running != null && (
            <p className="report-card-running mt-1 text-xs text-muted-foreground">
              Running: {running}%
              {normalized?.calculatedLetter ? ` (${normalized.calculatedLetter})` : ""}
            </p>
          )}
        </div>
      </div>

      {normalized?.comment && (
        <div className="mt-3 rounded-md bg-muted/30 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Teacher comment
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{normalized.comment}</p>
        </div>
      )}

      {breakdown.categories.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Assessment breakdown · {breakdown.gradedTaskCount}/{breakdown.summativeTaskCount} summative
            tasks graded
            {breakdown.isIncomplete && (
              <span className="text-amber-600 dark:text-amber-400"> · Incomplete</span>
            )}
          </p>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/40">
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Task</TableHead>
                  <TableHead className="text-xs text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakdown.categories.flatMap((cat) =>
                  cat.tasks.length > 0
                    ? cat.tasks.map((t, taskIndex) => (
                        <TableRow key={t.taskId}>
                          <TableCell className="text-xs font-medium">
                            {taskIndex === 0 ? cat.categoryName : ""}
                          </TableCell>
                          <TableCell className="max-w-[14rem] text-xs break-words sm:max-w-none">
                            {t.title}
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            {t.percent != null ? `${formatTaskPercent(t.percent)}%` : "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    : [
                        <TableRow key={cat.categoryId}>
                          <TableCell className="text-xs font-medium">{cat.categoryName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">—</TableCell>
                          <TableCell className="text-right text-xs tabular-nums">—</TableCell>
                        </TableRow>,
                      ]
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

export const ReportCardDocument = forwardRef<HTMLElement, ReportCardDocumentProps>(
  function ReportCardDocument(
    {
      student,
      term,
      enrolledClasses,
      classRows,
      attendance,
      behaviour,
      behaviourEmptyHint,
      termLetterBands,
      issuedDate,
      toolbar,
    },
    ref
  ) {
  const issued = issuedDate ?? new Date().toISOString().slice(0, 10);
  const nameLines = getPersonNameLines(student);

  return (
    <article
      ref={ref}
      id="report-card-document"
      className="report-card-document rounded-xl border-2 border-border bg-card shadow-sm"
    >
      <header className="report-card-header report-card-pdf-block border-b border-border px-6 py-6 text-center sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {REPORT_SCHOOL_NAME}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">{REPORT_SCHOOL_TAGLINE}</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Report card</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {termLabel(term)} · {term.schoolYear}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Issued {formatDate(issued)}</p>
      </header>

      <div className="space-y-8 px-6 py-6 sm:px-8">
        {toolbar && <div className="no-print">{toolbar}</div>}

        <section className="report-card-pdf-block space-y-3">
          <SectionTitle>Student information</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
            {student.photoUrl && (
              <img
                src={student.photoUrl}
                alt=""
                className="h-20 w-20 rounded-lg object-cover ring-1 ring-border"
              />
            )}
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Student</dt>
                <dd className="font-semibold">{getStudentDisplayName(student)}</dd>
                {getExtraNameLine(student) && (
                  <dd className="text-xs text-muted-foreground">{getExtraNameLine(student)}</dd>
                )}
              </div>
              {nameLines.length > 1 && (
                <div>
                  <dt className="text-xs text-muted-foreground">Also known as</dt>
                  <dd>{nameLines.slice(1).join(" · ")}</dd>
                </div>
              )}
              {student.dateOfBirth && (
                <div>
                  <dt className="text-xs text-muted-foreground">Date of birth</dt>
                  <dd>{formatDate(student.dateOfBirth)}</dd>
                </div>
              )}
              {student.email && (
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd>{student.email}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-muted-foreground">Parent / guardian</dt>
                <dd>{student.parentName || "—"}</dd>
                {student.parentPhone && (
                  <dd className="text-xs text-muted-foreground">{student.parentPhone}</dd>
                )}
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Classes this term</dt>
                <dd>{enrolledClasses.map((c) => c.name).join(", ") || "—"}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="report-card-pdf-block space-y-3">
          <SectionTitle>Attendance · {termLabel(term)}</SectionTitle>
          {attendance.total === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance recorded for this term.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <StatBox label="Rate" value={`${attendance.ratePercent}%`} hint="Present + late" />
                <StatBox label="Present" value={String(attendance.present)} />
                <StatBox label="Late" value={String(attendance.late)} />
                <StatBox label="Absent" value={String(attendance.absent)} />
                <StatBox label="Excused" value={String(attendance.excused)} />
              </div>
              {attendance.byClass.length > 0 && (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-muted/40">
                        <TableHead className="text-xs">Class</TableHead>
                        <TableHead className="text-xs text-right">Rate</TableHead>
                        <TableHead className="text-xs text-right">Present</TableHead>
                        <TableHead className="text-xs text-right">Late</TableHead>
                        <TableHead className="text-xs text-right">Absent</TableHead>
                        <TableHead className="text-xs text-right">Excused</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.byClass.map((row) => (
                        <TableRow key={row.classId}>
                          <TableCell className="text-xs font-medium">{row.className}</TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            {row.ratePercent}%
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            {row.counts.present}
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            {row.counts.late}
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            {row.counts.absent}
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            {row.counts.excused}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </section>

        {classRows.length === 0 ? (
          <section className="report-card-pdf-block space-y-3">
            <SectionTitle>Academic achievement</SectionTitle>
            <p className="text-sm text-muted-foreground">Not enrolled in any classes.</p>
          </section>
        ) : (
          <div className="space-y-4">
            {classRows.map((row, index) => (
              <div key={row.cls.id} className="report-card-pdf-block space-y-3">
                {index === 0 && <SectionTitle>Academic achievement</SectionTitle>}
                <ClassGradeBlock row={row} termLetterBands={termLetterBands} />
              </div>
            ))}
          </div>
        )}

        <section className="report-card-pdf-block space-y-3">
          <SectionTitle>Behaviour</SectionTitle>
          {behaviour.eventCount === 0 ? (
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>No behaviour points recorded this term.</p>
              {behaviourEmptyHint && (
                <p className="report-card-screen-only">{behaviourEmptyHint}</p>
              )}
              <p className="report-card-screen-only text-xs">
                Points are awarded during class from the roster or Points page and appear here when
                the event date falls inside the selected term.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <StatBox
                  label="Net points"
                  value={
                    behaviour.totalPoints > 0
                      ? `+${behaviour.totalPoints}`
                      : String(behaviour.totalPoints)
                  }
                />
                <StatBox label="Positive" value={`+${behaviour.positivePoints}`} />
                <StatBox label="Negative" value={String(behaviour.negativePoints)} />
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                {behaviourReportSummary(behaviour)}
              </p>

              {behaviour.byClass.length > 0 && (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-muted/40">
                        <TableHead className="text-xs">Class</TableHead>
                        <TableHead className="text-xs text-right">Recognitions</TableHead>
                        <TableHead className="text-xs text-right">Positive</TableHead>
                        <TableHead className="text-xs text-right">Negative</TableHead>
                        <TableHead className="text-xs text-right">Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {behaviour.byClass.map((row) => (
                        <TableRow key={row.classId}>
                          <TableCell className="text-xs font-medium">{row.className}</TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            {row.eventCount}
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums text-emerald-700 dark:text-emerald-400">
                            +{row.positivePoints}
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums text-amber-700 dark:text-amber-400">
                            {row.negativePoints}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right text-xs font-semibold tabular-nums",
                              row.totalPoints > 0 && "text-emerald-700 dark:text-emerald-400",
                              row.totalPoints < 0 && "text-amber-700 dark:text-amber-400"
                            )}
                          >
                            {row.totalPoints > 0 ? `+${row.totalPoints}` : row.totalPoints}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </section>

        <div className="report-card-pdf-block space-y-6 border-t border-border pt-6">
          <section className="report-card-signatures grid gap-8 sm:grid-cols-3">
          {["Homeroom / class teacher", "Head of school", "Parent / guardian"].map((label) => (
            <div key={label}>
              <div className="h-10 border-b border-border" />
              <p className="mt-2 text-xs text-muted-foreground">{label}</p>
              <p className="text-[10px] text-muted-foreground">Signature · Date</p>
            </div>
          ))}
          </section>

          <footer className="border-t border-border pt-4 text-center text-[10px] leading-relaxed text-muted-foreground">
            Official grades are those marked as posted on the term grade report. Running grades and
            incomplete marks may change until teachers finalize and post. Attendance rate counts present
            and late sessions as attended.
          </footer>
        </div>
      </div>
    </article>
  );
});
export function buildReportClassRows(
  studentId: string,
  termId: string,
  enrolledClasses: SchoolClass[],
  termGrades: TermGrade[],
  classTasks: ClassTask[],
  studentTaskRecords: StudentTaskRecord[],
  taskAssessmentCategories: TaskAssessmentCategory[],
  schoolGradingSettings: Parameters<typeof computeTermGradeBreakdown>[6],
  subjects: Subject[],
  teachers: Teacher[]
): ClassGradeRow[] {
  return enrolledClasses.map((cls) => {
    const raw = termGrades.find(
      (g) => g.studentId === studentId && g.classId === cls.id && g.termId === termId
    );
    const grade = raw ? normalizeTermGrade(raw) : null;
    const breakdown = computeTermGradeBreakdown(
      studentId,
      cls,
      termId,
      classTasks,
      studentTaskRecords,
      taskAssessmentCategories,
      schoolGradingSettings
    );
    return {
      cls,
      subject: subjects.find((s) => s.id === cls.subjectId),
      teacher: teachers.find((t) => t.id === cls.teacherId),
      grade,
      breakdown,
    };
  });
}
