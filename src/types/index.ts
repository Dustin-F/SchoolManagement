export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface Teacher extends BaseEntity {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  subjects?: string[];
}

export interface Student extends BaseEntity {
  firstName: string;
  lastName: string;
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
  subjectId: string;
  teacherId: string;
  coTeacherIds: string[];
  studentIds: string[];
  schedule: ScheduleEntry[];
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

export type BehaviourSeverity = "positive" | "minor" | "moderate" | "major";
export type BehaviourCategory =
  | "academic"
  | "conduct"
  | "participation"
  | "respect"
  | "other";

export interface BehaviourRecord extends BaseEntity {
  studentId: string;
  classId?: string;
  subjectId?: string;
  date: string;
  category: BehaviourCategory;
  severity: BehaviourSeverity;
  description: string;
  actionTaken?: string;
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
  behaviour: BehaviourRecord[];
  classTasks: ClassTask[];
  studentTaskRecords: StudentTaskRecord[];
}
