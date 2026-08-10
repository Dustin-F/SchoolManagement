import { create } from "zustand";
import { nanoid } from "nanoid";
import { connectCloudPersistence, storage } from "@/lib/storage";
import type {
  Teacher,
  Student,
  SchoolClass,
  Subject,
  AttendanceRecord,
  BehaviourSkill,
  PointEvent,
  ClassTask,
  ClassUnit,
  ClassSessionNote,
  ClassScheduleEvent,
  ClassSessionException,
  StudentTaskRecord,
  AcademicTerm,
  TaskAssessmentCategory,
  TermGrade,
  ScheduleEditScope,
  AppData,
  SchoolGradingSettings,
  MissingGradePolicy,
  LetterGradeBand,
} from "@/types";
import {
  seedTeachers,
  seedStudents,
  seedClasses,
  seedSubjects,
  seedAttendance,
  seedBehaviourSkills,
  seedPointEvents,
  seedClassTasks,
  seedStudentTaskRecords,
  seedClassSessionNotes,
  seedAcademicTerms,
  seedTaskAssessmentCategories,
  seedTermGrades,
} from "@/data/seed";
import {
  newRecordsForTask,
  removeRecordsForTask,
  removeRecordsForTaskIds,
  syncRecordsAfterRosterChange,
  taskIdsForClass,
} from "@/lib/classTaskSync";
import { removeStudentFromClassRoster } from "@/lib/archiveUtils";
import { orderStudentIdsByGrid } from "@/lib/seatingUtils";
import { getDefaultTermId } from "@/lib/assessmentUtils";
import {
  DEFAULT_SCHOOL_GRADING_SETTINGS_ID,
  getTermLetterBands,
  letterForTermPercent,
  normalizeTermGrade,
  postTermGradeFromRunning,
  termGradeKey,
  unpostTermGrade,
} from "@/lib/termGradeUtils";
import { normalizeSchoolGradingSettings } from "@/lib/gradingPolicy";
import { normalizeClassTask } from "@/lib/taskScoringUtils";
import { migratePeople } from "@/lib/personNames";
import {
  normalizeClassTasks,
  recalcAfterTaskMetaChange,
  recalcAfterTaskRecordChange,
  recalcAllTermGrades,
  recalcForClassStudent,
  recalcTermGradesForClassTerm,
} from "@/store/termGradeSync";
import { seedSchoolGradingSettings } from "@/data/seedAssessment";
import { seedClassUnits } from "@/data/seedUnits";
import {
  applyFreshSeedToStorage,
  isSeedVersionStale,
} from "@/data/seedBootstrap";
import { bootstrapScheduleState } from "@/store/scheduleBootstrap";
import { applyScheduleEdit } from "@/lib/scheduleEditUtils";
import type { ScheduleEventFormData } from "@/lib/schemas";

function normalizeClassTasksWithTerms(tasks: ClassTask[], terms: AcademicTerm[]): ClassTask[] {
  return normalizeClassTasks(tasks, getDefaultTermId(terms));
}

/** Legacy skills used `needs_work` before it was renamed to `negative`. */
function normalizeBehaviourSkills(skills: BehaviourSkill[]): BehaviourSkill[] {
  return skills.map((s) =>
    (s.type as string) === "needs_work" ? { ...s, type: "negative" } : s
  );
}

function loadOrSeed<T>(key: string, seed: T[]): T[] {
  const stored = storage.get<T[]>(key);
  if (stored !== null) return stored;
  storage.set(key, seed);
  return seed;
}

/** Re-seed when local storage has an empty array (e.g. feature added after first visit). */
function loadOrSeedIfEmpty<T>(key: string, seed: T[]): T[] {
  const stored = storage.get<T[]>(key);
  if (stored !== null && stored.length > 0) return stored;
  storage.set(key, seed);
  return seed;
}

function timestamp() {
  return new Date().toISOString();
}

/** Prefer cloud data when present; empty cloud arrays keep local seed/demo data. */
function mergeCloudCollection<T>(cloud: T[] | undefined, local: T[]): T[] {
  if (cloud !== undefined && cloud.length > 0) return cloud;
  return local;
}

interface AppStore {
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

