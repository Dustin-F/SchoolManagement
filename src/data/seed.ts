import type {
  Teacher,
  Student,
  SchoolClass,
  Subject,
  AttendanceRecord,
  BehaviourSkill,
  PointEvent,
  ClassTask,
  StudentTaskRecord,
  StudentTaskStatus,
} from "@/types";
import { toLocalDateString } from "@/lib/utils";

const SEED_TIME = "2026-05-28T08:00:00.000Z";

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
}

const TODAY = offsetDate(0);
const YESTERDAY = offsetDate(-1);
const TWO_DAYS_AGO = offsetDate(-2);
const NEXT_WEEK = offsetDate(7);
const IN_TWO_WEEKS = offsetDate(14);

function ent<T extends { id: string; createdAt: string; updatedAt: string }>(
  id: string,
  data: Omit<T, "id" | "createdAt" | "updatedAt">
): T {
  return { id, createdAt: SEED_TIME, updatedAt: SEED_TIME, ...data } as T;
}

function studentId(n: number): string {
  return `stu-${String(n).padStart(2, "0")}`;
}

function studentIds(from: number, to: number): string[] {
  return Array.from({ length: to - from + 1 }, (_, i) => studentId(from + i));
}

const EXTRA_FIRST = [
  "Ryan", "Grace", "Jack", "Lily", "Nathan", "Zoe", "Caleb", "Hannah",
  "Owen", "Chloe", "Levi", "Nora", "Isaac", "Ruby", "Mason", "Stella",
  "Elias", "Violet", "Adrian", "Piper", "Colin", "Sage", "Derek", "Jade",
  "Felix", "Wren", "Gavin", "Cleo", "Hugo", "Iris", "Jasper", "Luna", "Kai", "Maya",
];

const EXTRA_LAST = [
  "Moore", "Adams", "Baker", "Bell", "Brooks", "Carter", "Cole", "Cooper",
  "Diaz", "Edwards", "Fisher", "Foster", "Gray", "Green", "Hayes", "Hill",
  "Howard", "Hughes", "James", "Jenkins", "Kelly", "Lee", "Long", "Marshall",
  "Morgan", "Murphy", "Parker", "Perez", "Powell", "Reed", "Ross", "Sanders", "Ward", "Wood",
];

const EXTRA_CHINESE: Array<{ chineseName: string; pinyinName: string }> = [
  { chineseName: "陈晨", pinyinName: "Chen Chen" },
  { chineseName: "林悦", pinyinName: "Lin Yue" },
  { chineseName: "黄涛", pinyinName: "Huang Tao" },
  { chineseName: "周婷", pinyinName: "Zhou Ting" },
  { chineseName: "吴昊", pinyinName: "Wu Hao" },
  { chineseName: "郑雪", pinyinName: "Zheng Xue" },
  { chineseName: "孙磊", pinyinName: "Sun Lei" },
  { chineseName: "马丽", pinyinName: "Ma Li" },
];

function buildExtraStudents(): Student[] {
  const out: Student[] = [];
  for (let n = 25; n <= 58; n++) {
    const i = n - 25;
    const year = 2009 + (i % 4);
    const month = String((i % 12) + 1).padStart(2, "0");
    const day = String((i % 27) + 1).padStart(2, "0");
    const dob = `${year}-${month}-${day}`;

    if (i % 5 === 1) {
      const c = EXTRA_CHINESE[i % EXTRA_CHINESE.length];
      out.push(
        ent<Student>(studentId(n), {
          firstName: "",
          lastName: "",
          chineseName: c.chineseName,
          pinyinName: c.pinyinName,
          dateOfBirth: dob,
          parentPhone: `555-10${String(n)}`,
        })
      );
    } else {
      const first = EXTRA_FIRST[i % EXTRA_FIRST.length];
      const last = EXTRA_LAST[i % EXTRA_LAST.length];
      out.push(
        ent<Student>(studentId(n), {
          firstName: first,
          lastName: last,
          dateOfBirth: dob,
          email: i % 3 === 0 ? `${first.toLowerCase()}.${last.toLowerCase()}@demo` : undefined,
          parentName: i % 4 === 0 ? `${last} family` : undefined,
          parentPhone: i % 5 === 0 ? `555-10${String(n)}` : undefined,
        })
      );
    }
  }
  return out;
}

