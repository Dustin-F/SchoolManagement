export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface Teacher extends BaseEntity {
  firstName: string;
  lastName: string;
  chineseName?: string;
  pinyinName?: string;
  email?: string;
  phone?: string;
  subjects?: string[];
}

export interface Student extends BaseEntity {
  firstName: string;
  lastName: string;
  chineseName?: string;
  pinyinName?: string;
  email?: string;
  dateOfBirth?: string;
  parentName?: string;
  parentPhone?: string;
  notes?: string;
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface ScheduleEntry {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface SchoolClass extends BaseEntity {
  name: string;
  classroomNumber?: string;
  subjectId: string;
  teacherId: string;
  coTeacherIds: string[];
  studentIds: string[];
  schedule: ScheduleEntry[];
  /** School-wide skills pinned to this class toolbar (skill ids). */
  pinnedSkillIds?: string[];
  /** Seating grid columns (2–12). */
  seatColumns?: number;
  /** Fixed row count; omit for auto rows from student count. */
  seatRows?: number;
  /** Row-major seat layout (`null` = empty desk). Length = seatColumns × seatRows. */
  seatGrid?: (string | null)[];
}

export interface Subject extends BaseEntity {
  name: string;
  code?: string;
  description?: string;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceRecord extends BaseEntity {
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}

export type SkillType = "positive" | "needs_work";

/** School-wide merit / reminder skill (ClassDojo-style). */
export interface BehaviourSkill extends BaseEntity {
  name: string;
  emoji?: string;
  points: number;
  type: SkillType;
  active: boolean;
  sortOrder: number;
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

export interface ClassTask extends BaseEntity {
  classId: string;
  title: string;
  type: ClassTaskType;
  description?: string;
  deadline: string;
  maxScore?: number | null;
  /** When true, hidden from the main class workspace; see archived section. */
  archived?: boolean;
}

export type StudentTaskStatus = "not_started" | "in_progress" | "completed" | "missing";

export interface StudentTaskRecord {
  id: string;
  taskId: string;
  studentId: string;
  status: StudentTaskStatus;
  score: number | null;
  feedback?: string;
  submittedAt?: string | null;
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
  studentTaskRecords: StudentTaskRecord[];
}
