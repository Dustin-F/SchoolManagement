import { z } from "zod";

const scheduleEntrySchema = z
  .object({
    id: z.string(),
    dayOfWeek: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
  })
  .refine(
    ({ startTime, endTime }) => startTime < endTime,
    { message: "End time must be after start time", path: ["endTime"] }
  );

export const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  classroomNumber: z.string().optional(),
  subjectId: z.string().min(1, "Subject is required"),
  teacherId: z.string().min(1, "A main teacher is required"),
  coTeacherIds: z.array(z.string()),
  studentIds: z.array(z.string()),
  schedule: z.array(scheduleEntrySchema),
  seatColumns: z.number().int().min(2).max(12).optional(),
  seatRows: z.number().int().min(1).max(15).optional(),
});
export type ClassFormData = z.infer<typeof classSchema>;

export const studentSchema = z
  .object({
    firstName: z.string(),
    lastName: z.string(),
    chineseName: z.string().optional(),
    pinyinName: z.string().optional(),
    email: z.string().email("Invalid email").or(z.literal("")).optional(),
    dateOfBirth: z.string().optional(),
    parentName: z.string().optional(),
    parentPhone: z.string().optional(),
    notes: z.string().optional(),
    photoUrl: z.string().url("Invalid URL").or(z.literal("")).optional(),
  })
  .superRefine((data, ctx) => {
    const hasEnglish = `${data.firstName} ${data.lastName}`.trim().length > 0;
    const hasChinese = (data.chineseName ?? "").trim().length > 0;
    const hasPinyin = (data.pinyinName ?? "").trim().length > 0;
    if (!hasEnglish && !hasChinese && !hasPinyin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["firstName"],
        message: "Add at least one name: English, Chinese, or Pinyin.",
      });
    }
  });
export type StudentFormData = z.infer<typeof studentSchema>;

export const teacherSchema = z
  .object({
    firstName: z.string(),
    lastName: z.string(),
    chineseName: z.string().optional(),
    pinyinName: z.string().optional(),
    email: z.string().email("Invalid email").or(z.literal("")).optional(),
    phone: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasEnglish = `${data.firstName} ${data.lastName}`.trim().length > 0;
    const hasChinese = (data.chineseName ?? "").trim().length > 0;
    const hasPinyin = (data.pinyinName ?? "").trim().length > 0;
    if (!hasEnglish && !hasChinese && !hasPinyin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["firstName"],
        message: "Add at least one name: English, Chinese, or Pinyin.",
      });
    }
  });
export type TeacherFormData = z.infer<typeof teacherSchema>;

export const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().optional(),
  description: z.string().optional(),
});
export type SubjectFormData = z.infer<typeof subjectSchema>;

export const behaviourSkillSchema = z.object({
  name: z.string().min(1, "Name is required"),
  emoji: z.string().optional(),
  points: z.number().int().refine((n) => n !== 0, "Points cannot be zero"),
  type: z.enum(["positive", "negative"]),
  active: z.boolean(),
  sortOrder: z.number().int().min(0),
  parentDescription: z.string().optional(),
});
export type BehaviourSkillFormData = z.infer<typeof behaviourSkillSchema>;

const classTaskTypes = [
  "exam",
  "presentation",
  "homework",
  "quiz",
  "project",
  "essay",
  "worksheet",
  "other",
] as const;

const rubricCriterionSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  maxPoints: z.number().optional(),
});

export const classTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(classTaskTypes),
  description: z.string().optional(),
  deadline: z.string().min(1, "Deadline is required"),
  maxScore: z.string().optional(),
  rubric: z.array(rubricCriterionSchema).optional(),
});
export type ClassTaskFormData = z.infer<typeof classTaskSchema>;

export const studentTaskRecordUpdateSchema = z.object({
  status: z.enum(["not_started", "in_progress", "completed", "missing"]),
  score: z.string().optional(),
  feedback: z.string().optional(),
  submittedAt: z.string().optional(),
});
export type StudentTaskRecordFormData = z.infer<typeof studentTaskRecordUpdateSchema>;