export const seedSubjects: Subject[] = [
  ent<Subject>("sub-math", { name: "Mathematics", code: "MATH", description: "Algebra, geometry, and problem solving" }),
  ent<Subject>("sub-english", { name: "English", code: "ENG", description: "Reading, writing, and literature" }),
  ent<Subject>("sub-science", { name: "Science", code: "SCI", description: "Biology, chemistry, and physics" }),
  ent<Subject>("sub-ielts", { name: "IELTS Speaking", code: "IELTS", description: "Speaking practice and mock exams" }),
  ent<Subject>("sub-chinese", { name: "Chinese", code: "CHN", description: "Mandarin language and culture" }),
  ent<Subject>("sub-history", { name: "History", code: "HIS", description: "Modern world history" }),
];

export const seedTeachers: Teacher[] = [
  ent<Teacher>("tch-sarah", {
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@schoolhub.demo",
    phone: "555-0101",
    subjects: ["sub-english", "sub-history"],
  }),
  ent<Teacher>("tch-li", {
    firstName: "Ming",
    lastName: "Li",
    chineseName: "李明",
    pinyinName: "Li Ming",
    email: "li.ming@schoolhub.demo",
    phone: "555-0102",
    subjects: ["sub-math", "sub-chinese"],
  }),
  ent<Teacher>("tch-mike", {
    firstName: "Michael",
    lastName: "Chen",
    chineseName: "陈迈克",
    pinyinName: "Chen Maike",
    email: "michael.chen@schoolhub.demo",
    phone: "555-0103",
    subjects: ["sub-science", "sub-ielts"],
  }),
  ent<Teacher>("tch-emma", {
    firstName: "Emma",
    lastName: "Williams",
    email: "emma.williams@schoolhub.demo",
    phone: "555-0104",
    subjects: ["sub-science", "sub-english"],
  }),
];

