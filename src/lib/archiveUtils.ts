import type { SchoolClass, Student } from "@/types";

export function isArchived(entity: { archived?: boolean }): boolean {
  return entity.archived === true;
}

export function activeClasses(classes: SchoolClass[]): SchoolClass[] {
  return classes.filter((c) => !isArchived(c));
}

export function archivedClasses(classes: SchoolClass[]): SchoolClass[] {
  return classes.filter((c) => isArchived(c));
}

export function activeStudents(students: Student[]): Student[] {
  return students.filter((s) => !isArchived(s));
}

export function archivedStudents(students: Student[]): Student[] {
  return students.filter((s) => isArchived(s));
}

export function clearStudentFromSeatGrid(
  grid: (string | null)[] | undefined,
  studentId: string
): (string | null)[] | undefined {
  if (!grid) return grid;
  return grid.map((cell) => (cell === studentId ? null : cell));
}

export function removeStudentFromClassRoster(
  cls: SchoolClass,
  studentId: string
): Pick<SchoolClass, "studentIds" | "seatGrid"> {
  if (!cls.studentIds.includes(studentId)) {
    return { studentIds: cls.studentIds, seatGrid: cls.seatGrid };
  }
  return {
    studentIds: cls.studentIds.filter((id) => id !== studentId),
    seatGrid: clearStudentFromSeatGrid(cls.seatGrid, studentId),
  };
}
