import { z } from "zod";

const dayOfWeekSchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

const recurrenceRuleSchema = z
  .object({
    frequency: z.enum(["none", "daily", "weekly", "monthly"]),
    interval: z.number().int().min(1).max(52),
    daysOfWeek: z.array(dayOfWeekSchema).optional(),
    endType: z.enum(["never", "on_date", "after_count"]),
    endDate: z.string().optional(),
    occurrenceCount: z.number().int().min(1).max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.frequency === "weekly" && (!data.daysOfWeek || data.daysOfWeek.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["daysOfWeek"],
        message: "Select at least one day for weekly recurrence.",
      });
    }
    if (data.endType === "on_date" && !data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date is required.",
      });
    }
    if (data.endType === "after_count" && !data.occurrenceCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["occurrenceCount"],
        message: "Number of occurrences is required.",
      });
    }
  });

export const scheduleEventSchema = z
  .object({
    title: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    recurrence: recurrenceRuleSchema,
  })
  .refine(({ startTime, endTime }) => startTime < endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });
export type ScheduleEventFormData = z.infer<typeof scheduleEventSchema>;

export const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  classroomNumber: z.string().optional(),
  subjectId: z.string().min(1, "Subject is required"),
  teacherId: z.string().min(1, "A main teacher is required"),
  coTeacherIds: z.array(z.string()),
  studentIds: z.array(z.string()),
  seatColumns: z.number().int().min(2).max(12).optional(),
  seatRows: z.number().int().min(1).max(15).optional(),
});
export type ClassFormData = z.infer<typeof classSchema>;

export const studentSchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    name2First: z.string().optional(),
    name2Last: z.string().optional(),
    name3First: z.string().optional(),
    name3Last: z.string().optional(),
    email: z.string().email("Invalid email").or(z.literal("")).optional(),
    dateOfBirth: z.string().optional(),
    parentName: z.string().optional(),
    parentPhone: z.string().optional(),
    notes: z.string().optional(),
    photoUrl: z.string().url("Invalid URL").or(z.literal("")).optional(),
  })
  .superRefine((data, ctx) => {
    const hasName1 =
      (data.firstName ?? "").trim().length > 0 || (data.lastName ?? "").trim().length > 0;
    const hasName2 =
      (data.name2First ?? "").trim().length > 0 || (data.name2Last ?? "").trim().length > 0;
    const hasName3 =
      (data.name3First ?? "").trim().length > 0 || (data.name3Last ?? "").trim().length > 0;
    if (!hasName1 && !hasName2 && !hasName3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["firstName"],
        message: "Add at least one name.",
      });
    }
  });
export type StudentFormData = z.infer<typeof studentSchema>;

export const teacherSchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    name2First: z.string().optional(),
    name2Last: z.string().optional(),
    name3First: z.string().optional(),
    name3Last: z.string().optional(),
    email: z.string().email("Invalid email").or(z.literal("")).optional(),
    phone: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasName1 =
      (data.firstName ?? "").trim().length > 0 || (data.lastName ?? "").trim().length > 0;
    const hasName2 =
      (data.name2First ?? "").trim().length > 0 || (data.name2Last ?? "").trim().length > 0;
    const hasName3 =
      (data.name3First ?? "").trim().length > 0 || (data.name3Last ?? "").trim().length > 0;
    if (!hasName1 && !hasName2 && !hasName3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["firstName"],
        message: "Add at least one name.",
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

const letterGradeBandSchema = z.object({
  letter: z.string().min(1, "Letter is required"),
  minPercent: z.number().min(0).max(100),
});

export const classTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(classTaskTypes),
  description: z.string().optional(),
  instructions: z.string().optional(),
  deadline: z.string().min(1, "Deadline is required"),
  scoreMode: z.enum(["points", "percentage", "rubric"]),
  maxScore: z.string().optional(),
  letterGrades: z.array(letterGradeBandSchema).optional(),
  rubric: z.array(rubricCriterionSchema).optional(),
  assessmentRole: z.enum(["formative", "summative"]).optional(),
  termId: z.string().optional(),
  categoryId: z.string().optional(),
  unitId: z.string().optional(),
});
export type ClassTaskFormData = z.infer<typeof classTaskSchema>;

export const academicTermSchema = z.object({
  name: z.string().min(1, "Name is required"),
  schoolYear: z.string().min(1, "School year is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0),
});
export type AcademicTermFormData = z.infer<typeof academicTermSchema>;

export const taskAssessmentCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  weightPercent: z.number().min(0).max(100),
  subjectId: z.string().optional(),
  sortOrder: z.number().int().min(0),
});
export type TaskAssessmentCategoryFormData = z.infer<typeof taskAssessmentCategorySchema>;

export const classUnitSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  inquiry: z.string().optional(),
  curriculumNotes: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  durationWeeks: z.number().int().min(1).max(52).optional(),
  termId: z.string().optional(),
  sortOrder: z.number().int().min(0),
  status: z.enum(["planned", "in_progress", "completed"]).optional(),
});
export type ClassUnitFormData = z.infer<typeof classUnitSchema>;

export const studentTaskRecordUpdateSchema = z.object({
  status: z.enum(["not_started", "in_progress", "completed", "missing", "excused"]),
  feedback: z.string().optional(),
  submittedAt: z.string().optional(),
});
export type StudentTaskRecordFormData = z.infer<typeof studentTaskRecordUpdateSchema>;