export const seedStudents: Student[] = [
  ent<Student>("stu-01", { firstName: "James", lastName: "Wilson", email: "james.w@demo", dateOfBirth: "2011-03-14", parentName: "Kate Wilson", parentPhone: "555-1001" }),
  ent<Student>("stu-02", { firstName: "", lastName: "", chineseName: "王小明", pinyinName: "Wang Xiaoming", dateOfBirth: "2011-07-22", parentName: "王父", parentPhone: "555-1002" }),
  ent<Student>("stu-03", { firstName: "Emily", lastName: "Chen", chineseName: "陈艾米", pinyinName: "Chen Aimi", email: "emily.c@demo", dateOfBirth: "2011-01-08" }),
  ent<Student>("stu-04", { firstName: "Oliver", lastName: "Brown", dateOfBirth: "2011-11-30", parentName: "Tom Brown" }),
  ent<Student>("stu-05", { firstName: "", lastName: "", chineseName: "李华", pinyinName: "Li Hua", dateOfBirth: "2011-05-19", parentPhone: "555-1005" }),
  ent<Student>("stu-06", { firstName: "Sophia", lastName: "Martinez", email: "sophia.m@demo", dateOfBirth: "2011-09-03" }),
  ent<Student>("stu-07", { firstName: "Noah", lastName: "Taylor", dateOfBirth: "2010-04-17", parentName: "Lisa Taylor" }),
  ent<Student>("stu-08", { firstName: "Ava", lastName: "Anderson", chineseName: "安德森艾娃", dateOfBirth: "2010-12-25" }),
  ent<Student>("stu-09", { firstName: "", lastName: "", chineseName: "张丽", pinyinName: "Zhang Li", dateOfBirth: "2010-08-11" }),
  ent<Student>("stu-10", { firstName: "Ethan", lastName: "Thomas", email: "ethan.t@demo", dateOfBirth: "2010-02-28" }),
  ent<Student>("stu-11", { firstName: "Mia", lastName: "Jackson", dateOfBirth: "2010-06-15", parentPhone: "555-1011" }),
  ent<Student>("stu-12", { firstName: "Lucas", lastName: "White", chineseName: "卢卡斯", pinyinName: "Lu Kasi", dateOfBirth: "2010-10-09" }),
  ent<Student>("stu-13", { firstName: "Isabella", lastName: "Harris", email: "bella.h@demo", dateOfBirth: "2009-03-21" }),
  ent<Student>("stu-14", { firstName: "", lastName: "", chineseName: "刘洋", pinyinName: "Liu Yang", dateOfBirth: "2009-07-07", parentName: "刘母" }),
  ent<Student>("stu-15", { firstName: "William", lastName: "Clark", dateOfBirth: "2009-01-13" }),
  ent<Student>("stu-16", { firstName: "Charlotte", lastName: "Lewis", chineseName: "夏洛特", dateOfBirth: "2009-11-02" }),
  ent<Student>("stu-17", { firstName: "Benjamin", lastName: "Walker", email: "ben.w@demo", dateOfBirth: "2009-05-27" }),
  ent<Student>("stu-18", { firstName: "Amelia", lastName: "Hall", pinyinName: "Amelia Hall", dateOfBirth: "2009-09-18" }),
  ent<Student>("stu-19", { firstName: "Henry", lastName: "Allen", dateOfBirth: "2009-04-05", parentName: "Paul Allen" }),
  ent<Student>("stu-20", { firstName: "", lastName: "", chineseName: "赵敏", pinyinName: "Zhao Min", dateOfBirth: "2009-08-29" }),
  ent<Student>("stu-21", { firstName: "Evelyn", lastName: "Young", email: "evelyn.y@demo", dateOfBirth: "2009-12-12" }),
  ent<Student>("stu-22", { firstName: "Daniel", lastName: "King", chineseName: "丹尼尔", dateOfBirth: "2009-02-14" }),
  ent<Student>("stu-23", { firstName: "Harper", lastName: "Wright", dateOfBirth: "2009-10-31", parentPhone: "555-1023" }),
  ent<Student>("stu-24", { firstName: "Alexander", lastName: "Scott", pinyinName: "Alexander Scott", dateOfBirth: "2009-06-06" }),
  ...buildExtraStudents(),
];

/** 20 students — largest homeroom / math section */
const G9A_LARGE = studentIds(1, 20);
/** 6 students — small English section */
const G9B_SMALL = studentIds(21, 26);
/** 12 students — medium Year 10 cohort */
const G10A_MED = studentIds(27, 38);
/** 20 students — largest IELTS class */
const G10B_LARGE = studentIds(39, 58);
/** 4 students — small elective */
const G11_ELECTIVE = [studentId(5), studentId(25), studentId(35), studentId(45)];
/** 3 students — tiny pull-out support group */
const G_PULLOUT = [studentId(7), studentId(17), studentId(37)];

