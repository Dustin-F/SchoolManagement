import { migratePeople } from "@/lib/personNames";
import { getDefaultTermId } from "@/lib/assessmentUtils";
import { normalizeSchoolGradingSettings } from "@/lib/gradingPolicy";
import { normalizeClassTasks } from "@/store/termGradeSync";
import { bootstrapScheduleState } from "@/store/scheduleBootstrap";
import { seedSessionExceptions } from "@/data/seedSchedule";
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
import { seedClassUnits } from "@/data/seedUnits";
import { seedSchoolGradingSettings } from "@/data/seedAssessment";
import { storage } from "@/lib/storage";
import type { AppData } from "@/types";

/** Bump when seed shape or demo content changes — triggers a local reseed on next load. */
export const SEED_DATA_VERSION = 7;

const SEED_VERSION_KEY = "app_seed_data_version";

export type FreshSeedState = {
  teachers: AppData["teachers"];
  students: AppData["students"];
  classes: AppData["classes"];
  subjects: AppData["subjects"];
  attendance: AppData["attendance"];
  behaviourSkills: AppData["behaviourSkills"];
  pointEvents: AppData["pointEvents"];
  classTasks: AppData["classTasks"];
  classUnits: AppData["classUnits"];
  studentTaskRecords: AppData["studentTaskRecords"];
  classSessionNotes: AppData["classSessionNotes"];
  classScheduleEvents: AppData["classScheduleEvents"];
  classSessionExceptions: AppData["classSessionExceptions"];
  academicTerms: AppData["academicTerms"];
  taskAssessmentCategories: AppData["taskAssessmentCategories"];
  termGrades: AppData["termGrades"];
  schoolGradingSettings: AppData["schoolGradingSettings"];
};

export function isSeedVersionStale(): boolean {
  try {
    return localStorage.getItem(SEED_VERSION_KEY) !== String(SEED_DATA_VERSION);
  } catch {
    return false;
  }
}

export function markSeedVersionApplied(): void {
  try {
    localStorage.setItem(SEED_VERSION_KEY, String(SEED_DATA_VERSION));
  } catch {
    // ignore private mode
  }
}

export function buildFreshSeedState(bootTs?: string): FreshSeedState {
  const ts = bootTs ?? new Date().toISOString();
  const scheduleBoot = bootstrapScheduleState(seedClasses, seedClassSessionNotes, ts);
  const defaultTermId = getDefaultTermId(seedAcademicTerms);

  return {
    teachers: migratePeople(seedTeachers),
    students: migratePeople(seedStudents),
    classes: scheduleBoot.classes,
    subjects: seedSubjects,
    attendance: seedAttendance,
    behaviourSkills: seedBehaviourSkills,
    pointEvents: seedPointEvents,
    classTasks: normalizeClassTasks(seedClassTasks, defaultTermId),
    classUnits: seedClassUnits,
    studentTaskRecords: seedStudentTaskRecords,
    classSessionNotes: scheduleBoot.classSessionNotes,
    classScheduleEvents: scheduleBoot.classScheduleEvents,
    classSessionExceptions: seedSessionExceptions,
    academicTerms: seedAcademicTerms,
    taskAssessmentCategories: seedTaskAssessmentCategories,
    termGrades: seedTermGrades,
    schoolGradingSettings: normalizeSchoolGradingSettings(seedSchoolGradingSettings),
  };
}

export function writeSeedToStorage(state: FreshSeedState): void {
  storage.set("teachers", state.teachers);
  storage.set("students", state.students);
  storage.set("classes", state.classes);
  storage.set("subjects", state.subjects);
  storage.set("attendance", state.attendance);
  storage.set("behaviourSkills", state.behaviourSkills);
  storage.set("pointEvents", state.pointEvents);
  storage.set("classTasks", state.classTasks);
  storage.set("classUnits", state.classUnits);
  storage.set("studentTaskRecords", state.studentTaskRecords);
  storage.set("classSessionNotes", state.classSessionNotes);
  storage.set("classScheduleEvents", state.classScheduleEvents);
  storage.set("classSessionExceptions", state.classSessionExceptions);
  storage.set("academicTerms", state.academicTerms);
  storage.set("taskAssessmentCategories", state.taskAssessmentCategories);
  storage.set("termGrades", state.termGrades);
  storage.set("schoolGradingSettings", state.schoolGradingSettings);
}

export function applyFreshSeedToStorage(bootTs?: string): FreshSeedState {
  const state = buildFreshSeedState(bootTs);
  writeSeedToStorage(state);
  markSeedVersionApplied();
  return state;
}
