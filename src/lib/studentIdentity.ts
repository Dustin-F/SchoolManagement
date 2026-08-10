import type { Student } from "@/types";
import { getPersonNameLines } from "@/lib/personNames";

type StudentLike = Partial<
  Pick<
    Student,
    | "id"
    | "firstName"
    | "lastName"
    | "name2First"
    | "name2Last"
    | "name3First"
    | "name3Last"
    | "dateOfBirth"
  > & {
    name1?: string;
    name2?: string;
    name3?: string;
    nativeName?: string;
    phoneticName?: string;
    chineseName?: string;
    pinyinName?: string;
  }
>;

function normalize(value?: string): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function isDuplicateStudent(candidate: StudentLike, existing: StudentLike): boolean {
  const candidateLines = new Set(
    getPersonNameLines(candidate).map(normalize).filter(Boolean)
  );
  const existingLines = new Set(
    getPersonNameLines(existing).map(normalize).filter(Boolean)
  );

  let nameMatch = false;
  for (const line of candidateLines) {
    if (existingLines.has(line)) {
      nameMatch = true;
      break;
    }
  }
  if (!nameMatch) return false;

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