export const seedClasses: SchoolClass[] = [
  ent<SchoolClass>("cls-9a-math", {
    name: "9A",
    seatColumns: 5,
    classroomNumber: "101",
    subjectId: "sub-math",
    teacherId: "tch-li",
    coTeacherIds: [],
    studentIds: G9A_LARGE,
    schedule: [
      { id: "sch-9a-m1", dayOfWeek: "monday", startTime: "08:00", endTime: "09:00" },
      { id: "sch-9a-m2", dayOfWeek: "wednesday", startTime: "08:00", endTime: "09:00" },
      { id: "sch-9a-m3", dayOfWeek: "friday", startTime: "08:00", endTime: "09:00" },
    ],
  }),
  ent<SchoolClass>("cls-9b-eng", {
    name: "9B",
    classroomNumber: "102",
    subjectId: "sub-english",
    teacherId: "tch-sarah",
    coTeacherIds: ["tch-emma"],
    studentIds: G9B_SMALL,
    schedule: [
      { id: "sch-9b-e1", dayOfWeek: "tuesday", startTime: "09:30", endTime: "10:30" },
      { id: "sch-9b-e2", dayOfWeek: "thursday", startTime: "09:30", endTime: "10:30" },
    ],
  }),
  ent<SchoolClass>("cls-10a-ielts", {
    name: "10A",
    classroomNumber: "201",
    subjectId: "sub-ielts",
    teacherId: "tch-mike",
    coTeacherIds: [],
    studentIds: G10A_MED,
    schedule: [
      { id: "sch-10a-i1", dayOfWeek: "monday", startTime: "08:00", endTime: "08:40" },
      { id: "sch-10a-i2", dayOfWeek: "wednesday", startTime: "10:00", endTime: "10:40" },
      { id: "sch-10a-i3", dayOfWeek: "friday", startTime: "11:00", endTime: "11:40" },
    ],
  }),
  ent<SchoolClass>("cls-10b-ielts", {
    name: "10B",
    seatColumns: 5,
    seatRows: 4,
    classroomNumber: "202",
    subjectId: "sub-ielts",
    teacherId: "tch-mike",
    coTeacherIds: [],
    studentIds: G10B_LARGE,
    pinnedSkillIds: [
      "skill-participation",
      "skill-on-task",
      "skill-excellent",
      "skill-helping",
      "skill-talking",
      "skill-off-task",
    ],
    schedule: [
      { id: "sch-10b-i1", dayOfWeek: "monday", startTime: "08:00", endTime: "08:40" },
      { id: "sch-10b-i2", dayOfWeek: "tuesday", startTime: "09:40", endTime: "10:20" },
      { id: "sch-10b-i3", dayOfWeek: "thursday", startTime: "09:40", endTime: "10:20" },
    ],
  }),
  ent<SchoolClass>("cls-10a-sci", {
    name: "10A Science",
    classroomNumber: "Lab 3",
    subjectId: "sub-science",
    teacherId: "tch-emma",
    coTeacherIds: ["tch-mike"],
    studentIds: G10A_MED,
    schedule: [
      { id: "sch-10a-s1", dayOfWeek: "tuesday", startTime: "13:00", endTime: "14:00" },
      { id: "sch-10a-s2", dayOfWeek: "thursday", startTime: "13:00", endTime: "14:00" },
    ],
  }),
  ent<SchoolClass>("cls-10a-chi", {
    name: "10A Chinese",
    classroomNumber: "105",
    subjectId: "sub-chinese",
    teacherId: "tch-li",
    coTeacherIds: [],
    studentIds: G10A_MED,
    schedule: [
      { id: "sch-10a-c1", dayOfWeek: "monday", startTime: "14:00", endTime: "15:00" },
      { id: "sch-10a-c2", dayOfWeek: "wednesday", startTime: "14:00", endTime: "15:00" },
    ],
  }),
  ent<SchoolClass>("cls-11-hist", {
    name: "11 History",
    classroomNumber: "301",
    subjectId: "sub-history",
    teacherId: "tch-sarah",
    coTeacherIds: [],
    studentIds: G11_ELECTIVE,
    schedule: [
      { id: "sch-11-h1", dayOfWeek: "friday", startTime: "15:00", endTime: "16:00" },
    ],
  }),
  ent<SchoolClass>("cls-9-pullout", {
    name: "9 Pull-out IELTS",
    seatColumns: 3,
    classroomNumber: "Support 1",
    subjectId: "sub-ielts",
    teacherId: "tch-mike",
    coTeacherIds: [],
    studentIds: G_PULLOUT,
    schedule: [
      { id: "sch-po-1", dayOfWeek: "wednesday", startTime: "11:30", endTime: "12:00" },
    ],
  }),
];

