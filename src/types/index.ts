export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface Teacher extends BaseEntity {
  firstName: string;
  lastName: string;
  name2First?: string;
  name2Last?: string;
  name3First?: string;
  name3Last?: string;
  email?: string;
  phone?: string;
  subjects?: string[];
}

export interface Student extends BaseEntity {
  firstName: string;
  lastName: string;
  name2First?: string;
  name2Last?: string;
  name3First?: string;
  name3Last?: string;
  email?: string;
  dateOfBirth?: string;
  parentName?: string;
  parentPhone?: string;
  notes?: string;
  /** Optional photo URL (hosted image). */
  photoUrl?: string;
  /** When true, hidden from rosters and pickers; history is kept. */
  archived?: boolean;
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

/** @deprecated Migrated to ClassScheduleEvent — kept for one-time data migration. */
export interface ScheduleEntry {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export type RecurrenceFrequency = "none" | "daily" | "weekly" | "monthly";

export type RecurrenceEndType = "never" | "on_date" | "after_count";

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  /** Repeat every N days/weeks/months. */
  interval: number;
  /** For weekly recurrence — which weekdays. */
  daysOfWeek?: DayOfWeek[];
  endType: RecurrenceEndType;
  endDate?: string;
  occurrenceCount?: number;
}

/** Outlook-style scheduled class session (one-off or recurring series). */
export interface ClassScheduleEvent extends BaseEntity {
  classId: string;
  title?: string;
  /** First occurrence date (YYYY-MM-DD). */
  startDate: string;
  startTime: string;
  endTime: string;
  recurrence: RecurrenceRule;
  /** Entire series cancelled. */
  cancelled?: boolean;
  cancelledAt?: string;
}

export type SessionExceptionType = "cancelled" | "rescheduled" | "modified";
export interface ClassSessionException extends BaseEntity {
  classId: string;
  eventId: string;
  /** Original date in the series before override. */
  originalDate: string;
  type: SessionExceptionType;
  newDate?: string;
  newStartTime?: string;
  newEndTime?: string;
  reason?: string;
}

export type ScheduleEditScope = "occurrence" | "future" | "series";

export interface RubricCriterion {
  id: string;
  label: string;
  maxPoints?: number;
}

export interface SchoolClass extends BaseEntity {
  name: string;
  classroomNumber?: string;
  subjectId: string;
  teacherId: string;
  coTeacherIds: string[];
  studentIds: string[];
  /** @deprecated Migrated to classScheduleEvents — may exist in old stored data. */
  schedule?: ScheduleEntry[];
  /** School-wide skills pinned to this class toolbar (skill ids). */
  pinnedSkillIds?: string[];
  /** Seating grid columns (2–12). */
  seatColumns?: number;
  /** Fixed row count; omit for auto rows from student count. */
  seatRows?: number;
  /** Row-major seat layout (`null` = empty desk). Length = seatColumns × seatRows. */
  seatGrid?: (string | null)[];
  /** When true, hidden from dashboard and class lists; history is kept. */
  archived?: boolean;
}

export interface Subject extends BaseEntity {
  name: string;
  code?: string;
  description?: string;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export type AttendanceReasonCode =
  | "illness"
  | "appointment"
  | "family"
  | "transport"
  | "other";

export interface AttendanceRecord extends BaseEntity {
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  reasonCode?: AttendanceReasonCode;
}

export type SkillType = "positive" | "negative";

/** School-wide merit / reminder skill (ClassDojo-style). */
export interface BehaviourSkill extends BaseEntity {
  name: string;
  emoji?: string;
  points: number;
  type: SkillType;
  active: boolean;
  sortOrder: number;
  /** Parent-facing explanation when sharing reports. */
  parentDescription?: string;
}

/** A single point award during class. */
export interface PointEvent {
  id: string;
  studentId: string;
  skillId: string;
  classId: string;
  date: string;
  points: number;
  note?: string;
  createdAt: string;
}

export type ClassTaskType =
  | "exam"
  | "presentation"
  | "homework"
  | "quiz"
  | "project"
  | "essay"
  | "worksheet"
  | "other";

export type TaskScoreMode = "points" | "percentage" | "rubric";

export interface LetterGradeBand {
  letter: string;
  /** Minimum percentage (0–100) required for this letter grade. */
  minPercent: number;
}

export type TaskAssessmentRole = "formative" | "summative";

/** School calendar term (semester, quarter, etc.). */
export interface AcademicTerm extends BaseEntity {
  name: string;
  schoolYear: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  sortOrder: number;
}

/** Weighted bucket for summative tasks (e.g. Homework 15%, Exams 40%). */
export interface TaskAssessmentCategory extends BaseEntity {
  name: string;
  weightPercent: number;
  /** When set, only applies to classes in this subject. */
  subjectId?: string;
  sortOrder: number;
}

export interface ClassTask extends BaseEntity {
  classId: string;
  title: string;
  type: ClassTaskType;
  description?: string;
  /** Extended instructions, resources, or notes for this assignment. */
  instructions?: string;
  deadline: string;
  /** How scores are entered and displayed. Defaults to points for older data. */
  scoreMode?: TaskScoreMode;
  /** Max points when scoreMode is points; optional cap for display. */
  maxScore?: number | null;
  /** Optional letter scale — minimum % per letter; works with points or percentage. */
  letterGrades?: LetterGradeBand[];
  /** Formative = practice; summative = counts toward term grade. */
  assessmentRole?: TaskAssessmentRole;
  termId?: string;
  categoryId?: string;
  /** When true, hidden from the main class workspace; see archived section. */
  archived?: boolean;
  rubric?: RubricCriterion[];
  /** Optional curriculum unit (IB planner). */
  unitId?: string;
  /** Visible to students/parents when true. */
  publishedToStudents?: boolean;
  publishedAt?: string;
}

export type ClassUnitStatus = "planned" | "in_progress" | "completed";

/** Curriculum unit within a class (IB-style planner). */
export interface ClassUnit extends BaseEntity {
  classId: string;
  title: string;
  description?: string;
  /** IB inquiry statement or essential question. */
  inquiry?: string;
  curriculumNotes?: string;
  startDate: string;
  endDate?: string;
  durationWeeks?: number;
  termId?: string;
  sortOrder: number;
  status?: ClassUnitStatus;
}

export type StudentTaskStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "missing"
  | "excused";

/** How missing / ungraded summative tasks affect term grades. */
export type MissingGradePolicy =
  | "count_as_zero"
  | "exclude_ungraded"
  | "incomplete_while_missing";

export type TermGradePostStatus = "draft" | "posted";

/** Official term mark per student per class (report card grade). */
export interface TermGrade extends BaseEntity {
  studentId: string;
  classId: string;
  termId: string;
  /** Live running grade from weighted summative tasks. */
  calculatedPercent: number | null;
  calculatedLetter?: string | null;
  /** Posted report-card mark (official once postStatus is posted). */
  postedPercent: number | null;
  postedLetter?: string | null;
  postStatus?: TermGradePostStatus;
  postedAt?: string | null;
  comment?: string;
  /** @deprecated Use postedPercent */
  submittedPercent?: number | null;
  /** @deprecated Use postedLetter */
  submittedLetter?: string | null;
}

/** School-wide grading configuration (singleton). */
export interface SchoolGradingSettings extends BaseEntity {
  termLetterBands: LetterGradeBand[];
  missingPolicy?: MissingGradePolicy;
}

/** Lesson plan / session notes for one class on one calendar day. */
export interface ClassSessionNote extends BaseEntity {
  classId: string;
  /** ISO date (YYYY-MM-DD) — actual session date (after reschedule). */
  date: string;
  /** Schedule event this session belongs to. */
  eventId?: string;
  /** Original date in the recurrence series (for matching exceptions). */
  occurrenceDate?: string;
  /** Teaching lifecycle — set manually; independent of lesson prep. */
  status?: "planned" | "in_progress" | "completed" | "cancelled";
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledReason?: string;
  /** Teacher-marked: lesson plan and materials are ready. */
  lessonPrepared?: boolean;
  title?: string;
  content: string;
}

export interface StudentTaskRecord {
  id: string;
  taskId: string;
  studentId: string;
  status: StudentTaskStatus;
  score: number | null;
  /** Set when the parent task uses letter scoreMode. */
  letterGrade?: string | null;
  feedback?: string;
  submittedAt?: string | null;
  /** Scores keyed by rubric criterion id. */
  criterionScores?: Record<string, number>;
  updatedAt: string;
}

export interface AppData {
  teachers: Teacher[];
  students: Student[];
  classes: SchoolClass[];
  subjects: Subject[];
  attendance: AttendanceRecord[];
  behaviourSkills: BehaviourSkill[];
  pointEvents: PointEvent[];
  classTasks: ClassTask[];
  classUnits: ClassUnit[];
  studentTaskRecords: StudentTaskRecord[];
  classSessionNotes: ClassSessionNote[];
  classScheduleEvents: ClassScheduleEvent[];
  classSessionExceptions: ClassSessionException[];
  academicTerms: AcademicTerm[];
  taskAssessmentCategories: TaskAssessmentCategory[];
  termGrades: TermGrade[];
  schoolGradingSettings: SchoolGradingSettings[];
}
