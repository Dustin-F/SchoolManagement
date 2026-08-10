import type {
  Teacher,
  Student,
  SchoolClass,
  Subject,
  AttendanceRecord,
  BehaviourSkill,
  PointEvent,
  ClassTask,
  ClassSessionNote,
  StudentTaskRecord,
  StudentTaskStatus,
} from "@/types";
import { toLocalDateString } from "@/lib/utils";
import { migratePeople } from "@/lib/personNames";
import {
  buildSeedTermGrades,
  enrichSeedClassTasks,
  seedAcademicTerms,
  seedTaskAssessmentCategories,
} from "@/data/seedAssessment";
import { SEED_UNIT_9A_DEV, SEED_UNIT_9A_ALG, SEED_UNIT_9B_LIT } from "@/data/seedUnits";

export { seedAcademicTerms, seedTaskAssessmentCategories };
export { seedClassUnits } from "@/data/seedUnits";

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

/** Fixed dates inside seeded academic terms (for report-card demos). */
const S1_WEEK_4 = "2025-10-08";
const S1_WEEK_10 = "2025-11-19";
const S1_WEEK_18 = "2026-01-14";
const S2_WEEK_2 = "2026-02-10";

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

const EXTRA_FOREIGN_NAMES: Array<{ name2: string; name3: string }> = [
  { name2: "陈晨", name3: "Chen Chen" },
  { name2: "林悦", name3: "Lin Yue" },
  { name2: "黄涛", name3: "Huang Tao" },
  { name2: "周婷", name3: "Zhou Ting" },
  { name2: "吴昊", name3: "Wu Hao" },
  { name2: "郑雪", name3: "Zheng Xue" },
  { name2: "孙磊", name3: "Sun Lei" },
  { name2: "马丽", name3: "Ma Li" },
];

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: parts[0] ?? "", last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function names(seed: { name1?: string; name2?: string; name3?: string } = {}) {
  const n1 = splitName(seed.name1 ?? "");
  const n2 = splitName(seed.name2 ?? "");
  const n3 = splitName(seed.name3 ?? "");
  return {
    firstName: n1.first,
    lastName: n1.last,
    name2First: n2.first || undefined,
    name2Last: n2.last || undefined,
    name3First: n3.first || undefined,
    name3Last: n3.last || undefined,
  };
}

