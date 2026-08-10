import type { ClassUnit } from "@/types";
import { SEED_TERM_S1, SEED_TERM_S2 } from "@/data/seedAssessment";

const SEED_TIME = "2026-05-28T08:00:00.000Z";

export const SEED_UNIT_9A_DEV = "unit-9a-dev";
export const SEED_UNIT_9A_ALG = "unit-9a-alg";
export const SEED_UNIT_9B_LIT = "unit-9b-lit";

export const seedClassUnits: ClassUnit[] = [
  {
    id: SEED_UNIT_9A_DEV,
    classId: "cls-9a-math",
    title: "Unit 1 — Number & development",
    description: "Foundations of algebra and problem-solving strategies.",
    inquiry: "How do patterns in number help us model real situations?",
    curriculumNotes: "CAIE: Number, algebra and graphs — sections 1.1–1.4",
    startDate: "2025-09-08",
    endDate: "2025-10-24",
    durationWeeks: 7,
    termId: SEED_TERM_S1,
    sortOrder: 1,
    status: "in_progress",
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    id: SEED_UNIT_9A_ALG,
    classId: "cls-9a-math",
    title: "Unit 2 — Algebra & graphs",
    description: "Linear relationships, graphing, and modelling.",
    inquiry: "How can we represent change mathematically?",
    startDate: "2025-10-27",
    endDate: "2025-12-12",
    durationWeeks: 7,
    termId: SEED_TERM_S1,
    sortOrder: 2,
    status: "planned",
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    id: SEED_UNIT_9B_LIT,
    classId: "cls-9b-eng",
    title: "Unit 1 — Voice & persuasion",
    description: "Essay writing and rhetorical analysis.",
    inquiry: "How do authors use voice to persuade and inform?",
    curriculumNotes: "IB Lang & Lit: Paper 1 skills, persuasive techniques",
    startDate: "2025-09-15",
    endDate: "2025-12-05",
    durationWeeks: 11,
    termId: SEED_TERM_S1,
    sortOrder: 1,
    status: "in_progress",
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
  {
    id: "unit-9b-sem2",
    classId: "cls-9b-eng",
    title: "Semester 2 — Literature & voice",
    description: "Essay writing and comparative literature.",
    inquiry: "How do comparative texts reveal universal themes?",
    startDate: "2026-02-03",
    durationWeeks: 10,
    termId: SEED_TERM_S2,
    sortOrder: 2,
    status: "planned",
    createdAt: SEED_TIME,
    updatedAt: SEED_TIME,
  },
];

export function unitsForClass(units: ClassUnit[], classId: string): ClassUnit[] {
  return units
    .filter((u) => u.classId === classId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.startDate.localeCompare(b.startDate));
}