type AttSeed = Omit<AttendanceRecord, "id" | "createdAt" | "updatedAt">;
type AttendanceStatus = AttSeed["status"];

function att(id: string, data: AttSeed): AttendanceRecord {
  return ent<AttendanceRecord>(id, data);
}

function attForRoster(
  classId: string,
  roster: string[],
  date: string,
  prefix: string,
  statusForIndex: (index: number) => AttendanceStatus
): AttendanceRecord[] {
  return roster.map((studentId, i) =>
    att(`${prefix}-${studentId}`, {
      studentId,
      classId,
      date,
      status: statusForIndex(i),
    })
  );
}

export const seedAttendance: AttendanceRecord[] = [
  ...attForRoster("cls-9a-math", G9A_LARGE, TODAY, "att-9a-t", (i) =>
    i % 11 === 0 ? "absent" : i % 7 === 0 ? "late" : "present"
  ),
  ...attForRoster("cls-9b-eng", G9B_SMALL, TODAY, "att-9b-t", (i) =>
    i === 1 ? "late" : i === 4 ? "absent" : "present"
  ),
  ...attForRoster("cls-10b-ielts", G10B_LARGE, TODAY, "att-10b-t", (i) =>
    i % 9 === 0 ? "excused" : i % 6 === 0 ? "late" : "present"
  ),
  ...attForRoster("cls-10b-ielts", G10B_LARGE.slice(0, 12), YESTERDAY, "att-10b-y", (i) =>
    i === 0 ? "absent" : "present"
  ),
  ...attForRoster("cls-10a-ielts", G10A_MED.slice(0, 8), YESTERDAY, "att-10a-y", (i) =>
    i === 3 ? "late" : "present"
  ),
  ...attForRoster("cls-9-pullout", G_PULLOUT, TODAY, "att-po-t", () => "present"),
];

export const seedBehaviourSkills: BehaviourSkill[] = [
  ent<BehaviourSkill>("skill-participation", {
    name: "Great participation",
    emoji: "👏",
    points: 1,
    type: "positive",
    active: true,
    sortOrder: 1,
  }),
  ent<BehaviourSkill>("skill-helping", {
    name: "Helping others",
    emoji: "🤝",
    points: 1,
    type: "positive",
    active: true,
    sortOrder: 2,
  }),
  ent<BehaviourSkill>("skill-on-task", {
    name: "On task",
    emoji: "✅",
    points: 1,
    type: "positive",
    active: true,
    sortOrder: 3,
  }),
  ent<BehaviourSkill>("skill-excellent", {
    name: "Excellent work",
    emoji: "⭐",
    points: 2,
    type: "positive",
    active: true,
    sortOrder: 4,
  }),
  ent<BehaviourSkill>("skill-kindness", {
    name: "Kindness",
    emoji: "💜",
    points: 1,
    type: "positive",
    active: true,
    sortOrder: 5,
  }),
  ent<BehaviourSkill>("skill-talking", {
    name: "Talking",
    emoji: "💬",
    points: -1,
    type: "needs_work",
    active: true,
    sortOrder: 6,
  }),
  ent<BehaviourSkill>("skill-off-task", {
    name: "Off task",
    emoji: "📵",
    points: -1,
    type: "needs_work",
    active: true,
    sortOrder: 7,
  }),
  ent<BehaviourSkill>("skill-late", {
    name: "Late",
    emoji: "⏰",
    points: -1,
    type: "needs_work",
    active: true,
    sortOrder: 8,
  }),
];

