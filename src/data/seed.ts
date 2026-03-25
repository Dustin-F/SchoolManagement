import type {
  Teacher,
  Student,
  SchoolClass,
  Subject,
  AttendanceRecord,
  BehaviourRecord,
  ClassTask,
  StudentTaskRecord,
} from "@/types";

const now = new Date().toISOString();

export const seedTeachers: Teacher[] = [
  {
    id: "t1",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "s.johnson@school.edu",
    phone: "555-0101",
    subjects: ["sub1", "sub2"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "t2",
    firstName: "Michael",
    lastName: "Chen",
    email: "m.chen@school.edu",
    phone: "555-0102",
    subjects: ["sub3"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "t3",
    firstName: "Emily",
    lastName: "Davis",
    email: "e.davis@school.edu",
    phone: "555-0103",
    subjects: ["sub4", "sub5"],
    createdAt: now,
    updatedAt: now,
  },
];

export const seedSubjects: Subject[] = [
  { id: "sub1", name: "Mathematics", code: "MATH", description: "Core mathematics", createdAt: now, updatedAt: now },
  { id: "sub2", name: "English", code: "ENG", description: "English language arts", createdAt: now, updatedAt: now },
  { id: "sub3", name: "Science", code: "SCI", description: "General science", createdAt: now, updatedAt: now },
  { id: "sub4", name: "History", code: "HIST", description: "World and local history", createdAt: now, updatedAt: now },
  { id: "sub5", name: "Art", code: "ART", description: "Visual arts", createdAt: now, updatedAt: now },
  { id: "sub6", name: "IELTS", code: "IELTS", description: "IELTS preparation", createdAt: now, updatedAt: now },
];

export const seedClasses: SchoolClass[] = [
  {
    id: "c1",
    name: "Grade10-A Mathematics",
    subjectId: "sub1",
    teacherId: "t1",
    coTeacherIds: ["t3"],
    studentIds: ["s1", "s2", "s3", "s4", "s5"],
    schedule: [
      { id: "sch1", dayOfWeek: "monday", startTime: "08:00", endTime: "09:00" },
      { id: "sch2", dayOfWeek: "wednesday", startTime: "08:00", endTime: "09:00" },
      { id: "sch3", dayOfWeek: "friday", startTime: "10:00", endTime: "11:00" },
    ],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "c2",
    name: "Grade10-B Science",
    subjectId: "sub3",
    teacherId: "t2",
    coTeacherIds: [],
    studentIds: ["s6", "s7", "s8", "s1", "s3"],
    schedule: [
      { id: "sch4", dayOfWeek: "tuesday", startTime: "09:00", endTime: "10:30" },
      { id: "sch5", dayOfWeek: "thursday", startTime: "09:00", endTime: "10:30" },
    ],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "c3",
    name: "Grade9-A IELTS",
    subjectId: "sub6",
    teacherId: "t3",
    coTeacherIds: ["t1"],
    studentIds: ["s9", "s10", "s2", "s6"],
    schedule: [
      { id: "sch6", dayOfWeek: "monday", startTime: "13:00", endTime: "14:30" },
      { id: "sch7", dayOfWeek: "wednesday", startTime: "13:00", endTime: "14:30" },
    ],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "c4",
    name: "Grade10-A English",
    subjectId: "sub2",
    teacherId: "t1",
    coTeacherIds: [],
    studentIds: ["s1", "s2", "s4", "s5", "s7"],
    schedule: [
      { id: "sch8", dayOfWeek: "tuesday", startTime: "11:00", endTime: "12:00" },
      { id: "sch9", dayOfWeek: "thursday", startTime: "11:00", endTime: "12:00" },
    ],
    createdAt: now,
    updatedAt: now,
  },
];

export const seedStudents: Student[] = [
  { id: "s1", firstName: "Alex", lastName: "Rivera", dateOfBirth: "2010-03-15", parentName: "Maria Rivera", parentPhone: "555-1001", createdAt: now, updatedAt: now },
  { id: "s2", firstName: "Jordan", lastName: "Kim", dateOfBirth: "2010-07-22", parentName: "David Kim", parentPhone: "555-1002", createdAt: now, updatedAt: now },
  { id: "s3", firstName: "Taylor", lastName: "Smith", dateOfBirth: "2010-01-08", parentName: "Susan Smith", parentPhone: "555-1003", createdAt: now, updatedAt: now },
  { id: "s4", firstName: "Casey", lastName: "Brown", dateOfBirth: "2010-11-30", parentName: "James Brown", parentPhone: "555-1004", createdAt: now, updatedAt: now },
  { id: "s5", firstName: "Morgan", lastName: "Lee", dateOfBirth: "2010-05-19", parentName: "Lisa Lee", parentPhone: "555-1005", createdAt: now, updatedAt: now },
  { id: "s6", firstName: "Quinn", lastName: "Martinez", dateOfBirth: "2010-09-12", parentName: "Carlos Martinez", parentPhone: "555-1006", createdAt: now, updatedAt: now },
  { id: "s7", firstName: "Riley", lastName: "Anderson", dateOfBirth: "2010-02-28", parentName: "Kathy Anderson", parentPhone: "555-1007", createdAt: now, updatedAt: now },
  { id: "s8", firstName: "Avery", lastName: "Wilson", dateOfBirth: "2010-06-14", parentName: "Tom Wilson", parentPhone: "555-1008", createdAt: now, updatedAt: now },
  { id: "s9", firstName: "Jamie", lastName: "Taylor", dateOfBirth: "2011-04-21", parentName: "Nancy Taylor", parentPhone: "555-1009", createdAt: now, updatedAt: now },
  { id: "s10", firstName: "Drew", lastName: "Garcia", dateOfBirth: "2011-08-05", parentName: "Roberto Garcia", parentPhone: "555-1010", createdAt: now, updatedAt: now },
];

const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
const today = new Date().toISOString().split("T")[0];
const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
const overdueDay = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];

export const seedClassTasks: ClassTask[] = [
  {
    id: "ct1",
    classId: "c1",
    title: "Chapter 5 Quiz",
    type: "quiz",
    description: "Covers sections 5.1–5.3",
    deadline: nextWeek,
    maxScore: 100,
    archived: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ct2",
    classId: "c1",
    title: "Problem Set 4",
    type: "homework",
    description: "Odd-numbered exercises",
    deadline: overdueDay,
    maxScore: 50,
    archived: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ct_arch_demo",
    classId: "c1",
    title: "Unit 1 review (archived example)",
    type: "worksheet",
    description: "Appears only under Archived until you restore it.",
    deadline: overdueDay,
    maxScore: 20,
    archived: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const seedStudentTaskRecords: StudentTaskRecord[] = [
  { id: "str1", taskId: "ct1", studentId: "s1", status: "completed", score: 92, feedback: "Great work", submittedAt: yesterday, updatedAt: now },
  { id: "str2", taskId: "ct1", studentId: "s2", status: "in_progress", score: null, submittedAt: null, updatedAt: now },
  { id: "str3", taskId: "ct1", studentId: "s3", status: "not_started", score: null, submittedAt: null, updatedAt: now },
  { id: "str4", taskId: "ct1", studentId: "s4", status: "missing", score: null, submittedAt: null, updatedAt: now },
  { id: "str5", taskId: "ct1", studentId: "s5", status: "not_started", score: null, submittedAt: null, updatedAt: now },
  { id: "str6", taskId: "ct2", studentId: "s1", status: "completed", score: 48, submittedAt: yesterday, updatedAt: now },
  { id: "str7", taskId: "ct2", studentId: "s2", status: "missing", score: null, submittedAt: null, updatedAt: now },
  { id: "str8", taskId: "ct2", studentId: "s3", status: "completed", score: 44, submittedAt: yesterday, updatedAt: now },
  { id: "str9", taskId: "ct2", studentId: "s4", status: "in_progress", score: null, submittedAt: null, updatedAt: now },
  { id: "str10", taskId: "ct2", studentId: "s5", status: "not_started", score: null, submittedAt: null, updatedAt: now },
];

export const seedAttendance: AttendanceRecord[] = [
  { id: "a1", studentId: "s1", classId: "c1", date: yesterday, status: "present", createdAt: now, updatedAt: now },
  { id: "a2", studentId: "s2", classId: "c1", date: yesterday, status: "present", createdAt: now, updatedAt: now },
  { id: "a3", studentId: "s3", classId: "c1", date: yesterday, status: "absent", notes: "Sick", createdAt: now, updatedAt: now },
  { id: "a4", studentId: "s4", classId: "c1", date: yesterday, status: "late", createdAt: now, updatedAt: now },
  { id: "a5", studentId: "s5", classId: "c1", date: yesterday, status: "present", createdAt: now, updatedAt: now },
  { id: "a6", studentId: "s1", classId: "c1", date: today, status: "present", createdAt: now, updatedAt: now },
  { id: "a7", studentId: "s2", classId: "c1", date: today, status: "excused", notes: "Family event", createdAt: now, updatedAt: now },
];

export const seedBehaviour: BehaviourRecord[] = [
  {
    id: "b1",
    studentId: "s3",
    classId: "c1",
    subjectId: "sub1",
    date: yesterday,
    category: "conduct",
    severity: "minor",
    description: "Talking during class without permission",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "b2",
    studentId: "s1",
    classId: "c4",
    subjectId: "sub2",
    date: today,
    category: "participation",
    severity: "positive",
    description: "Excellent contribution to group discussion",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "b3",
    studentId: "s6",
    classId: "c2",
    date: today,
    category: "respect",
    severity: "moderate",
    description: "Disrespectful language toward a classmate",
    actionTaken: "Verbal warning and parent notification",
    createdAt: now,
    updatedAt: now,
  },
];