function buildExtraStudents(): Student[] {
  const out: Student[] = [];
  for (let n = 25; n <= 72; n++) {
    const i = n - 25;
    const year = 2009 + (i % 4);
    const month = String((i % 12) + 1).padStart(2, "0");
    const day = String((i % 27) + 1).padStart(2, "0");
    const dob = `${year}-${month}-${day}`;

    if (i % 5 === 1) {
      const c = EXTRA_FOREIGN_NAMES[i % EXTRA_FOREIGN_NAMES.length];
      const name2 = splitName(c.name2);
      const name3 = splitName(c.name3);
      out.push(
        ent<Student>(studentId(n), {
          firstName: "",
          lastName: "",
          name2First: name2.first,
          name2Last: name2.last || undefined,
          name3First: name3.first,
          name3Last: name3.last || undefined,
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

export const seedTeachers: Teacher[] = migratePeople([
  ent<Teacher>("tch-sarah", {
    ...names({ name1: "Sarah Johnson" }),
    email: "sarah.johnson@schoolhub.demo",
    phone: "555-0101",
    subjects: ["sub-english", "sub-history"],
  }),
  ent<Teacher>("tch-li", {
    ...names({ name1: "Ming Li", name2: "李明", name3: "Li Ming" }),
    email: "li.ming@schoolhub.demo",
    phone: "555-0102",
    subjects: ["sub-math", "sub-chinese"],
  }),
  ent<Teacher>("tch-mike", {
    ...names({ name1: "Michael Chen", name2: "陈迈克", name3: "Chen Maike" }),
    email: "michael.chen@schoolhub.demo",
    phone: "555-0103",
    subjects: ["sub-science", "sub-ielts"],
  }),
  ent<Teacher>("tch-emma", {
    ...names({ name1: "Emma Williams" }),
    email: "emma.williams@schoolhub.demo",
    phone: "555-0104",
    subjects: ["sub-science", "sub-english"],
  }),
]) as Teacher[];

export const seedStudents: Student[] = migratePeople([
  ent<Student>("stu-01", { ...names({ name1: "James Wilson" }), email: "james.w@demo", dateOfBirth: "2011-03-14", parentName: "Kate Wilson", parentPhone: "555-1001" }),
  ent<Student>("stu-02", { ...names({ name2: "王小明", name3: "Wang Xiaoming" }), dateOfBirth: "2011-07-22", parentName: "王父", parentPhone: "555-1002" }),
  ent<Student>("stu-03", { ...names({ name1: "Emily Chen", name2: "陈艾米", name3: "Chen Aimi" }), email: "emily.c@demo", dateOfBirth: "2011-01-08" }),
  ent<Student>("stu-04", { ...names({ name1: "Oliver Brown" }), dateOfBirth: "2011-11-30", parentName: "Tom Brown" }),
  ent<Student>("stu-05", { ...names({ name2: "李华", name3: "Li Hua" }), dateOfBirth: "2011-05-19", parentPhone: "555-1005" }),
  ent<Student>("stu-06", { ...names({ name1: "Sophia Martinez" }), email: "sophia.m@demo", dateOfBirth: "2011-09-03" }),
  ent<Student>("stu-07", { ...names({ name1: "Noah Taylor" }), dateOfBirth: "2010-04-17", parentName: "Lisa Taylor" }),
  ent<Student>("stu-08", { ...names({ name1: "Ava Anderson", name2: "安德森艾娃" }), dateOfBirth: "2010-12-25" }),
  ent<Student>("stu-09", { ...names({ name2: "张丽", name3: "Zhang Li" }), dateOfBirth: "2010-08-11" }),
  ent<Student>("stu-10", { ...names({ name1: "Ethan Thomas" }), email: "ethan.t@demo", dateOfBirth: "2010-02-28" }),
  ent<Student>("stu-11", { ...names({ name1: "Mia Jackson" }), dateOfBirth: "2010-06-15", parentPhone: "555-1011" }),
  ent<Student>("stu-12", { ...names({ name1: "Lucas White", name2: "卢卡斯", name3: "Lu Kasi" }), dateOfBirth: "2010-10-09" }),
  ent<Student>("stu-13", { ...names({ name1: "Isabella Harris" }), email: "bella.h@demo", dateOfBirth: "2009-03-21" }),
  ent<Student>("stu-14", { ...names({ name2: "刘洋", name3: "Liu Yang" }), dateOfBirth: "2009-07-07", parentName: "刘母" }),
  ent<Student>("stu-15", { ...names({ name1: "William Clark" }), dateOfBirth: "2009-01-13" }),
  ent<Student>("stu-16", { ...names({ name1: "Charlotte Lewis", name2: "夏洛特" }), dateOfBirth: "2009-11-02" }),
  ent<Student>("stu-17", { ...names({ name1: "Benjamin Walker" }), email: "ben.w@demo", dateOfBirth: "2009-05-27" }),
  ent<Student>("stu-18", { ...names({ name1: "Amelia Hall", name3: "Amelia Hall" }), dateOfBirth: "2009-09-18" }),
  ent<Student>("stu-19", { ...names({ name1: "Henry Allen" }), dateOfBirth: "2009-04-05", parentName: "Paul Allen" }),
  ent<Student>("stu-20", { ...names({ name2: "赵敏", name3: "Zhao Min" }), dateOfBirth: "2009-08-29" }),
  ent<Student>("stu-21", { ...names({ name1: "Evelyn Young" }), email: "evelyn.y@demo", dateOfBirth: "2009-12-12" }),
  ent<Student>("stu-22", { ...names({ name1: "Daniel King", name2: "丹尼尔" }), dateOfBirth: "2009-02-14" }),
  ent<Student>("stu-23", { ...names({ name1: "Harper Wright" }), dateOfBirth: "2009-10-31", parentPhone: "555-1023" }),
  ent<Student>("stu-24", { ...names({ name1: "Alexander Scott", name3: "Alexander Scott" }), dateOfBirth: "2009-06-06" }),
  ...buildExtraStudents(),
]) as Student[];

/** 24 students — Year 9 math */
const G9A_LARGE = studentIds(1, 24);
/** 24 students — Year 9 English */
const G9B_LARGE = studentIds(25, 48);
/** 24 students — Year 10 core cohort (IELTS, science, Chinese) */
const G10A_MED = studentIds(27, 50);
/** 24 students — Year 10 IELTS afternoon */
const G10B_LARGE = studentIds(39, 62);
/** 8 students — Year 11 history elective */
const G11_ELECTIVE = studentIds(55, 62);
/** 5 students — pull-out support */
const G_PULLOUT = [studentId(7), studentId(17), studentId(37), studentId(47), studentId(57)];

export const seedClasses: SchoolClass[] = [
  ent<SchoolClass>("cls-9a-math", {
    name: "9A",
    seatColumns: 5,
    classroomNumber: "101",
    subjectId: "sub-math",
    teacherId: "tch-li",
    coTeacherIds: [],
    studentIds: G9A_LARGE,
    pinnedSkillIds: [
      "skill-participation",
      "skill-on-task",
      "skill-excellent",
      "skill-helping",
      "skill-talking",
      "skill-off-task",
    ],
  }),
  ent<SchoolClass>("cls-9b-eng", {
    name: "9B",
    classroomNumber: "102",
    subjectId: "sub-english",
    teacherId: "tch-sarah",
    coTeacherIds: ["tch-emma"],
    studentIds: G9B_LARGE,
    pinnedSkillIds: [
      "skill-participation",
      "skill-kindness",
      "skill-on-task",
      "skill-excellent",
      "skill-talking",
      "skill-late",
    ],
  }),
  ent<SchoolClass>("cls-10a-ielts", {
    name: "10A",
    classroomNumber: "201",
    subjectId: "sub-ielts",
    teacherId: "tch-mike",
    coTeacherIds: [],
    studentIds: G10A_MED,
    pinnedSkillIds: [
      "skill-participation",
      "skill-on-task",
      "skill-excellent",
      "skill-helping",
      "skill-off-task",
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
  }),
  ent<SchoolClass>("cls-10a-sci", {
    name: "10A Science",
    classroomNumber: "Lab 3",
    subjectId: "sub-science",
    teacherId: "tch-emma",
    coTeacherIds: ["tch-mike"],
    studentIds: G10A_MED,
  }),
  ent<SchoolClass>("cls-10a-chi", {
    name: "10A Chinese",
    classroomNumber: "105",
    subjectId: "sub-chinese",
    teacherId: "tch-li",
    coTeacherIds: [],
    studentIds: G10A_MED,
  }),
  ent<SchoolClass>("cls-11-hist", {
    name: "11 History",
    classroomNumber: "301",
    subjectId: "sub-history",
    teacherId: "tch-sarah",
    coTeacherIds: [],
    studentIds: G11_ELECTIVE,
  }),
  ent<SchoolClass>("cls-9-pullout", {
    name: "9 Pull-out IELTS",
    seatColumns: 3,
    classroomNumber: "Support 1",
    subjectId: "sub-ielts",
    teacherId: "tch-mike",
    coTeacherIds: [],
    studentIds: G_PULLOUT,
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
  ...attForRoster("cls-9b-eng", G9B_LARGE, TODAY, "att-9b-t", (i) =>
    i % 9 === 0 ? "absent" : i % 6 === 0 ? "late" : "present"
  ),
  ...attForRoster("cls-9a-math", G9A_LARGE, YESTERDAY, "att-9a-y", (i) =>
    i % 8 === 0 ? "late" : "present"
  ),
  ...attForRoster("cls-9a-math", G9A_LARGE, S1_WEEK_4, "att-9a-s1a", (i) =>
    i % 12 === 0 ? "absent" : i % 5 === 0 ? "late" : "present"
  ),
  ...attForRoster("cls-9a-math", G9A_LARGE, S1_WEEK_10, "att-9a-s1b", (i) =>
    i % 10 === 0 ? "excused" : i % 6 === 0 ? "late" : "present"
  ),
  ...attForRoster("cls-9a-math", G9A_LARGE, S1_WEEK_18, "att-9a-s1c", (i) =>
    i % 9 === 0 ? "absent" : "present"
  ),
  ...attForRoster("cls-9b-eng", G9B_LARGE, S1_WEEK_4, "att-9b-s1a", (i) =>
    i % 8 === 0 ? "late" : "present"
  ),
  ...attForRoster("cls-9b-eng", G9B_LARGE, S1_WEEK_10, "att-9b-s1b", (i) =>
    i % 11 === 0 ? "absent" : "present"
  ),
  ...attForRoster("cls-9b-eng", G9B_LARGE, S2_WEEK_2, "att-9b-s2a", (i) =>
    i % 7 === 0 ? "late" : "present"
  ),
  ...attForRoster("cls-10a-sci", G10A_MED, TODAY, "att-10sci-t", (i) =>
    i % 10 === 0 ? "absent" : "present"
  ),
  ...attForRoster("cls-10a-chi", G10A_MED.slice(0, 16), TODAY, "att-10chi-t", (i) =>
    i % 7 === 0 ? "late" : "present"
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
    parentDescription: "Participated actively in class discussion",
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
    type: "negative",
    active: true,
    sortOrder: 6,
  }),
  ent<BehaviourSkill>("skill-off-task", {
    name: "Off task",
    emoji: "📵",
    points: -1,
    type: "negative",
    active: true,
    sortOrder: 7,
  }),
  ent<BehaviourSkill>("skill-late", {
    name: "Late",
    emoji: "⏰",
    points: -1,
    type: "negative",
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

const POINT_SKILLS_POS = ["skill-participation", "skill-helping", "skill-on-task", "skill-excellent", "skill-kindness"] as const;
const POINT_SKILLS_NEG = ["skill-talking", "skill-off-task", "skill-late"] as const;

const SKILL_POINTS: Record<string, number> = {
  "skill-participation": 1,
  "skill-helping": 1,
  "skill-on-task": 1,
  "skill-excellent": 2,
  "skill-kindness": 1,
  "skill-talking": -1,
  "skill-off-task": -1,
  "skill-late": -1,
};

const POINT_EVENT_NOTES = [
  "Excellent problem-solving on the board.",
  "Led group discussion confidently.",
  "Helped a classmate understand the task.",
  "Stayed focused through the whole lesson.",
  "Outstanding homework submission.",
  "Showed kindness when a peer was stuck.",
  "Talking during silent work.",
  "Phone out during instruction.",
  "Arrived late after break.",
];

function buildSeedPointEvents(): PointEvent[] {
  const events: PointEvent[] = [];
  let n = 0;

  const classRosters: Array<{ classId: string; roster: string[] }> = [
    { classId: "cls-9a-math", roster: G9A_LARGE },
    { classId: "cls-9b-eng", roster: G9B_LARGE },
    { classId: "cls-10a-ielts", roster: G10A_MED },
    { classId: "cls-10b-ielts", roster: G10B_LARGE },
    { classId: "cls-10a-sci", roster: G10A_MED },
    { classId: "cls-10a-chi", roster: G10A_MED },
    { classId: "cls-11-hist", roster: G11_ELECTIVE },
    { classId: "cls-9-pullout", roster: G_PULLOUT },
  ];

  const s1Dates = [S1_WEEK_4, S1_WEEK_10, S1_WEEK_18];
  const s2Dates = [S2_WEEK_2, TODAY, YESTERDAY, TWO_DAYS_AGO];

  const pushEvent = (
    studentId: string,
    classId: string,
    date: string,
    i: number,
    j: number
  ) => {
    const useNegative = (i + j) % 9 === 0;
    const skillId = useNegative
      ? POINT_SKILLS_NEG[(i + j) % POINT_SKILLS_NEG.length]
      : POINT_SKILLS_POS[(i + j) % POINT_SKILLS_POS.length];
    const withNote = (i + j) % 3 === 0;
    events.push(
      pt(`pt-${n++}`, {
        studentId,
        skillId,
        classId,
        date,
        points: SKILL_POINTS[skillId],
        ...(withNote ? { note: POINT_EVENT_NOTES[(i + j) % POINT_EVENT_NOTES.length] } : {}),
      })
    );
  };

  for (const { classId, roster } of classRosters) {
    roster.forEach((studentId, i) => {
      const s1Count = 2 + (i % 2);
      for (let j = 0; j < s1Count; j++) {
        pushEvent(studentId, classId, s1Dates[j % s1Dates.length], i, j);
      }
      const s2Count = 1 + (i % 2);
      for (let j = 0; j < s2Count; j++) {
        pushEvent(studentId, classId, s2Dates[j % s2Dates.length], i, j + 10);
      }
    });
  }

  return events;
}

export const seedPointEvents: PointEvent[] = buildSeedPointEvents();

const DEFAULT_LETTERS = [
  { letter: "A", minPercent: 90 },
  { letter: "B", minPercent: 80 },
  { letter: "C", minPercent: 70 },
  { letter: "D", minPercent: 60 },
  { letter: "F", minPercent: 0 },
];

const RAW_CLASS_TASKS: ClassTask[] = [
  // —— 9A Math (6 tasks) ——
  ent<ClassTask>("task-9a-hw1", {
    classId: "cls-9a-math",
    title: "Linear equations worksheet",
    type: "worksheet",
    description: "Complete exercises 1–20.",
    deadline: NEXT_WEEK,
    scoreMode: "points",
    maxScore: 20,
    unitId: SEED_UNIT_9A_DEV,
  }),
  ent<ClassTask>("task-9a-quiz", {
    classId: "cls-9a-math",
    title: "Algebra checkpoint quiz",
    type: "quiz",
    deadline: TODAY,
    scoreMode: "points",
    maxScore: 15,
    unitId: SEED_UNIT_9A_DEV,
    publishedToStudents: true,
    publishedAt: SEED_TIME,
  }),
  ent<ClassTask>("task-9a-hw2", {
    classId: "cls-9a-math",
    title: "Graphing linear functions",
    type: "homework",
    deadline: IN_TWO_WEEKS,
    scoreMode: "points",
    maxScore: 25,
    letterGrades: DEFAULT_LETTERS,
    unitId: SEED_UNIT_9A_ALG,
  }),
  ent<ClassTask>("task-9a-proj", {
    classId: "cls-9a-math",
    title: "Real-world modelling project",
    type: "project",
    description: "Use linear models on a dataset of your choice.",
    instructions: "Submit a 2-page report with graph, equation, and interpretation.",
    deadline: IN_TWO_WEEKS,
    scoreMode: "rubric",
    rubric: [
      { id: "rub-9a-data", label: "Data & graph", maxPoints: 15 },
      { id: "rub-9a-model", label: "Model & equation", maxPoints: 20 },
      { id: "rub-9a-write", label: "Written explanation", maxPoints: 15 },
    ],
    letterGrades: DEFAULT_LETTERS,
    unitId: SEED_UNIT_9A_ALG,
    publishedToStudents: true,
    publishedAt: SEED_TIME,
  }),
  ent<ClassTask>("task-9a-exam", {
    classId: "cls-9a-math",
    title: "Unit 4 test",
    type: "exam",
    deadline: NEXT_WEEK,
    scoreMode: "percentage",
    letterGrades: DEFAULT_LETTERS,
    unitId: SEED_UNIT_9A_ALG,
  }),
  ent<ClassTask>("task-9a-arch", {
    classId: "cls-9a-math",
    title: "Term 1 diagnostic",
    type: "exam",
    deadline: TWO_DAYS_AGO,
    scoreMode: "points",
    maxScore: 30,
    archived: true,
  }),
  // —— 9B English (5 tasks) ——
  ent<ClassTask>("task-9b-essay", {
    classId: "cls-9b-eng",
    title: "Persuasive essay draft",
    type: "essay",
    description: "First draft on an assigned social issue.",
    instructions:
      "800–1000 words. Thesis, three arguments, counter-argument, conclusion.",
    deadline: IN_TWO_WEEKS,
    scoreMode: "percentage",
    letterGrades: DEFAULT_LETTERS,
    unitId: SEED_UNIT_9B_LIT,
    publishedToStudents: true,
    publishedAt: SEED_TIME,
  }),
  ent<ClassTask>("task-9b-reading", {
    classId: "cls-9b-eng",
    title: "Reading log week 6",
    type: "homework",
    deadline: NEXT_WEEK,
    scoreMode: "points",
    maxScore: 10,
    unitId: SEED_UNIT_9B_LIT,
  }),
  ent<ClassTask>("task-9b-quiz", {
    classId: "cls-9b-eng",
    title: "Literary devices quiz",
    type: "quiz",
    deadline: TODAY,
    scoreMode: "points",
    maxScore: 20,
  }),
  ent<ClassTask>("task-9b-pres", {
    classId: "cls-9b-eng",
    title: "Book talk presentation",
    type: "presentation",
    deadline: IN_TWO_WEEKS,
    scoreMode: "rubric",
    rubric: [
      { id: "rub-9b-content", label: "Content", maxPoints: 20 },
      { id: "rub-9b-delivery", label: "Delivery", maxPoints: 15 },
      { id: "rub-9b-visual", label: "Visual aids", maxPoints: 5 },
    ],
  }),
  ent<ClassTask>("task-9b-vocab", {
    classId: "cls-9b-eng",
    title: "Vocabulary unit test",
    type: "exam",
    deadline: NEXT_WEEK,
    scoreMode: "percentage",
  }),
  // —— 10A IELTS (6 tasks) ——
  ent<ClassTask>("task-10a-mock", {
    classId: "cls-10a-ielts",
    title: "Speaking mock exam",
    type: "exam",
    description: "Parts 1–3 under timed conditions.",
    deadline: NEXT_WEEK,
    scoreMode: "points",
    maxScore: 9,
  }),
  ent<ClassTask>("task-10a-hw1", {
    classId: "cls-10a-ielts",
    title: "Cue card preparation",
    type: "homework",
    deadline: NEXT_WEEK,
    scoreMode: "points",
    maxScore: 10,
  }),
  ent<ClassTask>("task-10a-quiz", {
    classId: "cls-10a-ielts",
    title: "Pronunciation & intonation",
    type: "quiz",
    deadline: TODAY,
    scoreMode: "percentage",
    letterGrades: DEFAULT_LETTERS,
  }),
  ent<ClassTask>("task-10a-part2", {
    classId: "cls-10a-ielts",
    title: "Part 2 long turn",
    type: "presentation",
    deadline: IN_TWO_WEEKS,
    scoreMode: "rubric",
    rubric: [
      { id: "rub-10a-fluency", label: "Fluency", maxPoints: 25 },
      { id: "rub-10a-lexis", label: "Vocabulary", maxPoints: 25 },
      { id: "rub-10a-gram", label: "Grammar", maxPoints: 25 },
      { id: "rub-10a-pron", label: "Pronunciation", maxPoints: 25 },
    ],
  }),
  ent<ClassTask>("task-10a-listen", {
    classId: "cls-10a-ielts",
    title: "Listening practice set",
    type: "worksheet",
    deadline: NEXT_WEEK,
    scoreMode: "points",
    maxScore: 40,
  }),
  ent<ClassTask>("task-10a-arch", {
    classId: "cls-10a-ielts",
    title: "September placement test",
    type: "exam",
    deadline: TWO_DAYS_AGO,
    scoreMode: "percentage",
    archived: true,
  }),
  // —— 10B IELTS (7 tasks) ——
  ent<ClassTask>("task-10b-hw1", {
    classId: "cls-10b-ielts",
    title: "Cue card preparation",
    type: "homework",
    description: "Prepare 2-minute response.",
    deadline: NEXT_WEEK,
    scoreMode: "points",
    maxScore: 10,
  }),
  ent<ClassTask>("task-10b-quiz", {
    classId: "cls-10b-ielts",
    title: "Fluency & coherence quiz",
    type: "quiz",
    deadline: TODAY,
    scoreMode: "percentage",
    letterGrades: DEFAULT_LETTERS,
  }),
  ent<ClassTask>("task-10b-proj", {
    classId: "cls-10b-ielts",
    title: "Group presentation",
    type: "presentation",
    description: "Social issue — 5 minutes per group.",
    deadline: IN_TWO_WEEKS,
    scoreMode: "points",
    maxScore: 50,
  }),
  ent<ClassTask>("task-10b-mock", {
    classId: "cls-10b-ielts",
    title: "Full speaking mock",
    type: "exam",
    deadline: IN_TWO_WEEKS,
    scoreMode: "rubric",
    rubric: [
      { id: "rub-10b-p1", label: "Part 1", maxPoints: 20 },
      { id: "rub-10b-p2", label: "Part 2", maxPoints: 30 },
      { id: "rub-10b-p3", label: "Part 3", maxPoints: 30 },
    ],
    letterGrades: DEFAULT_LETTERS,
  }),
  ent<ClassTask>("task-10b-hw2", {
    classId: "cls-10b-ielts",
    title: "Collocation workbook",
    type: "worksheet",
    deadline: NEXT_WEEK,
    scoreMode: "points",
    maxScore: 15,
  }),
  ent<ClassTask>("task-10b-vocab", {
    classId: "cls-10b-ielts",
    title: "Topic vocabulary test",
    type: "quiz",
    deadline: NEXT_WEEK,
    scoreMode: "percentage",
  }),
  ent<ClassTask>("task-10b-arch", {
    classId: "cls-10b-ielts",
    title: "Term 1 vocabulary test",
    type: "exam",
    deadline: TWO_DAYS_AGO,
    scoreMode: "points",
    maxScore: 30,
    archived: true,
  }),
  // —— 10A Science (5 tasks) ——
  ent<ClassTask>("task-10a-sci-lab", {
    classId: "cls-10a-sci",
    title: "Chemistry lab report",
    type: "project",
    deadline: IN_TWO_WEEKS,
    scoreMode: "rubric",
    rubric: [
      { id: "rub-hyp", label: "Hypothesis", maxPoints: 10 },
      { id: "rub-method", label: "Method", maxPoints: 10 },
      { id: "rub-results", label: "Results", maxPoints: 15 },
      { id: "rub-conc", label: "Conclusion", maxPoints: 5 },
    ],
    letterGrades: DEFAULT_LETTERS,
  }),
  ent<ClassTask>("task-10a-sci-quiz", {
    classId: "cls-10a-sci",
    title: "Acids & bases quiz",
    type: "quiz",
    deadline: TODAY,
    scoreMode: "points",
    maxScore: 20,
  }),
  ent<ClassTask>("task-10a-sci-hw", {
    classId: "cls-10a-sci",
    title: "Reaction equations practice",
    type: "homework",
    deadline: NEXT_WEEK,
    scoreMode: "points",
    maxScore: 15,
  }),
  ent<ClassTask>("task-10a-sci-test", {
    classId: "cls-10a-sci",
    title: "Chemistry unit test",
    type: "exam",
    deadline: IN_TWO_WEEKS,
    scoreMode: "percentage",
    letterGrades: DEFAULT_LETTERS,
  }),
  ent<ClassTask>("task-10a-sci-proj", {
    classId: "cls-10a-sci",
    title: "Science fair poster",
    type: "project",
    deadline: IN_TWO_WEEKS,
    scoreMode: "rubric",
    rubric: [
      { id: "rub-sci-research", label: "Research", maxPoints: 20 },
      { id: "rub-sci-poster", label: "Poster design", maxPoints: 15 },
      { id: "rub-sci-oral", label: "Oral explanation", maxPoints: 15 },
    ],
  }),
  // —— 10A Chinese (4 tasks) ——
  ent<ClassTask>("task-10a-chi-hw", {
    classId: "cls-10a-chi",
    title: "Character writing practice",
    type: "homework",
    deadline: NEXT_WEEK,
    scoreMode: "points",
    maxScore: 20,
  }),
  ent<ClassTask>("task-10a-chi-quiz", {
    classId: "cls-10a-chi",
    title: "Unit 3 vocabulary",
    type: "quiz",
    deadline: TODAY,
    scoreMode: "points",
    maxScore: 25,
  }),
  ent<ClassTask>("task-10a-chi-essay", {
    classId: "cls-10a-chi",
    title: "Composition — my hometown",
    type: "essay",
    deadline: IN_TWO_WEEKS,
    scoreMode: "percentage",
    letterGrades: DEFAULT_LETTERS,
  }),
  ent<ClassTask>("task-10a-chi-oral", {
    classId: "cls-10a-chi",
    title: "Oral presentation",
    type: "presentation",
    deadline: IN_TWO_WEEKS,
    scoreMode: "rubric",
    rubric: [
      { id: "rub-chi-pron", label: "Pronunciation", maxPoints: 15 },
      { id: "rub-chi-fluency", label: "Fluency", maxPoints: 15 },
      { id: "rub-chi-content", label: "Content", maxPoints: 20 },
    ],
  }),
  // —— 11 History (3 tasks) ——
  ent<ClassTask>("task-11-hist-essay", {
    classId: "cls-11-hist",
    title: "Source analysis essay",
    type: "essay",
    deadline: IN_TWO_WEEKS,
    scoreMode: "percentage",
    letterGrades: DEFAULT_LETTERS,
  }),
  ent<ClassTask>("task-11-hist-quiz", {
    classId: "cls-11-hist",
    title: "Cold War timeline quiz",
    type: "quiz",
    deadline: NEXT_WEEK,
    scoreMode: "points",
    maxScore: 15,
  }),
  ent<ClassTask>("task-11-hist-debate", {
    classId: "cls-11-hist",
    title: "Class debate prep",
    type: "project",
    deadline: NEXT_WEEK,
    scoreMode: "points",
    maxScore: 20,
  }),
  // —— Pull-out (3 tasks) ——
  ent<ClassTask>("task-po-hw", {
    classId: "cls-9-pullout",
    title: "Cue card practice",
    type: "homework",
    description: "Record a 1-minute response at home.",
    deadline: NEXT_WEEK,
    scoreMode: "points",
    maxScore: 10,
  }),
  ent<ClassTask>("task-po-mock", {
    classId: "cls-9-pullout",
    title: "Mini speaking mock",
    type: "exam",
    deadline: NEXT_WEEK,
    scoreMode: "percentage",
  }),
  ent<ClassTask>("task-po-flash", {
    classId: "cls-9-pullout",
    title: "Flashcard review",
    type: "worksheet",
    deadline: TODAY,
    scoreMode: "points",
    maxScore: 5,
  }),
];

export const seedClassTasks: ClassTask[] = enrichSeedClassTasks(RAW_CLASS_TASKS);

function letterForPercent(percent: number, bands: { letter: string; minPercent: number }[]): string {
  const sorted = [...bands].sort((a, b) => b.minPercent - a.minPercent);
  for (const band of sorted) {
    if (percent >= band.minPercent) return band.letter;
  }
  return sorted[sorted.length - 1]?.letter ?? "F";
}

function seededStatus(taskId: string, index: number): StudentTaskStatus {
  const hash = (taskId.charCodeAt(taskId.length - 1) + index) % 10;
  if (hash <= 5) return "completed";
  if (hash <= 7) return "in_progress";
  if (hash === 8) return "missing";
  return "not_started";
}

function seededScores(
  task: ClassTask,
  index: number,
  status: StudentTaskStatus
): Pick<StudentTaskRecord, "score" | "letterGrade" | "criterionScores"> {
  if (status === "not_started" || status === "missing") {
    return { score: null, letterGrade: null };
  }

  const pct = 0.52 + (index % 9) * 0.05;
  const partial = status === "in_progress" ? 0.65 : 1;

  if (task.scoreMode === "rubric" && task.rubric?.length) {
    const criterionScores: Record<string, number> = {};
    let total = 0;
    const rubricMax = task.rubric.reduce((s, c) => s + (c.maxPoints ?? 0), 0);
    for (const c of task.rubric) {
      const max = c.maxPoints ?? 10;
      const val = Math.min(max, Math.round(max * pct * partial * 10) / 10);
      criterionScores[c.id] = val;
      total += val;
    }
    const score = Math.min(rubricMax, Math.round(total * 10) / 10);
    const max = task.rubric.reduce((s, c) => s + (c.maxPoints ?? 0), 0);
    const letter =
      task.letterGrades?.length && max > 0
        ? letterForPercent((score / max) * 100, task.letterGrades)
        : null;
    return { score, criterionScores, letterGrade: letter };
  }

  if (task.scoreMode === "percentage") {
    const score = Math.min(100, Math.round(100 * pct * partial));
    const letter = task.letterGrades?.length
      ? letterForPercent(score, task.letterGrades)
      : null;
    return { score, letterGrade: letter };
  }

  const max = task.maxScore ?? 20;
  const score = Math.min(max, Math.round(max * pct * partial * 10) / 10);
  const letter =
    task.letterGrades?.length && max > 0
      ? letterForPercent((score / max) * 100, task.letterGrades)
      : null;
  return { score, letterGrade: letter };
}

function buildAllTaskRecords(
  tasks: ClassTask[],
  classes: SchoolClass[]
): StudentTaskRecord[] {
  const records: StudentTaskRecord[] = [];
  for (const task of tasks) {
    const cls = classes.find((c) => c.id === task.classId);
    if (!cls) continue;
    for (let i = 0; i < cls.studentIds.length; i++) {
      const studentId = cls.studentIds[i];
      const status = seededStatus(task.id, i);
      const scores = seededScores(task, i, status);
      records.push({
        id: `rec-${task.id}-${studentId}`,
        taskId: task.id,
        studentId,
        status,
        score: scores.score,
        letterGrade: scores.letterGrade ?? undefined,
        criterionScores: scores.criterionScores,
        feedback: status === "completed" ? "Solid effort — keep it up." : undefined,
        submittedAt: status === "completed" ? YESTERDAY : status === "in_progress" ? null : null,
        updatedAt: SEED_TIME,
      });
    }
  }
  return records;
}

export const seedStudentTaskRecords: StudentTaskRecord[] = buildAllTaskRecords(
  seedClassTasks,
  seedClasses
);

export const seedClassSessionNotes: ClassSessionNote[] = [
  ent<ClassSessionNote>("note-9a-today", {
    classId: "cls-9a-math",
    date: TODAY,
    status: "in_progress",
    title: "Linear equations review",
    content: `Warm-up (5 min)
• Quick mental math — solving for x

Main (35 min)
• Board demo: balance method
• Pair work: worksheet p.42 #1–8
• Plenary: two students on board

Homework
• p.43 #9–15`,
  }),
  ent<ClassSessionNote>("note-9b-today", {
    classId: "cls-9b-eng",
    date: TODAY,
    status: "in_progress",
    title: "Persuasive techniques",
    content: "Review ethos/pathos/logos. Start essay planning in pairs.",
  }),
  ent<ClassSessionNote>("note-10b-today", {
    classId: "cls-10b-ielts",
    date: TODAY,
    status: "in_progress",
    title: "Part 2 cue cards",
    content: "Model answer + timed practice rotations. Focus on extending answers.",
  }),
  ent<ClassSessionNote>("note-10sci-today", {
    classId: "cls-10a-sci",
    date: TODAY,
    status: "in_progress",
    title: "Titration practical",
    content: "Safety briefing. Groups collect data for lab report task.",
  }),
];

export const seedTermGrades = buildSeedTermGrades(
  seedClasses,
  seedClassTasks,
  seedStudentTaskRecords,
  seedTaskAssessmentCategories
);