function pt(
  id: string,
  data: Omit<PointEvent, "id" | "createdAt">
): PointEvent {
  return { id, createdAt: SEED_TIME, ...data };
}

const POINT_SKILLS_POS = ["skill-participation", "skill-helping", "skill-on-task", "skill-excellent"] as const;
const POINT_SKILLS_NEG = ["skill-talking", "skill-off-task", "skill-late"] as const;

export const seedPointEvents: PointEvent[] = [
  pt("pt-01", { studentId: studentId(2), skillId: "skill-excellent", classId: "cls-9a-math", date: TODAY, points: 2, note: "Excellent problem-solving on the board." }),
  pt("pt-02", { studentId: studentId(22), skillId: "skill-talking", classId: "cls-9b-eng", date: YESTERDAY, points: -1, note: "Talking during silent reading." }),
  pt("pt-03", { studentId: studentId(39), skillId: "skill-participation", classId: "cls-10b-ielts", date: TODAY, points: 1, note: "Led group discussion confidently." }),
  pt("pt-04", { studentId: studentId(44), skillId: "skill-off-task", classId: "cls-10b-ielts", date: TWO_DAYS_AGO, points: -1, note: "Phone out during mock speaking." }),
  pt("pt-05", { studentId: studentId(30), skillId: "skill-helping", classId: "cls-10a-sci", date: YESTERDAY, points: 1 }),
  pt("pt-06", { studentId: studentId(5), skillId: "skill-late", classId: "cls-9a-math", date: TWO_DAYS_AGO, points: -1 }),
  pt("pt-07", { studentId: studentId(7), skillId: "skill-participation", classId: "cls-9-pullout", date: TODAY, points: 1, note: "Strong effort in pull-out session." }),
  ...G10B_LARGE.slice(0, 12).map((sid, i) =>
    pt(`pt-10b-${i}`, {
      studentId: sid,
      skillId: POINT_SKILLS_POS[i % POINT_SKILLS_POS.length],
      classId: "cls-10b-ielts",
      date: i % 2 === 0 ? TODAY : YESTERDAY,
      points: i % 4 === 0 ? 2 : 1,
    })
  ),
  ...G9A_LARGE.filter((_, i) => i % 5 === 0).map((sid, i) =>
    pt(`pt-9a-${i}`, {
      studentId: sid,
      skillId: i % 2 === 0 ? "skill-on-task" : "skill-kindness",
      classId: "cls-9a-math",
      date: TODAY,
      points: 1,
    })
  ),
  pt("pt-neg-1", { studentId: studentId(52), skillId: POINT_SKILLS_NEG[0], classId: "cls-10b-ielts", date: TODAY, points: -1 }),
  pt("pt-neg-2", { studentId: studentId(55), skillId: POINT_SKILLS_NEG[1], classId: "cls-10b-ielts", date: TODAY, points: -1 }),
];

