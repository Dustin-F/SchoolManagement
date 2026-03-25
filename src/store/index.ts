import { create } from "zustand";
import { nanoid } from "nanoid";
import { migrateStudentTaskRecordsCompletedField, storage } from "@/lib/storage";
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
import {
  seedTeachers,
  seedStudents,
  seedClasses,
  seedSubjects,
  seedAttendance,
  seedBehaviour,
  seedClassTasks,
  seedStudentTaskRecords,
} from "@/data/seed";
import {
  newRecordsForTask,
  removeRecordsForTask,
  removeRecordsForTaskIds,
  syncRecordsAfterRosterChange,
  taskIdsForClass,
} from "@/lib/classTaskSync";

function loadOrSeed<T>(key: string, seed: T[]): T[] {
  const stored = storage.get<T[]>(key);
  if (stored !== null) return stored;
  storage.set(key, seed);
  return seed;
}

function timestamp() {
  return new Date().toISOString();
}

migrateStudentTaskRecordsCompletedField();

interface AppStore {
  teachers: Teacher[];
  students: Student[];
  classes: SchoolClass[];
  subjects: Subject[];
  attendance: AttendanceRecord[];
  behaviour: BehaviourRecord[];
  classTasks: ClassTask[];
  studentTaskRecords: StudentTaskRecord[];