  addTeacher: (data: Omit<Teacher, "id" | "createdAt" | "updatedAt">) => void;
  updateTeacher: (id: string, data: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;

  addStudent: (data: Omit<Student, "id" | "createdAt" | "updatedAt">) => string;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  archiveStudent: (id: string) => void;
  restoreStudent: (id: string) => void;

  addClass: (data: Omit<SchoolClass, "id" | "createdAt" | "updatedAt">) => string;
  updateClass: (id: string, data: Partial<SchoolClass>) => void;
  deleteClass: (id: string) => void;
  archiveClass: (id: string) => void;
  restoreClass: (id: string) => void;

  addSubject: (data: Omit<Subject, "id" | "createdAt" | "updatedAt">) => void;
  updateSubject: (id: string, data: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  addAttendance: (data: Omit<AttendanceRecord, "id" | "createdAt" | "updatedAt">) => string;
  updateAttendance: (id: string, data: Partial<AttendanceRecord>) => void;
  deleteAttendance: (id: string) => void;

  addBehaviourSkill: (data: Omit<BehaviourSkill, "id" | "createdAt" | "updatedAt">) => void;
  updateBehaviourSkill: (id: string, data: Partial<BehaviourSkill>) => void;
  deleteBehaviourSkill: (id: string) => void;

  addPointEvent: (data: Omit<PointEvent, "id" | "createdAt">) => string;
  deletePointEvent: (id: string) => void;

  setStudentEnrollment: (studentId: string, classIds: string[]) => void;
  enrollStudentInClass: (classId: string, studentId: string) => void;

  addClassTask: (data: Omit<ClassTask, "id" | "createdAt" | "updatedAt">) => string;
  updateClassTask: (id: string, data: Partial<ClassTask>) => void;
  deleteClassTask: (id: string) => void;
  archiveClassTask: (id: string) => void;
  unarchiveClassTask: (id: string) => void;
  setTaskPublished: (taskId: string, published: boolean) => void;
  updateStudentTaskRecord: (id: string, data: Partial<Omit<StudentTaskRecord, "id" | "taskId" | "studentId">>) => void;

  addClassUnit: (data: Omit<ClassUnit, "id" | "createdAt" | "updatedAt">) => string;
  updateClassUnit: (id: string, data: Partial<ClassUnit>) => void;
  deleteClassUnit: (id: string) => void;

  addAcademicTerm: (data: Omit<AcademicTerm, "id" | "createdAt" | "updatedAt">) => void;
  updateAcademicTerm: (id: string, data: Partial<AcademicTerm>) => void;
  deleteAcademicTerm: (id: string) => void;

  addTaskAssessmentCategory: (data: Omit<TaskAssessmentCategory, "id" | "createdAt" | "updatedAt">) => void;
  updateTaskAssessmentCategory: (id: string, data: Partial<TaskAssessmentCategory>) => void;
  deleteTaskAssessmentCategory: (id: string) => void;

  updateTermGradeComment: (
    studentId: string,
    classId: string,
    termId: string,
    comment: string | undefined
  ) => void;
  postTermGrade: (
    studentId: string,
    classId: string,
    termId: string,
    override?: { postedPercent?: number | null; postedLetter?: string | null }
  ) => void;
  postAllTermGrades: (classId: string, termId: string, studentIds?: string[]) => void;
  unpostTermGradeForStudent: (studentId: string, classId: string, termId: string) => void;
  updatePostedTermGrade: (
    studentId: string,
    classId: string,
    termId: string,
    data: { postedPercent?: number | null; postedLetter?: string | null; comment?: string }
  ) => void;
  recalculateClassTermGrades: (classId: string, termId: string) => void;
  updateSchoolGradingSettings: (data: {
    termLetterBands?: LetterGradeBand[];
    missingPolicy?: MissingGradePolicy;
  }) => void;

  upsertClassSessionNote: (
    classId: string,
    date: string,
    data: { title?: string; content: string; eventId?: string; occurrenceDate?: string }
  ) => void;
  upsertClassSession: (
    classId: string,
    date: string,
    data?: Partial<
      Pick<
        ClassSessionNote,
        | "eventId"
        | "occurrenceDate"
        | "status"
        | "startedAt"
        | "completedAt"
        | "cancelledAt"
        | "cancelledReason"
        | "lessonPrepared"
      >
    >
  ) => void;

  addScheduleEvent: (classId: string, data: ScheduleEventFormData) => void;
  updateScheduleEvent: (
    eventId: string,
    data: ScheduleEventFormData,
    scope?: ScheduleEditScope,
    occurrenceDate?: string
  ) => void;
  deleteScheduleEvent: (
    eventId: string,
    scope?: ScheduleEditScope,
    occurrenceDate?: string
  ) => void;

  hydrateFromCloud: (payload: Partial<{
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
  }>) => void;
  resetToSeed: () => void;
}

function createCrudActions<T extends { id: string }>(
  key: string,
  set: (fn: (state: AppStore) => Partial<AppStore>) => void,
  getField: (state: AppStore) => T[]
) {
  return {
    add: (data: Omit<T, "id" | "createdAt" | "updatedAt">) => {
      const now = timestamp();
      const item = { ...data, id: nanoid(), createdAt: now, updatedAt: now } as unknown as T;
      set((state) => {
        const updated = [...getField(state), item];
        storage.set(key, updated);
        return { [key]: updated } as Partial<AppStore>;
      });
    },
    update: (id: string, data: Partial<T>) => {
      set((state) => {
        const updated = getField(state).map((item) =>
          item.id === id ? { ...item, ...data, updatedAt: timestamp() } : item
        );
        storage.set(key, updated);
        return { [key]: updated } as Partial<AppStore>;
      });
    },
    delete: (id: string) => {
      set((state) => {
        const updated = getField(state).filter((item) => item.id !== id);
        storage.set(key, updated);
        return { [key]: updated } as Partial<AppStore>;
      });
    },
  };
}

export const useAppStore = create<AppStore>((set) => {
  const teacherCrud = createCrudActions<Teacher>("teachers", set, (s) => s.teachers);
  const subjectCrud = createCrudActions<Subject>("subjects", set, (s) => s.subjects);
  const attendanceCrud = createCrudActions<AttendanceRecord>("attendance", set, (s) => s.attendance);
  const behaviourSkillCrud = createCrudActions<BehaviourSkill>(
    "behaviourSkills",
    set,
    (s) => s.behaviourSkills
  );
  const termCrud = createCrudActions<AcademicTerm>("academicTerms", set, (s) => s.academicTerms);

  const bootTs = timestamp();
  if (typeof window !== "undefined" && isSeedVersionStale()) {
    applyFreshSeedToStorage(bootTs);
  }

  const loadedTerms = loadOrSeed("academicTerms", seedAcademicTerms);
  const rawClasses = loadOrSeed("classes", seedClasses);
  const rawNotes = loadOrSeed("classSessionNotes", seedClassSessionNotes);
  const scheduleBoot = bootstrapScheduleState(rawClasses, rawNotes, bootTs);

  return {
    teachers: migratePeople(loadOrSeed("teachers", seedTeachers)),
    students: migratePeople(loadOrSeed("students", seedStudents)),
    classes: scheduleBoot.classes,
    subjects: loadOrSeed("subjects", seedSubjects),
    attendance: loadOrSeed("attendance", seedAttendance),
    behaviourSkills: normalizeBehaviourSkills(
      loadOrSeedIfEmpty("behaviourSkills", seedBehaviourSkills)
    ),
    pointEvents: loadOrSeedIfEmpty("pointEvents", seedPointEvents),
    classTasks: normalizeClassTasksWithTerms(
      loadOrSeed("classTasks", seedClassTasks),
      loadedTerms
    ),
    classUnits: loadOrSeedIfEmpty("classUnits", seedClassUnits),
    studentTaskRecords: loadOrSeed("studentTaskRecords", seedStudentTaskRecords),
    classSessionNotes: scheduleBoot.classSessionNotes,
    classScheduleEvents: scheduleBoot.classScheduleEvents,
    classSessionExceptions: scheduleBoot.classSessionExceptions,
    academicTerms: loadedTerms,
    taskAssessmentCategories: loadOrSeed(
      "taskAssessmentCategories",
      seedTaskAssessmentCategories
    ),
    termGrades: loadOrSeed("termGrades", seedTermGrades),
    schoolGradingSettings: loadOrSeedIfEmpty(
      "schoolGradingSettings",
      normalizeSchoolGradingSettings(seedSchoolGradingSettings)
    ),

    addTeacher: teacherCrud.add,
    updateTeacher: teacherCrud.update,
    deleteTeacher: (id: string) => {
      set((state) => {
        const teachers = state.teachers.filter((t) => t.id !== id);
        const classes = state.classes.map((c) => {
          let updated = c;
          if (c.teacherId === id) updated = { ...updated, teacherId: "" };
          if (c.coTeacherIds.includes(id))
            updated = { ...updated, coTeacherIds: c.coTeacherIds.filter((tid) => tid !== id) };
          return updated;
        });
        storage.set("teachers", teachers);
        storage.set("classes", classes);
        return { teachers, classes };
      });
    },

    addStudent: (data): string => {
      const now = timestamp();
      const id = nanoid();
      const item: Student = { ...data, id, createdAt: now, updatedAt: now };
      set((state) => {
        const students = [...state.students, item];
        storage.set("students", students);
        return { students };
      });
      return id;
    },
    updateStudent: (id: string, data: Partial<Student>) => {
      set((state) => {
        const students = state.students.map((s) =>
          s.id === id ? { ...s, ...data, updatedAt: timestamp() } : s
        );
        storage.set("students", students);
        return { students };
      });
    },
    archiveStudent: (id: string) => {
      set((state) => {
        const ts = timestamp();
        const students = state.students.map((s) =>
          s.id === id ? { ...s, archived: true, updatedAt: ts } : s
        );
        const classes = state.classes.map((c) => {
          const roster = removeStudentFromClassRoster(c, id);
          if (roster.studentIds === c.studentIds && roster.seatGrid === c.seatGrid) return c;
          return { ...c, ...roster, updatedAt: ts };
        });
        storage.set("students", students);
        storage.set("classes", classes);
        return { students, classes };
      });
    },
    restoreStudent: (id: string) => {
      set((state) => {
        const students = state.students.map((s) =>
          s.id === id ? { ...s, archived: false, updatedAt: timestamp() } : s
        );
        storage.set("students", students);
        return { students };
      });
    },
    deleteStudent: (id: string) => {
      set((state) => {
        const students = state.students.filter((s) => s.id !== id);
        const classes = state.classes.map((c) => {
          const roster = removeStudentFromClassRoster(c, id);
          if (roster.studentIds === c.studentIds && roster.seatGrid === c.seatGrid) return c;
          return { ...c, ...roster };
        });
        const attendance = state.attendance.filter((a) => a.studentId !== id);
        const pointEvents = state.pointEvents.filter((e) => e.studentId !== id);
        const studentTaskRecords = state.studentTaskRecords.filter((r) => r.studentId !== id);
        const termGrades = state.termGrades.filter((g) => g.studentId !== id);
        storage.set("students", students);
        storage.set("classes", classes);
        storage.set("attendance", attendance);
        storage.set("pointEvents", pointEvents);
        storage.set("studentTaskRecords", studentTaskRecords);
        storage.set("termGrades", termGrades);
        return { students, classes, attendance, pointEvents, studentTaskRecords, termGrades };
      });
    },

    addClass: (data) => {
      const now = timestamp();
      const id = nanoid();
      const item: SchoolClass = { ...data, id, createdAt: now, updatedAt: now };
      set((state) => {
        const classes = [...state.classes, item];
        storage.set("classes", classes);
        return { classes };
      });
      return id;
    },
    updateClass: (id: string, data: Partial<SchoolClass>) => {
      set((state) => {
        const prev = state.classes.find((c) => c.id === id);
        if (!prev) return {};
        const ts = timestamp();
        let next = { ...prev, ...data, updatedAt: ts };
        if (data.seatGrid !== undefined) {
          next = {
            ...next,
            studentIds: orderStudentIdsByGrid(prev.studentIds, data.seatGrid),
          };
        }
        let studentTaskRecords = state.studentTaskRecords;
        if (data.studentIds !== undefined) {
          studentTaskRecords = syncRecordsAfterRosterChange(
            id,
            prev.studentIds,
            next.studentIds,
            state.classTasks,
            studentTaskRecords,
            ts
          );
        }
        const classes = state.classes.map((c) => (c.id === id ? next : c));
        storage.set("classes", classes);
        storage.set("studentTaskRecords", studentTaskRecords);
        return { classes, studentTaskRecords };
      });
    },
    archiveClass: (id: string) => {
      set((state) => {
        const classes = state.classes.map((c) =>
          c.id === id ? { ...c, archived: true, updatedAt: timestamp() } : c
        );
        storage.set("classes", classes);
        return { classes };
      });
    },
    restoreClass: (id: string) => {
      set((state) => {
        const classes = state.classes.map((c) =>
          c.id === id ? { ...c, archived: false, updatedAt: timestamp() } : c
        );
        storage.set("classes", classes);
        return { classes };
      });
    },
    deleteClass: (id: string) => {
      set((state) => {
        const taskIds = taskIdsForClass(id, state.classTasks);
        const classes = state.classes.filter((c) => c.id !== id);
        const classTasks = state.classTasks.filter((t) => t.classId !== id);
        const classUnits = state.classUnits.filter((u) => u.classId !== id);
        const studentTaskRecords = removeRecordsForTaskIds(taskIds, state.studentTaskRecords);
        const attendance = state.attendance.filter((a) => a.classId !== id);
        const pointEvents = state.pointEvents.filter((e) => e.classId !== id);
        const classSessionNotes = state.classSessionNotes.filter((n) => n.classId !== id);
        const classScheduleEvents = state.classScheduleEvents.filter((e) => e.classId !== id);
        const classSessionExceptions = state.classSessionExceptions.filter((e) => e.classId !== id);
        storage.set("classes", classes);
        storage.set("classTasks", classTasks);
        storage.set("classUnits", classUnits);
        storage.set("studentTaskRecords", studentTaskRecords);
        storage.set("attendance", attendance);
        storage.set("pointEvents", pointEvents);
        storage.set("classSessionNotes", classSessionNotes);
        storage.set("classScheduleEvents", classScheduleEvents);
        storage.set("classSessionExceptions", classSessionExceptions);
        return {
          classes,
          classTasks,
          classUnits,
          studentTaskRecords,
          attendance,
          pointEvents,
          classSessionNotes,
          classScheduleEvents,
          classSessionExceptions,
        };
      });
    },

    addSubject: subjectCrud.add,
    updateSubject: subjectCrud.update,
    deleteSubject: (id: string) => {
      set((state) => {
        const subjects = state.subjects.filter((s) => s.id !== id);
        const classes = state.classes.map((c) =>
          c.subjectId === id ? { ...c, subjectId: "" } : c
        );
        storage.set("subjects", subjects);
        storage.set("classes", classes);
        return { subjects, classes };
      });
    },

    addAttendance: (data) => {
      const id = nanoid();
      const now = timestamp();
      const item: AttendanceRecord = { ...data, id, createdAt: now, updatedAt: now };
      set((state) => {
        const attendance = [...state.attendance, item];
        storage.set("attendance", attendance);
        return { attendance };
      });
      return id;
    },
    updateAttendance: attendanceCrud.update,
    deleteAttendance: attendanceCrud.delete,

    addBehaviourSkill: behaviourSkillCrud.add,
    updateBehaviourSkill: behaviourSkillCrud.update,
    deleteBehaviourSkill: (id: string) => {
      set((state) => {
        const behaviourSkills = state.behaviourSkills.map((s) =>
          s.id === id ? { ...s, active: false, updatedAt: timestamp() } : s
        );
        storage.set("behaviourSkills", behaviourSkills);
        return { behaviourSkills };
      });
    },

    addPointEvent: (data) => {
      const id = nanoid();
      const item: PointEvent = { ...data, id, createdAt: timestamp() };
      set((state) => {
        const pointEvents = [...state.pointEvents, item];
        storage.set("pointEvents", pointEvents);
        return { pointEvents };
      });
      return id;
    },
    deletePointEvent: (id: string) => {
      set((state) => {
        const pointEvents = state.pointEvents.filter((e) => e.id !== id);
        storage.set("pointEvents", pointEvents);
        return { pointEvents };
      });
    },

    setStudentEnrollment: (studentId: string, newClassIds: string[]) => {
      set((state) => {
        const ts = timestamp();
        const oldClasses = state.classes;
        const student = state.students.find((s) => s.id === studentId);
        const classes = oldClasses.map((c) => {
          const isEnrolled = c.studentIds.includes(studentId);
          const shouldBeEnrolled = newClassIds.includes(c.id);
          if (isEnrolled && !shouldBeEnrolled) {
            return { ...c, studentIds: c.studentIds.filter((sid) => sid !== studentId) };
          }
          if (!isEnrolled && shouldBeEnrolled && !c.archived && !student?.archived) {
            return { ...c, studentIds: [...c.studentIds, studentId] };
          }
          return c;
        });

        let studentTaskRecords = state.studentTaskRecords;
        for (const oldC of oldClasses) {
          const newC = classes.find((x) => x.id === oldC.id);
          if (!newC) continue;
          const a = [...oldC.studentIds].sort().join(",");
          const b = [...newC.studentIds].sort().join(",");
          if (a !== b) {
            studentTaskRecords = syncRecordsAfterRosterChange(
              oldC.id,
              oldC.studentIds,
              newC.studentIds,
              state.classTasks,
              studentTaskRecords,
              ts
            );
          }
        }

        storage.set("classes", classes);
        storage.set("studentTaskRecords", studentTaskRecords);
        return { classes, studentTaskRecords };
      });
    },

    enrollStudentInClass: (classId: string, studentId: string) => {
      set((state) => {
        const prev = state.classes.find((c) => c.id === classId);
        const student = state.students.find((s) => s.id === studentId);
        if (!prev || prev.archived || student?.archived) return {};
        if (prev.studentIds.includes(studentId)) return {};
        const ts = timestamp();
        const next = { ...prev, studentIds: [...prev.studentIds, studentId], updatedAt: ts };
        const studentTaskRecords = syncRecordsAfterRosterChange(
          classId,
          prev.studentIds,
          next.studentIds,
          state.classTasks,
          state.studentTaskRecords,
          ts
        );
        const classes = state.classes.map((c) => (c.id === classId ? next : c));
        let termGrades = recalcForClassStudent(classId, studentId, {
          ...state,
          classes,
          studentTaskRecords,
        });
        storage.set("classes", classes);
        storage.set("studentTaskRecords", studentTaskRecords);
        storage.set("termGrades", termGrades);
        return { classes, studentTaskRecords, termGrades };
      });
    },

    addClassTask: (data) => {
      const ts = timestamp();
      const id = nanoid();
      const task: ClassTask = normalizeClassTasksWithTerms(
        [
          normalizeClassTask({
            ...data,
            archived: data.archived ?? false,
            assessmentRole: data.assessmentRole ?? "summative",
            id,
            createdAt: ts,
            updatedAt: ts,
          }),
        ],
        useAppStore.getState().academicTerms
      )[0]!;
      set((state) => {
        const cls = state.classes.find((c) => c.id === data.classId);
        const extra = cls ? newRecordsForTask(id, cls.studentIds, ts) : [];
        const classTasks = [...state.classTasks, task];
        const studentTaskRecords = [...state.studentTaskRecords, ...extra];
        let termGrades = state.termGrades;
        if (cls && task.termId && task.assessmentRole !== "formative") {
          termGrades = recalcTermGradesForClassTerm(
            cls,
            task.termId,
            classTasks,
            studentTaskRecords,
            state.taskAssessmentCategories,
            termGrades,
            state.schoolGradingSettings
          );
        }
        storage.set("classTasks", classTasks);
        storage.set("studentTaskRecords", studentTaskRecords);
        storage.set("termGrades", termGrades);
        return { classTasks, studentTaskRecords, termGrades };
      });
      return id;
    },
    updateClassTask: (id: string, data: Partial<ClassTask>) => {
      set((state) => {
        const classTasks = state.classTasks.map((t) =>
          t.id === id
            ? normalizeClassTasksWithTerms(
                [normalizeClassTask({ ...t, ...data, updatedAt: timestamp() })],
                state.academicTerms
              )[0]!
            : t
        );
        const task = classTasks.find((t) => t.id === id);
        let termGrades = state.termGrades;
        if (task) {
          termGrades = recalcAfterTaskMetaChange(task, {
            ...state,
            classTasks,
          });
        }
        storage.set("classTasks", classTasks);
        storage.set("termGrades", termGrades);
        return { classTasks, termGrades };
      });
    },
    deleteClassTask: (id: string) => {
      set((state) => {
        const task = state.classTasks.find((t) => t.id === id);
        const classTasks = state.classTasks.filter((t) => t.id !== id);
        const studentTaskRecords = removeRecordsForTask(id, state.studentTaskRecords);
        let termGrades = state.termGrades;
        if (task?.termId && task.assessmentRole !== "formative") {
          const cls = state.classes.find((c) => c.id === task.classId);
          if (cls) {
            termGrades = recalcTermGradesForClassTerm(
              cls,
              task.termId,
              classTasks,
              studentTaskRecords,
              state.taskAssessmentCategories,
              termGrades,
              state.schoolGradingSettings
            );
          }
        }
        storage.set("classTasks", classTasks);
        storage.set("studentTaskRecords", studentTaskRecords);
        storage.set("termGrades", termGrades);
        return { classTasks, studentTaskRecords, termGrades };
      });
    },
    archiveClassTask: (id: string) => {
      set((state) => {
        const classTasks = state.classTasks.map((t) =>
          t.id === id ? { ...t, archived: true, updatedAt: timestamp() } : t
        );
        const task = classTasks.find((t) => t.id === id);
        let termGrades = state.termGrades;
        if (task) {
          termGrades = recalcAfterTaskMetaChange(task, {
            ...state,
            classTasks,
          });
        }
        storage.set("classTasks", classTasks);
        storage.set("termGrades", termGrades);
        return { classTasks, termGrades };
      });
    },
    unarchiveClassTask: (id: string) => {
      set((state) => {
        const task = state.classTasks.find((t) => t.id === id);
        if (!task) return {};
        const ts = timestamp();
        const classTasks = state.classTasks.map((t) =>
          t.id === id ? { ...t, archived: false, updatedAt: ts } : t
        );
        const cls = state.classes.find((c) => c.id === task.classId);
        let studentTaskRecords = state.studentTaskRecords;
        if (cls?.studentIds.length) {
          const missing = cls.studentIds.filter(
            (sid) => !studentTaskRecords.some((r) => r.taskId === id && r.studentId === sid)
          );
          if (missing.length) {
            studentTaskRecords = [...studentTaskRecords, ...newRecordsForTask(id, missing, ts)];
          }
        }
        const updatedTask = classTasks.find((t) => t.id === id);
        let termGrades = state.termGrades;
        if (updatedTask) {
          termGrades = recalcAfterTaskMetaChange(updatedTask, {
            ...state,
            classTasks,
            studentTaskRecords,
          });
        }
        storage.set("classTasks", classTasks);
        storage.set("studentTaskRecords", studentTaskRecords);
        storage.set("termGrades", termGrades);
        return { classTasks, studentTaskRecords, termGrades };
      });
    },
    setTaskPublished: (taskId: string, published: boolean) => {
      set((state) => {
        const ts = timestamp();
        const classTasks = state.classTasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                publishedToStudents: published,
                publishedAt: published ? ts : undefined,
                updatedAt: ts,
              }
            : t
        );
        storage.set("classTasks", classTasks);
        return { classTasks };
      });
    },

    addClassUnit: (data) => {
      const ts = timestamp();
      const id = nanoid();
      const unit: ClassUnit = { ...data, id, createdAt: ts, updatedAt: ts };
      set((state) => {
        const classUnits = [...state.classUnits, unit];
        storage.set("classUnits", classUnits);
        return { classUnits };
      });
      return id;
    },
    updateClassUnit: (id: string, data: Partial<ClassUnit>) => {
      set((state) => {
        const classUnits = state.classUnits.map((u) =>
          u.id === id ? { ...u, ...data, updatedAt: timestamp() } : u
        );
        storage.set("classUnits", classUnits);
        return { classUnits };
      });
    },
    deleteClassUnit: (id: string) => {
      set((state) => {
        const classUnits = state.classUnits.filter((u) => u.id !== id);
        const classTasks = state.classTasks.map((t) =>
          t.unitId === id ? { ...t, unitId: undefined, updatedAt: timestamp() } : t
        );
        storage.set("classUnits", classUnits);
        storage.set("classTasks", classTasks);
        return { classUnits, classTasks };
      });
    },

    updateStudentTaskRecord: (id: string, data) => {
      set((state) => {
        const prev = state.studentTaskRecords.find((r) => r.id === id);
        let patch = { ...data };
        if (patch.status === "missing" || patch.status === "excused") {
          patch = {
            ...patch,
            score: null,
            letterGrade: null,
            criterionScores: undefined,
          };
        }
        const studentTaskRecords = state.studentTaskRecords.map((r) =>
          r.id === id ? { ...r, ...patch, updatedAt: timestamp() } : r
        );
        const record = studentTaskRecords.find((r) => r.id === id);
        const task = record ? state.classTasks.find((t) => t.id === record.taskId) : undefined;
        let termGrades = state.termGrades;
        if (record && task && prev) {
          termGrades = recalcAfterTaskRecordChange(record, task, {
            ...state,
            studentTaskRecords,
          });
        }
        storage.set("studentTaskRecords", studentTaskRecords);
        storage.set("termGrades", termGrades);
        return { studentTaskRecords, termGrades };
      });
    },

    addAcademicTerm: termCrud.add,
    updateAcademicTerm: termCrud.update,
    deleteAcademicTerm: termCrud.delete,

    addTaskAssessmentCategory: (data) => {
      set((state) => {
        const now = timestamp();
        const item: TaskAssessmentCategory = {
          ...data,
          id: nanoid(),
          createdAt: now,
          updatedAt: now,
        };
        const taskAssessmentCategories = [...state.taskAssessmentCategories, item];
        const nextState = { ...state, taskAssessmentCategories };
        const termGrades = recalcAllTermGrades(nextState);
        storage.set("taskAssessmentCategories", taskAssessmentCategories);
        storage.set("termGrades", termGrades);
        return { taskAssessmentCategories, termGrades };
      });
    },
    updateTaskAssessmentCategory: (id, data) => {
      set((state) => {
        const taskAssessmentCategories = state.taskAssessmentCategories.map((item) =>
          item.id === id ? { ...item, ...data, updatedAt: timestamp() } : item
        );
        const nextState = { ...state, taskAssessmentCategories };
        const termGrades = recalcAllTermGrades(nextState);
        storage.set("taskAssessmentCategories", taskAssessmentCategories);
        storage.set("termGrades", termGrades);
        return { taskAssessmentCategories, termGrades };
      });
    },
    deleteTaskAssessmentCategory: (id) => {
      set((state) => {
        const taskAssessmentCategories = state.taskAssessmentCategories.filter(
          (item) => item.id !== id
        );
        const nextState = { ...state, taskAssessmentCategories };
        const termGrades = recalcAllTermGrades(nextState);
        storage.set("taskAssessmentCategories", taskAssessmentCategories);
        storage.set("termGrades", termGrades);
        return { taskAssessmentCategories, termGrades };
      });
    },

    updateTermGradeComment: (studentId, classId, termId, comment) => {
      set((state) => {
        const key = termGradeKey(studentId, classId, termId);
        const ts = timestamp();
        const existing = state.termGrades.find((g) => g.id === key);
        const next = normalizeTermGrade({
          id: key,
          studentId,
          classId,
          termId,
          calculatedPercent: existing?.calculatedPercent ?? null,
          calculatedLetter: existing?.calculatedLetter ?? null,
          postedPercent: existing?.postedPercent ?? null,
          postedLetter: existing?.postedLetter ?? null,
          postStatus: existing?.postStatus ?? "draft",
          postedAt: existing?.postedAt ?? null,
          comment,
          createdAt: existing?.createdAt ?? ts,
          updatedAt: ts,
        });
        const termGrades = existing
          ? state.termGrades.map((g) => (g.id === key ? next : g))
          : [...state.termGrades, next];
        storage.set("termGrades", termGrades);
        return { termGrades };
      });
    },

    postTermGrade: (studentId, classId, termId, override) => {
      set((state) => {
        const key = termGradeKey(studentId, classId, termId);
        const bands = getTermLetterBands(state.schoolGradingSettings);
        const cls = state.classes.find((c) => c.id === classId);
        let grade = state.termGrades.find((g) => g.id === key);
        if (!grade && cls) {
          grade = recalcTermGradesForClassTerm(
            cls,
            termId,
            state.classTasks,
            state.studentTaskRecords,
            state.taskAssessmentCategories,
            state.termGrades,
            state.schoolGradingSettings,
            [studentId]
          ).find((g) => g.studentId === studentId);
        }
        if (!grade) return {};
        const next = postTermGradeFromRunning(normalizeTermGrade(grade), bands, override);
        const termGrades = state.termGrades.some((g) => g.id === key)
          ? state.termGrades.map((g) => (g.id === key ? next : g))
          : [...state.termGrades, next];
        storage.set("termGrades", termGrades);
        return { termGrades };
      });
    },

    postAllTermGrades: (classId, termId, studentIds) => {
      set((state) => {
        const cls = state.classes.find((c) => c.id === classId);
        if (!cls) return {};
        const bands = getTermLetterBands(state.schoolGradingSettings);
        const targets = studentIds ?? cls.studentIds;
        let termGrades = recalcTermGradesForClassTerm(
          cls,
          termId,
          state.classTasks,
          state.studentTaskRecords,
          state.taskAssessmentCategories,
          state.termGrades,
          state.schoolGradingSettings,
          targets
        );
        for (const studentId of targets) {
          const key = termGradeKey(studentId, classId, termId);
          const grade = termGrades.find((g) => g.id === key);
          if (!grade || grade.calculatedPercent == null) continue;
          const posted = postTermGradeFromRunning(normalizeTermGrade(grade), bands);
          termGrades = termGrades.map((g) => (g.id === key ? posted : g));
        }
        storage.set("termGrades", termGrades);
        return { termGrades };
      });
    },

    unpostTermGradeForStudent: (studentId, classId, termId) => {
      set((state) => {
        const key = termGradeKey(studentId, classId, termId);
        const existing = state.termGrades.find((g) => g.id === key);
        if (!existing) return {};
        const next = unpostTermGrade(existing);
        const termGrades = state.termGrades.map((g) => (g.id === key ? next : g));
        storage.set("termGrades", termGrades);
        return { termGrades };
      });
    },

    updatePostedTermGrade: (studentId, classId, termId, data) => {
      set((state) => {
        const key = termGradeKey(studentId, classId, termId);
        const existing = state.termGrades.find((g) => g.id === key);
        if (!existing) return {};
        const g = normalizeTermGrade(existing);
        const bands = getTermLetterBands(state.schoolGradingSettings);
        const postedPercent =
          data.postedPercent !== undefined ? data.postedPercent : g.postedPercent;
        let postedLetter =
          data.postedLetter !== undefined ? data.postedLetter : g.postedLetter;
        if (data.postedPercent !== undefined && data.postedLetter === undefined) {
          postedLetter =
            postedPercent != null ? letterForTermPercent(postedPercent, bands) : null;
        }
        const next: TermGrade = {
          ...g,
          postedPercent,
          postedLetter: postedLetter?.trim() ? postedLetter.trim() : null,
          comment: data.comment !== undefined ? data.comment : g.comment,
          postStatus: "posted",
          postedAt: g.postedAt ?? timestamp(),
          updatedAt: timestamp(),
        };
        const termGrades = state.termGrades.map((item) => (item.id === key ? next : item));
        storage.set("termGrades", termGrades);
        return { termGrades };
      });
    },

    recalculateClassTermGrades: (classId, termId) => {
      set((state) => {
        const cls = state.classes.find((c) => c.id === classId);
        if (!cls) return {};
        const termGrades = recalcTermGradesForClassTerm(
          cls,
          termId,
          state.classTasks,
          state.studentTaskRecords,
          state.taskAssessmentCategories,
          state.termGrades,
          state.schoolGradingSettings
        );
        storage.set("termGrades", termGrades);
        return { termGrades };
      });
    },

    updateSchoolGradingSettings: (data) => {
      set((state) => {
        const ts = timestamp();
        const existing =
          state.schoolGradingSettings.find((s) => s.id === DEFAULT_SCHOOL_GRADING_SETTINGS_ID) ??
          state.schoolGradingSettings[0];
        const nextSettings: SchoolGradingSettings = normalizeSchoolGradingSettings([
          existing
            ? {
                ...existing,
                termLetterBands: data.termLetterBands ?? existing.termLetterBands,
                missingPolicy: data.missingPolicy ?? existing.missingPolicy,
                updatedAt: ts,
              }
            : {
                id: DEFAULT_SCHOOL_GRADING_SETTINGS_ID,
                termLetterBands: data.termLetterBands ?? [],
                missingPolicy: data.missingPolicy ?? "count_as_zero",
                createdAt: ts,
                updatedAt: ts,
              },
        ])[0]!;
        const schoolGradingSettings = existing
          ? state.schoolGradingSettings.map((s) => (s.id === existing.id ? nextSettings : s))
          : [...state.schoolGradingSettings, nextSettings];
        const nextState = { ...state, schoolGradingSettings };
        const termGrades = recalcAllTermGrades(nextState);
        storage.set("schoolGradingSettings", schoolGradingSettings);
        storage.set("termGrades", termGrades);
        return { schoolGradingSettings, termGrades };
      });
    },

    upsertClassSessionNote: (classId, date, data) => {
      set((state) => {
        const ts = timestamp();
        const title = data.title?.trim() || undefined;
        const content = data.content.trim();
        const existing = state.classSessionNotes.find((n) => {
          if (data.eventId) {
            const occ = data.occurrenceDate ?? date;
            return (
              n.classId === classId &&
              n.eventId === data.eventId &&
              (n.occurrenceDate ?? n.date) === occ
            );
          }
          return n.classId === classId && n.date === date && !n.eventId;
        });

        if (existing) {
          const classSessionNotes = state.classSessionNotes.map((n) =>
            n.id === existing.id
              ? {
                  ...n,
                  title,
                  content,
                  eventId: data.eventId ?? n.eventId,
                  occurrenceDate: data.occurrenceDate ?? n.occurrenceDate ?? date,
                  updatedAt: ts,
                }
              : n
          );
          storage.set("classSessionNotes", classSessionNotes);
          return { classSessionNotes };
        }

        const item: ClassSessionNote = {
          id: nanoid(),
          classId,
          date,
          eventId: data.eventId,
          occurrenceDate: data.occurrenceDate ?? date,
          status: "planned",
          title,
          content,
          createdAt: ts,
          updatedAt: ts,
        };
        const classSessionNotes = [...state.classSessionNotes, item];
        storage.set("classSessionNotes", classSessionNotes);
        return { classSessionNotes };
      });
    },

    upsertClassSession: (classId, date, data = {}) => {
      set((state) => {
        const ts = timestamp();
        const existing = state.classSessionNotes.find((n) => {
          if (data.eventId) {
            const occ = data.occurrenceDate ?? date;
            return (
              n.classId === classId &&
              n.eventId === data.eventId &&
              (n.occurrenceDate ?? n.date) === occ
            );
          }
          return n.classId === classId && n.date === date && !n.eventId;
        });
        if (existing) {
          const classSessionNotes = state.classSessionNotes.map((n) =>
            n.id === existing.id
              ? {
                  ...n,
                  ...data,
                  date,
                  occurrenceDate: data.occurrenceDate ?? n.occurrenceDate ?? date,
                  status: data.status ?? n.status ?? "planned",
                  updatedAt: ts,
                }
              : n
          );
          storage.set("classSessionNotes", classSessionNotes);
          return { classSessionNotes };
        }

        const item: ClassSessionNote = {
          id: nanoid(),
          classId,
          date,
          eventId: data.eventId,
          occurrenceDate: data.occurrenceDate ?? date,
          title: undefined,
          content: "",
          status: data.status ?? "planned",
          startedAt: data.startedAt,
          completedAt: data.completedAt,
          cancelledAt: data.cancelledAt,
          cancelledReason: data.cancelledReason,
          lessonPrepared: data.lessonPrepared,
          createdAt: ts,
          updatedAt: ts,
        };
        const classSessionNotes = [...state.classSessionNotes, item];
        storage.set("classSessionNotes", classSessionNotes);
        return { classSessionNotes };
      });
    },

    addScheduleEvent: (classId, data) => {
      set((state) => {
        const ts = timestamp();
        const item: ClassScheduleEvent = {
          id: nanoid(),
          classId,
          title: data.title,
          startDate: data.startDate,
          startTime: data.startTime,
          endTime: data.endTime,
          recurrence: data.recurrence,
          createdAt: ts,
          updatedAt: ts,
        };
        const classScheduleEvents = [...state.classScheduleEvents, item];
        storage.set("classScheduleEvents", classScheduleEvents);
        return { classScheduleEvents };
      });
    },

    updateScheduleEvent: (eventId, data, scope = "series", occurrenceDate) => {
      set((state) => {
        const ts = timestamp();
        const target = state.classScheduleEvents.find((e) => e.id === eventId);
        if (!target) return {};
        const { events, exceptions } = applyScheduleEdit(
          state.classScheduleEvents,
          state.classSessionExceptions,
          eventId,
          scope,
          occurrenceDate,
          data,
          ts,
          target.classId
        );
        storage.set("classScheduleEvents", events);
        storage.set("classSessionExceptions", exceptions);
        return { classScheduleEvents: events, classSessionExceptions: exceptions };
      });
    },

    deleteScheduleEvent: (eventId, scope = "series", occurrenceDate) => {
      set((state) => {
        const ts = timestamp();
        const target = state.classScheduleEvents.find((e) => e.id === eventId);
        if (!target) return {};
        const { events, exceptions } = applyScheduleEdit(
          state.classScheduleEvents,
          state.classSessionExceptions,
          eventId,
          scope,
          occurrenceDate,
          null,
          ts,
          target.classId
        );
        storage.set("classScheduleEvents", events);
        storage.set("classSessionExceptions", exceptions);
        return { classScheduleEvents: events, classSessionExceptions: exceptions };
      });
    },

    hydrateFromCloud: (payload) => {
      set((state) => {
        const academicTerms = mergeCloudCollection(
          payload.academicTerms,
          state.academicTerms
        );
        const next = {
          teachers: migratePeople(
            mergeCloudCollection(payload.teachers, state.teachers)
          ),
          students: migratePeople(
            mergeCloudCollection(payload.students, state.students)
          ),
          classes: mergeCloudCollection(payload.classes, state.classes),
          subjects: mergeCloudCollection(payload.subjects, state.subjects),
          attendance: mergeCloudCollection(payload.attendance, state.attendance),
          behaviourSkills: normalizeBehaviourSkills(
            mergeCloudCollection(payload.behaviourSkills, state.behaviourSkills)
          ),
          pointEvents: mergeCloudCollection(payload.pointEvents, state.pointEvents),
          classTasks: normalizeClassTasksWithTerms(
            mergeCloudCollection(payload.classTasks, state.classTasks),
            academicTerms
          ),
          classUnits: mergeCloudCollection(payload.classUnits, state.classUnits),
          studentTaskRecords: mergeCloudCollection(
            payload.studentTaskRecords,
            state.studentTaskRecords
          ),
          classSessionNotes: mergeCloudCollection(
            payload.classSessionNotes,
            state.classSessionNotes
          ),
          classScheduleEvents: mergeCloudCollection(
            payload.classScheduleEvents,
            state.classScheduleEvents
          ),
          classSessionExceptions: mergeCloudCollection(
            payload.classSessionExceptions,
            state.classSessionExceptions
          ),
          academicTerms,
          taskAssessmentCategories: mergeCloudCollection(
            payload.taskAssessmentCategories,
            state.taskAssessmentCategories
          ),
          termGrades: mergeCloudCollection(payload.termGrades, state.termGrades),
          schoolGradingSettings: mergeCloudCollection(
            payload.schoolGradingSettings,
            state.schoolGradingSettings
          ),
        };

        // Keep in-memory storage aligned when we kept local seed over empty cloud tables.
        (Object.keys(payload) as (keyof AppData)[]).forEach((key) => {
          const cloudValue = payload[key];
          const merged = next[key as keyof typeof next];
          if (
            Array.isArray(cloudValue) &&
            cloudValue.length === 0 &&
            Array.isArray(merged) &&
            merged.length > 0
          ) {
            storage.set(key, merged);
          }
        });

        return next;
      });
    },

    resetToSeed: () => {
      const next = applyFreshSeedToStorage(timestamp());
      set(next);
    },
  };
});

connectCloudPersistence(() => {
  const s = useAppStore.getState();
  return {
    teachers: s.teachers,
    students: s.students,
    classes: s.classes,
    subjects: s.subjects,
    attendance: s.attendance,
    behaviourSkills: s.behaviourSkills,
    pointEvents: s.pointEvents,
    classTasks: s.classTasks,
    classUnits: s.classUnits,
    studentTaskRecords: s.studentTaskRecords,
    classSessionNotes: s.classSessionNotes,
    classScheduleEvents: s.classScheduleEvents,
    classSessionExceptions: s.classSessionExceptions,
    academicTerms: s.academicTerms,
    taskAssessmentCategories: s.taskAssessmentCategories,
    termGrades: s.termGrades,
    schoolGradingSettings: s.schoolGradingSettings,
  };
});
