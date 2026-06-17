import type { ClassTask, LetterGradeBand, StudentTaskRecord, TaskScoreMode } from "@/types";

export interface TaskScorePatch {
  score?: number | null;
  letterGrade?: string | null;
  criterionScores?: Record<string, number> | null;
}

export const DEFAULT_LETTER_GRADES: LetterGradeBand[] = [
  { letter: "A", minPercent: 90 },
  { letter: "B", minPercent: 80 },
  { letter: "C", minPercent: 70 },
  { letter: "D", minPercent: 60 },
  { letter: "F", minPercent: 0 },
];

/** Legacy tasks used scoreMode "letter"; treat as percentage + letter scale. */
export function resolveScoreMode(task: ClassTask): TaskScoreMode {
  const mode = task.scoreMode ?? "points";
  if ((mode as string) === "letter") return "percentage";
  return mode;
}

export function isRubricMode(task: ClassTask): boolean {
  return resolveScoreMode(task) === "rubric";
}

export function hasLetterGrades(task: ClassTask): boolean {
  return (task.letterGrades?.length ?? 0) > 0;
}

export function rubricMaxPoints(task: ClassTask): number {
  if (!task.rubric?.length) return 0;
  return task.rubric.reduce((sum, c) => sum + (c.maxPoints ?? 0), 0);
}

export function sortLetterGrades(bands: LetterGradeBand[]): LetterGradeBand[] {
  return [...bands].sort((a, b) => b.minPercent - a.minPercent);
}

export function getLetterGrades(task: ClassTask): LetterGradeBand[] {
  const bands = task.letterGrades?.length ? task.letterGrades : DEFAULT_LETTER_GRADES;
  return sortLetterGrades(bands);
}

export function percentForLetter(letter: string, bands: LetterGradeBand[]): number | null {
  const band = bands.find((b) => b.letter === letter);
  return band != null ? band.minPercent : null;
}

export function letterForPercent(percent: number, bands: LetterGradeBand[]): string | null {
  const sorted = sortLetterGrades(bands);
  for (const band of sorted) {
    if (percent >= band.minPercent) return band.letter;
  }
  return sorted[sorted.length - 1]?.letter ?? null;
}

export function scoreFromLetter(task: ClassTask, letter: string): number | null {
  const pct = percentForLetter(letter, getLetterGrades(task));
  if (pct == null) return null;
  if (resolveScoreMode(task) === "percentage") return pct;
  if (isRubricMode(task)) {
    const max = rubricMaxPoints(task);
    if (max > 0) return Math.round((pct / 100) * max * 10) / 10;
    return null;
  }
  const max = task.maxScore;
  if (max != null && max > 0) {
    return Math.round((pct / 100) * max * 10) / 10;
  }
  return null;
}

export function taskMaxScore(task: ClassTask): number | null {
  if (resolveScoreMode(task) === "percentage") return 100;
  if (isRubricMode(task)) {
    const max = rubricMaxPoints(task);
    return max > 0 ? max : null;
  }
  return task.maxScore ?? null;
}

export function scoreModeLabel(mode: TaskScoreMode): string {
  const map: Record<TaskScoreMode, string> = {
    points: "Points",
    percentage: "Percentage",
    rubric: "Rubric",
  };
  return map[mode];
}

export function formatTaskScoreHeader(task: ClassTask): string {
  const mode = resolveScoreMode(task);
  const base =
    mode === "rubric"
      ? rubricMaxPoints(task) > 0
        ? `rubric /${rubricMaxPoints(task)}`
        : "rubric"
      : mode === "percentage"
        ? "0–100%"
        : task.maxScore != null
          ? `out of ${task.maxScore}`
          : "points";
  if (hasLetterGrades(task)) {
    const letters = getLetterGrades(task)
      .map((b) => b.letter)
      .join("");
    return `${base} · ${letters || "A–F"}`;
  }
  return base;
}

export function formatRecordScore(task: ClassTask, record: StudentTaskRecord): string {
  const mode = resolveScoreMode(task);
  const letter = record.letterGrade;
  const hasLetters = hasLetterGrades(task);

  if (record.score == null && !letter) return "—";

  let numeric = "—";
  if (record.score != null) {
    if (mode === "percentage") numeric = `${record.score}%`;
    else if (mode === "rubric" || task.maxScore != null) {
      const max = mode === "rubric" ? rubricMaxPoints(task) : task.maxScore;
      numeric = max != null && max > 0 ? `${record.score}/${max}` : String(record.score);
    } else numeric = String(record.score);
  }

  if (hasLetters && letter) {
    return numeric !== "—" ? `${letter} (${numeric})` : letter;
  }
  return numeric;
}