export const seedClassTasks: ClassTask[] = [
  ent<ClassTask>("task-9a-hw1", {
    classId: "cls-9a-math",
    title: "Linear equations worksheet",
    type: "worksheet",
    description: "Complete exercises 1–20.",
    deadline: NEXT_WEEK,
    maxScore: 20,
  }),
  ent<ClassTask>("task-9b-essay", {
    classId: "cls-9b-eng",
    title: "Persuasive essay draft",
    type: "essay",
    deadline: IN_TWO_WEEKS,
    maxScore: 100,
  }),
  ent<ClassTask>("task-9a-quiz", {
    classId: "cls-9a-math",
    title: "Algebra checkpoint quiz",
    type: "quiz",
    deadline: TODAY,
    maxScore: 15,
  }),
  ent<ClassTask>("task-po-hw", {
    classId: "cls-9-pullout",
    title: "Cue card practice",
    type: "homework",
    description: "Record a 1-minute response at home.",
    deadline: NEXT_WEEK,
    maxScore: null,
  }),
  ent<ClassTask>("task-10a-mock", {
    classId: "cls-10a-ielts",
    title: "Speaking mock exam",
    type: "exam",
    description: "Part 1–3 practice under timed conditions.",
    deadline: NEXT_WEEK,
    maxScore: 9,
  }),
  ent<ClassTask>("task-10b-hw1", {
    classId: "cls-10b-ielts",
    title: "Cue card preparation",
    type: "homework",
    description: "Prepare 2-minute response for assigned topic.",
    deadline: NEXT_WEEK,
    maxScore: null,
  }),
  ent<ClassTask>("task-10b-quiz", {
    classId: "cls-10b-ielts",
    title: "Fluency & coherence quiz",
    type: "quiz",
    deadline: TODAY,
    maxScore: 10,
  }),
  ent<ClassTask>("task-10b-proj", {
    classId: "cls-10b-ielts",
    title: "Group presentation",
    type: "presentation",
    description: "Present on a social issue — 5 minutes per group.",
    deadline: IN_TWO_WEEKS,
    maxScore: 50,
  }),
  ent<ClassTask>("task-10b-arch", {
    classId: "cls-10b-ielts",
    title: "Term 1 vocabulary test",
    type: "exam",
    deadline: TWO_DAYS_AGO,
    maxScore: 30,
    archived: true,
  }),
  ent<ClassTask>("task-10a-sci-lab", {
    classId: "cls-10a-sci",
    title: "Chemistry lab report",
    type: "project",
    deadline: IN_TWO_WEEKS,
    maxScore: 40,
  }),
];

const STATUSES: StudentTaskStatus[] = ["not_started", "in_progress", "completed", "missing"];

function taskRecord(
  id: string,
  taskId: string,
  studentId: string,
  status: StudentTaskStatus,
  score: number | null = null,
  submittedAt?: string
): StudentTaskRecord {
  return {
    id,
    taskId,
    studentId,
    status,
    score,
    feedback: status === "completed" ? "Good work." : undefined,
    submittedAt: submittedAt ?? (status === "completed" ? YESTERDAY : null),
    updatedAt: SEED_TIME,
  };
}

function recordsForClassTask(
  taskId: string,
  studentIds: string[],
  prefix: string
): StudentTaskRecord[] {
  return studentIds.map((studentId, i) =>
    taskRecord(
      `${prefix}-${studentId}`,
      taskId,
      studentId,
      STATUSES[i % STATUSES.length],
      STATUSES[i % STATUSES.length] === "completed" ? 7 + (i % 3) : null,
      STATUSES[i % STATUSES.length] === "completed" ? YESTERDAY : undefined
    )
  );
}

export const seedStudentTaskRecords: StudentTaskRecord[] = [
  ...recordsForClassTask("task-9a-hw1", G9A_LARGE, "rec-9a-hw1"),
  ...recordsForClassTask("task-9a-quiz", G9A_LARGE, "rec-9a-quiz"),
  ...recordsForClassTask("task-9b-essay", G9B_SMALL, "rec-9b-essay"),
  ...recordsForClassTask("task-10b-hw1", G10B_LARGE, "rec-10b-hw1"),
  ...recordsForClassTask("task-10b-quiz", G10B_LARGE, "rec-10b-quiz"),
  ...recordsForClassTask("task-10b-proj", G10B_LARGE, "rec-10b-proj"),
  ...recordsForClassTask("task-10a-mock", G10A_MED, "rec-10a-mock"),
  ...recordsForClassTask("task-po-hw", G_PULLOUT, "rec-po-hw"),
  taskRecord("rec-10b-arch-39", "task-10b-arch", studentId(39), "completed", 28, TWO_DAYS_AGO),
  taskRecord("rec-10b-arch-40", "task-10b-arch", studentId(40), "completed", 25, TWO_DAYS_AGO),
  taskRecord("rec-10b-arch-41", "task-10b-arch", studentId(41), "missing", null),
];