  addTeacher: (data: Omit<Teacher, "id" | "createdAt" | "updatedAt">) => void;
  updateTeacher: (id: string, data: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;

  addStudent: (data: Omit<Student, "id" | "createdAt" | "updatedAt">) => string;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

  addClass: (data: Omit<SchoolClass, "id" | "createdAt" | "updatedAt">) => void;
  updateClass: (id: string, data: Partial<SchoolClass>) => void;
  deleteClass: (id: string) => void;

  addSubject: (data: Omit<Subject, "id" | "createdAt" | "updatedAt">) => void;
  updateSubject: (id: string, data: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  addAttendance: (data: Omit<AttendanceRecord, "id" | "createdAt" | "updatedAt">) => void;
  updateAttendance: (id: string, data: Partial<AttendanceRecord>) => void;

  addBehaviour: (data: Omit<BehaviourRecord, "id" | "createdAt" | "updatedAt">) => void;
  updateBehaviour: (id: string, data: Partial<BehaviourRecord>) => void;
  deleteBehaviour: (id: string) => void;

  setStudentEnrollment: (studentId: string, classIds: string[]) => void;
  enrollStudentInClass: (classId: string, studentId: string) => void;

  addClassTask: (data: Omit<ClassTask, "id" | "createdAt" | "updatedAt">) => void;
  updateClassTask: (id: string, data: Partial<ClassTask>) => void;
  deleteClassTask: (id: string) => void;
  archiveClassTask: (id: string) => void;
  unarchiveClassTask: (id: string) => void;
  updateStudentTaskRecord: (id: string, data: Partial<Omit<StudentTaskRecord, "id" | "taskId" | "studentId">>) => void;

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
  const classCrud = createCrudActions<SchoolClass>("classes", set, (s) => s.classes);
  const subjectCrud = createCrudActions<Subject>("subjects", set, (s) => s.subjects);
  const attendanceCrud = createCrudActions<AttendanceRecord>("attendance", set, (s) => s.attendance);
  const behaviourCrud = createCrudActions<BehaviourRecord>("behaviour", set, (s) => s.behaviour);

  return {
    teachers: loadOrSeed("teachers", seedTeachers),
    students: loadOrSeed("students", seedStudents),
    classes: loadOrSeed("classes", seedClasses),
    subjects: loadOrSeed("subjects", seedSubjects),
    attendance: loadOrSeed("attendance", seedAttendance),
    behaviour: loadOrSeed("behaviour", seedBehaviour),
    classTasks: loadOrSeed("classTasks", seedClassTasks),
    studentTaskRecords: loadOrSeed("studentTaskRecords", seedStudentTaskRecords),

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
    deleteStudent: (id: string) => {
      set((state) => {
        const students = state.students.filter((s) => s.id !== id);
        const classes = state.classes.map((c) =>
          c.studentIds.includes(id)
            ? { ...c, studentIds: c.studentIds.filter((sid) => sid !== id) }
            : c
        );
        const attendance = state.attendance.filter((a) => a.studentId !== id);
        const behaviour = state.behaviour.filter((b) => b.studentId !== id);
        const studentTaskRecords = state.studentTaskRecords.filter((r) => r.studentId !== id);
        storage.set("students", students);
        storage.set("classes", classes);
        storage.set("attendance", attendance);
        storage.set("behaviour", behaviour);
        storage.set("studentTaskRecords", studentTaskRecords);
        return { students, classes, attendance, behaviour, studentTaskRecords };
      });
    },

    addClass: classCrud.add,
    updateClass: (id: string, data: Partial<SchoolClass>) => {
      set((state) => {
        const prev = state.classes.find((c) => c.id === id);
        if (!prev) return {};
        const ts = timestamp();
        const next = { ...prev, ...data, updatedAt: ts };
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
    deleteClass: (id: string) => {
      set((state) => {
        const taskIds = taskIdsForClass(id, state.classTasks);
        const classes = state.classes.filter((c) => c.id !== id);
        const classTasks = state.classTasks.filter((t) => t.classId !== id);
        const studentTaskRecords = removeRecordsForTaskIds(taskIds, state.studentTaskRecords);
        const attendance = state.attendance.filter((a) => a.classId !== id);
        const behaviour = state.behaviour.map((b) =>
          b.classId === id ? { ...b, classId: undefined } : b
        );
        storage.set("classes", classes);
        storage.set("classTasks", classTasks);
        storage.set("studentTaskRecords", studentTaskRecords);
        storage.set("attendance", attendance);
        storage.set("behaviour", behaviour);
        return { classes, classTasks, studentTaskRecords, attendance, behaviour };
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

    addAttendance: attendanceCrud.add,
    updateAttendance: attendanceCrud.update,

    addBehaviour: behaviourCrud.add,
    updateBehaviour: behaviourCrud.update,
    deleteBehaviour: behaviourCrud.delete,

    setStudentEnrollment: (studentId: string, newClassIds: string[]) => {
      set((state) => {
        const ts = timestamp();
        const oldClasses = state.classes;
        const classes = oldClasses.map((c) => {
          const isEnrolled = c.studentIds.includes(studentId);
          const shouldBeEnrolled = newClassIds.includes(c.id);
          if (isEnrolled && !shouldBeEnrolled) {
            return { ...c, studentIds: c.studentIds.filter((sid) => sid !== studentId) };
          }
          if (!isEnrolled && shouldBeEnrolled) {
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
        if (!prev || prev.studentIds.includes(studentId)) return {};
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
        storage.set("classes", classes);
        storage.set("studentTaskRecords", studentTaskRecords);
        return { classes, studentTaskRecords };
      });
    },

    addClassTask: (data) => {
      set((state) => {
        const ts = timestamp();
        const id = nanoid();
        const task: ClassTask = { ...data, archived: data.archived ?? false, id, createdAt: ts, updatedAt: ts };
        const cls = state.classes.find((c) => c.id === data.classId);
        const extra = cls ? newRecordsForTask(id, cls.studentIds, ts) : [];
        const classTasks = [...state.classTasks, task];
        const studentTaskRecords = [...state.studentTaskRecords, ...extra];
        storage.set("classTasks", classTasks);
        storage.set("studentTaskRecords", studentTaskRecords);
        return { classTasks, studentTaskRecords };
      });
    },
    updateClassTask: (id: string, data: Partial<ClassTask>) => {
      set((state) => {
        const classTasks = state.classTasks.map((t) =>
          t.id === id ? { ...t, ...data, updatedAt: timestamp() } : t
        );
        storage.set("classTasks", classTasks);
        return { classTasks };
      });
    },
    deleteClassTask: (id: string) => {
      set((state) => {
        const classTasks = state.classTasks.filter((t) => t.id !== id);
        const studentTaskRecords = removeRecordsForTask(id, state.studentTaskRecords);
        storage.set("classTasks", classTasks);
        storage.set("studentTaskRecords", studentTaskRecords);
        return { classTasks, studentTaskRecords };
      });
    },
    archiveClassTask: (id: string) => {
      set((state) => {
        const classTasks = state.classTasks.map((t) =>
          t.id === id ? { ...t, archived: true, updatedAt: timestamp() } : t
        );
        storage.set("classTasks", classTasks);
        return { classTasks };
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
        storage.set("classTasks", classTasks);
        storage.set("studentTaskRecords", studentTaskRecords);
        return { classTasks, studentTaskRecords };
      });
    },
    updateStudentTaskRecord: (id: string, data) => {
      set((state) => {
        const studentTaskRecords = state.studentTaskRecords.map((r) =>
          r.id === id ? { ...r, ...data, updatedAt: timestamp() } : r
        );
        storage.set("studentTaskRecords", studentTaskRecords);
        return { studentTaskRecords };
      });
    },

    resetToSeed: () => {
      storage.clear();
      set({
        teachers: loadOrSeed("teachers", seedTeachers),
        students: loadOrSeed("students", seedStudents),
        classes: loadOrSeed("classes", seedClasses),
        subjects: loadOrSeed("subjects", seedSubjects),
        attendance: loadOrSeed("attendance", seedAttendance),
        behaviour: loadOrSeed("behaviour", seedBehaviour),
        classTasks: loadOrSeed("classTasks", seedClassTasks),
        studentTaskRecords: loadOrSeed("studentTaskRecords", seedStudentTaskRecords),
      });
    },
  };
});
