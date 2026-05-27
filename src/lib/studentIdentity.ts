import type { Student } from "@/types";

type StudentLike = Partial<
  Pick<Student, "id" | "firstName" | "lastName" | "chineseName" | "pinyinName" | "dateOfBirth">
>;

function normalize(value?: string): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function isDuplicateStudent(candidate: StudentLike, existing: StudentLike): boolean {
  const candidateChinese = normalize(candidate.chineseName);
  const existingChinese = normalize(existing.chineseName);
  const candidatePinyin = normalize(candidate.pinyinName);
  const existingPinyin = normalize(existing.pinyinName);

  const candidateFirst = normalize(candidate.firstName);
  const candidateLast = normalize(candidate.lastName);
  const existingFirst = normalize(existing.firstName);
  const existingLast = normalize(existing.lastName);

  const chineseMatch = candidateChinese !== "" && candidateChinese === existingChinese;
  const pinyinMatch = candidatePinyin !== "" && candidatePinyin === existingPinyin;
  const englishMatch =
    candidateFirst !== "" &&
    candidateLast !== "" &&
    candidateFirst === existingFirst &&
    candidateLast === existingLast;

  const baseMatch = chineseMatch || pinyinMatch || englishMatch;
  if (!baseMatch) return false;

  const candidateDob = normalize(candidate.dateOfBirth);
  const existingDob = normalize(existing.dateOfBirth);
  if (candidateDob && existingDob && candidateDob !== existingDob) {
    return false;
  }
  return true;
}

export function findDuplicateStudent(
  candidate: StudentLike,
  existingStudents: StudentLike[],
  excludeId?: string
): StudentLike | undefined {
  return existingStudents.find((existing) => {
    if (excludeId && existing.id === excludeId) return false;
    return isDuplicateStudent(candidate, existing);
  });
}