export function parseNumericScore(task: ClassTask, raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  if (resolveScoreMode(task) === "percentage") {
    return Math.min(100, Math.max(0, value));
  }
  return value;
}

export function effectivePercent(task: ClassTask, record: StudentTaskRecord): number | null {
  if (record.score != null) {
    if (resolveScoreMode(task) === "percentage") return record.score;
    const max = taskMaxScore(task);
    if (max != null && max > 0) return (record.score / max) * 100;
    return null;
  }
  if (record.letterGrade && hasLetterGrades(task)) {
    return percentForLetter(record.letterGrade, getLetterGrades(task));
  }
  return null;
}

export function letterGradeForRecord(task: ClassTask, record: StudentTaskRecord): string | null {
  if (!hasLetterGrades(task)) return null;
  if (record.letterGrade) return record.letterGrade;
  const pct = effectivePercent(task, record);
  if (pct == null) return null;
  return letterForPercent(pct, getLetterGrades(task));
}

export function buildScoreUpdateFromNumeric(
  task: ClassTask,
  score: number | null
): TaskScorePatch {
  if (score == null) return { score: null, letterGrade: null, criterionScores: undefined };
  if (isRubricMode(task)) {
    return { score: null, letterGrade: null, criterionScores: undefined };
  }
  if (!hasLetterGrades(task)) return { score, letterGrade: null };
  const pct =
    resolveScoreMode(task) === "percentage"
      ? score
      : task.maxScore && task.maxScore > 0
        ? (score / task.maxScore) * 100
        : null;
  const letterGrade = pct != null ? letterForPercent(pct, getLetterGrades(task)) : null;
  return { score, letterGrade };
}

export function buildScoreUpdateFromLetter(
  task: ClassTask,
  letter: string | null
): TaskScorePatch {
  if (!letter) {
    return {
      score: null,
      letterGrade: null,
      ...(isRubricMode(task) ? { criterionScores: null } : {}),
    };
  }
  return {
    score: scoreFromLetter(task, letter),
    letterGrade: letter,
    ...(isRubricMode(task) ? { criterionScores: null } : {}),
  };
}

export function buildScoreUpdateFromCriterionScores(
  task: ClassTask,
  criterionScores: Record<string, number> | null
): TaskScorePatch {
  if (!criterionScores || !task.rubric?.length) {
    return { score: null, letterGrade: null, criterionScores: null };
  }

  const cleaned: Record<string, number> = {};
  let total = 0;

  for (const c of task.rubric) {
    const v = criterionScores[c.id];
    if (v == null || Number.isNaN(v)) continue;
    const cap = c.maxPoints ?? v;
    const clamped = Math.min(cap, Math.max(0, v));
    cleaned[c.id] = clamped;
    total += clamped;
  }

  if (Object.keys(cleaned).length === 0) {
    return { score: null, letterGrade: null, criterionScores: null };
  }

  const max = rubricMaxPoints(task);
  let letterGrade: string | null = null;
  if (hasLetterGrades(task) && max > 0) {
    letterGrade = letterForPercent((total / max) * 100, getLetterGrades(task));
  }

  return {
    score: total,
    letterGrade,
    criterionScores: cleaned,
  };
}

export function normalizeClassTask(task: ClassTask): ClassTask {
  const rawMode = task.scoreMode ?? "points";
  const isLegacyLetter = (rawMode as string) === "letter";
  const scoreMode: TaskScoreMode = isLegacyLetter ? "percentage" : rawMode;
  const letterGrades = task.letterGrades?.length
    ? sortLetterGrades(task.letterGrades)
    : isLegacyLetter
      ? DEFAULT_LETTER_GRADES
      : undefined;

  return {
    ...task,
    scoreMode,
    letterGrades,
    maxScore: scoreMode === "rubric" ? null : task.maxScore,
    rubric: scoreMode === "rubric" ? task.rubric : undefined,
  };
}
