import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TermFilterSelect } from "@/features/assessment/TermFilterSelect";
import {
  ReportCardDocument,
  buildReportClassRows,
} from "@/features/students/ReportCardDocument";
import { getActiveTerm, termLabel } from "@/lib/assessmentUtils";
import { getStudentDisplayName } from "@/lib/displayHelpers";
import {
  exportReportCardPdf,
  reportCardPdfFilename,
} from "@/lib/exportReportCardPdf";
import {
  buildTermAttendanceSummary,
  buildTermBehaviourSummary,
  countStudentPointsOutsideTerm,
} from "@/lib/reportCardUtils";
import { getTermLetterBands } from "@/lib/termGradeUtils";
import { useAppStore } from "@/store";

export function ReportCardPage() {
  const { id: studentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const reportRef = useRef<HTMLElement>(null);
  const [exporting, setExporting] = useState(false);

  const students = useAppStore((s) => s.students);
  const classes = useAppStore((s) => s.classes);
  const teachers = useAppStore((s) => s.teachers);
  const subjects = useAppStore((s) => s.subjects);
  const academicTerms = useAppStore((s) => s.academicTerms);
  const termGrades = useAppStore((s) => s.termGrades);
  const classTasks = useAppStore((s) => s.classTasks);
  const studentTaskRecords = useAppStore((s) => s.studentTaskRecords);
  const taskAssessmentCategories = useAppStore((s) => s.taskAssessmentCategories);
  const schoolGradingSettings = useAppStore((s) => s.schoolGradingSettings);
  const attendance = useAppStore((s) => s.attendance);
  const pointEvents = useAppStore((s) => s.pointEvents);
  const behaviourSkills = useAppStore((s) => s.behaviourSkills);

  const student = students.find((s) => s.id === studentId);
  const activeTerm = getActiveTerm(academicTerms);
  const termParam = searchParams.get("termId");
  const selectedTermId = termParam ?? activeTerm?.id ?? academicTerms[0]?.id ?? "";
  const selectedTerm = academicTerms.find((t) => t.id === selectedTermId);

  const termLetterBands = useMemo(
    () => getTermLetterBands(schoolGradingSettings),
    [schoolGradingSettings]
  );

  const enrolledClasses = useMemo(() => {
    if (!student) return [];
    return classes.filter((c) => c.studentIds.includes(student.id));
  }, [student, classes]);

  const classRows = useMemo(() => {
    if (!student || !selectedTermId) return [];
    return buildReportClassRows(
      student.id,
      selectedTermId,
      enrolledClasses,
      termGrades,
      classTasks,
      studentTaskRecords,
      taskAssessmentCategories,
      schoolGradingSettings,
      subjects,
      teachers
    );
  }, [
    student,
    selectedTermId,
    enrolledClasses,
    termGrades,
    classTasks,
    studentTaskRecords,
    taskAssessmentCategories,
    schoolGradingSettings,
    subjects,
    teachers,
  ]);

  const attendanceSummary = useMemo(() => {
    if (!student || !selectedTerm) {
      return {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: 0,
        ratePercent: 0,
        byClass: [],
      };
    }
    return buildTermAttendanceSummary(student.id, selectedTerm, attendance, classes);
  }, [student, selectedTerm, attendance, classes]);

  const behaviourSummary = useMemo(() => {
    if (!student || !selectedTerm) {
      return {
        totalPoints: 0,
        positivePoints: 0,
        negativePoints: 0,
        eventCount: 0,
        bySkill: [],
        byClass: [],
        events: [],
      };
    }
    return buildTermBehaviourSummary(
      student.id,
      selectedTerm,
      pointEvents,
      behaviourSkills,
      classes
    );
  }, [student, selectedTerm, pointEvents, behaviourSkills, classes]);

  const behaviourEmptyHint = useMemo(() => {
    if (!student || !selectedTerm) return undefined;
    const outside = countStudentPointsOutsideTerm(student.id, selectedTerm, pointEvents);
    if (behaviourSummary.eventCount > 0 || outside === 0) return undefined;
    const otherTerm = academicTerms.find((t) => {
      if (t.id === selectedTerm.id) return false;
      return pointEvents.some(
        (e) => e.studentId === student.id && e.date >= t.startDate && e.date <= t.endDate
      );
    });
    if (otherTerm) {
      return `This student has ${outside} point event${outside !== 1 ? "s" : ""} in ${termLabel(otherTerm)} — switch the term above to view them.`;
    }
    return "Award points during a class session to see them on future report cards.";
  }, [student, selectedTerm, pointEvents, behaviourSummary.eventCount, academicTerms]);

  const handleExportPdf = async () => {
    if (!student || !selectedTerm || !reportRef.current) return;
    setExporting(true);
    try {
      const filename = reportCardPdfFilename(
        getStudentDisplayName(student),
        termLabel(selectedTerm)
      );
      await exportReportCardPdf(reportRef.current, filename);
      toast.success("Report card PDF downloaded.");
    } catch (err) {
      console.error("Report card PDF export failed:", err);
      toast.error("Could not export PDF. Try again.");
    } finally {
      setExporting(false);
    }
  };

  if (!student) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-muted-foreground">Student not found.</p>
        <Button variant="link" onClick={() => navigate("/students")}>
          Back to students
        </Button>
      </div>
    );
  }

  if (!selectedTerm) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-muted-foreground">No academic term selected.</p>
        <Button variant="link" asChild>
          <Link to={`/students/${student.id}`}>Back to profile</Link>
        </Button>
      </div>
    );
  }

  const setTerm = (termId: string) => {
    setSearchParams({ termId }, { replace: true });
  };

  return (
    <div className="report-card-page mx-auto max-w-4xl space-y-6 pb-10">
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link to={`/students/${student.id}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to profile
          </Link>
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground sm:max-w-[14rem] sm:text-right">
            Export a clean PDF for parents — open it and print from your PDF viewer.
          </p>
          <Button
            type="button"
            size="sm"
            disabled={exporting}
            onClick={() => void handleExportPdf()}
          >
            {exporting ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-4 w-4" />
            )}
            {exporting ? "Exporting…" : "Export PDF"}
          </Button>
        </div>
      </div>

      <ReportCardDocument
        ref={reportRef}
        student={student}
        term={selectedTerm}
        enrolledClasses={enrolledClasses}
        classRows={classRows}
        attendance={attendanceSummary}
        behaviour={behaviourSummary}
        behaviourEmptyHint={behaviourEmptyHint}
        termLetterBands={termLetterBands}
        toolbar={
          academicTerms.length > 0 ? (
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
              <span className="text-sm text-muted-foreground">Reporting period</span>
              <TermFilterSelect
                terms={academicTerms}
                value={selectedTermId}
                onChange={setTerm}
                includeAll={false}
                className="h-9 w-56"
              />
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
