import type { SchoolClass, Student } from "@/types";

export const DEFAULT_SEAT_COLUMNS = 5;
export const MIN_SEAT_COLUMNS = 2;
export const MAX_SEAT_COLUMNS = 12;
export const MIN_SEAT_ROWS = 1;
export const MAX_SEAT_ROWS = 15;

export function clampSeatColumns(n: number): number {
  return Math.min(MAX_SEAT_COLUMNS, Math.max(MIN_SEAT_COLUMNS, n));
}

export function clampSeatRows(n: number): number {
  return Math.min(MAX_SEAT_ROWS, Math.max(MIN_SEAT_ROWS, n));
}

export function getSeatColumns(cls: SchoolClass): number {
  return clampSeatColumns(cls.seatColumns ?? DEFAULT_SEAT_COLUMNS);
}

/** Minimum rows needed to seat every student at this column count. */
export function minRowsForStudents(studentCount: number, columns: number): number {
  if (studentCount <= 0) return MIN_SEAT_ROWS;
  return Math.max(MIN_SEAT_ROWS, Math.ceil(studentCount / columns));
}

/** Rows required to fit `studentCount` at current column count. */
export function autoSeatRows(cls: SchoolClass, studentCount: number): number {
  return minRowsForStudents(studentCount, getSeatColumns(cls));
}

/** Effective row count (fixed `seatRows` or auto-sized to fit students). */
export function getSeatRows(cls: SchoolClass, studentCount: number): number {
  const cols = getSeatColumns(cls);
  const minRows = minRowsForStudents(studentCount, cols);
  if (cls.seatRows != null) return Math.max(minRows, clampSeatRows(cls.seatRows));
  return minRows;
}

export function seatGridSize(cls: SchoolClass, studentCount: number): number {
  return getSeatColumns(cls) * getSeatRows(cls, studentCount);
}

export function studentIdsFromSeatGrid(grid: (string | null)[]): string[] {
  return grid.filter((id): id is string => id != null);
}

/** Grid order first, then any enrolled students not currently placed on the grid. */
export function orderStudentIdsByGrid(enrolledIds: string[], grid: (string | null)[]): string[] {
  const placed = studentIdsFromSeatGrid(grid);
  const placedSet = new Set(placed);
  const unplaced = enrolledIds.filter((id) => !placedSet.has(id));
  return [...placed, ...unplaced];
}

export function indexToRowCol(index: number, columns: number): { row: number; col: number } {
  return { row: Math.floor(index / columns), col: index % columns };
}

/**
 * Ensure every enrolled student appears at most once on the grid.
 * Unplaced students fill empty cells left-to-right; never removes enrollment.
 */
export function reconcileSeatGrid(
  grid: (string | null)[],
  columns: number,
  rows: number,
  enrolledIds: string[]
): (string | null)[] {
  const size = columns * rows;
  let next: (string | null)[] =
    grid.length === size ? [...grid] : Array(size).fill(null);

  const enrolled = new Set(enrolledIds);
  const seen = new Set<string>();

  next = next.map((id) => {
    if (!id || !enrolled.has(id) || seen.has(id)) return null;
    seen.add(id);
    return id;
  });

  for (const id of enrolledIds) {
    if (next.includes(id)) continue;
    const empty = next.findIndex((cell) => cell === null);
    if (empty >= 0) next[empty] = id;
  }

  return next;
}

/** Bump rows so the grid can hold every student (never drops enrollment). */
export function ensureLayoutFitsStudents(
  columns: number,
  rows: number,
  studentCount: number
): { columns: number; rows: number; wasClamped: boolean } {
  const cols = clampSeatColumns(columns);
  const minRows = minRowsForStudents(studentCount, cols);
  const finalRows = clampSeatRows(Math.max(rows, minRows));
  return {
    columns: cols,
    rows: finalRows,
    wasClamped: finalRows > rows,
  };
}

/** Build or validate grid from class + enrolled ids (row-major, front to back). */
export function resolveSeatGrid(cls: SchoolClass, enrolledIds: string[]): (string | null)[] {
  const cols = getSeatColumns(cls);
  const rows = getSeatRows(cls, enrolledIds.length);
  const size = cols * rows;

  let grid: (string | null)[];

  if (cls.seatGrid && cls.seatGrid.length === size) {
    grid = reconcileSeatGrid(cls.seatGrid, cols, rows, enrolledIds);
  } else if (cls.seatGrid && cls.seatGrid.length > 0) {
    const oldCols = cols;
    const oldRows = Math.ceil(cls.seatGrid.length / oldCols);
    grid = resizeSeatGrid(cls.seatGrid, oldCols, oldRows, cols, rows, enrolledIds);
    grid = reconcileSeatGrid(grid, cols, rows, enrolledIds);
  } else {
    grid = Array(size).fill(null);
    enrolledIds.forEach((id, i) => {
      if (i < size) grid[i] = id;
    });
    grid = reconcileSeatGrid(grid, cols, rows, enrolledIds);
  }

  return grid;
}

export function resizeSeatGrid(
  oldGrid: (string | null)[],
  oldCols: number,
  _oldRows: number,
  newCols: number,
  newRows: number,
  enrolledIds: string[]
): (string | null)[] {
  const next: (string | null)[] = Array(newCols * newRows).fill(null);
  const positioned = new Map<string, { r: number; c: number }>();
  const oldRowCount = Math.ceil(oldGrid.length / oldCols);

  for (let r = 0; r < oldRowCount; r++) {
    for (let c = 0; c < oldCols; c++) {
      const id = oldGrid[r * oldCols + c];
      if (id) positioned.set(id, { r, c });
    }
  }

  for (const id of enrolledIds) {
    const pos = positioned.get(id);
    if (pos && pos.r < newRows && pos.c < newCols) {
      const idx = pos.r * newCols + pos.c;
      if (next[idx] === null) next[idx] = id;
    }
  }

  for (const id of enrolledIds) {
    if (next.includes(id)) continue;
    const empty = next.findIndex((cell) => cell === null);
    if (empty >= 0) next[empty] = id;
  }

  return next;
}

export function swapSeatCells(grid: (string | null)[], fromIndex: number, toIndex: number): (string | null)[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return grid;
  const next = [...grid];
  const tmp = next[fromIndex];
  next[fromIndex] = next[toIndex];
  next[toIndex] = tmp;
  return next;
}

export function seatCellId(index: number): string {
  return `seat-cell-${index}`;
}

export function seatDropId(index: number): string {
  return `seat-drop-${index}`;
}

export function parseSeatCellId(id: string): number | null {
  const m = /^seat-(?:cell|drop)-(\d+)$/.exec(id);
  return m ? Number(m[1]) : null;
}

/** Preserve class roster order (seat plan order). */
export function studentsInSeatOrder(students: Student[], studentIds: string[]): Student[] {
  const byId = new Map(students.map((s) => [s.id, s]));
  return studentIds.map((id) => byId.get(id)).filter((s): s is Student => !!s);
}

export function studentsFromSeatGrid(students: Student[], grid: (string | null)[]): Student[] {
  return studentsInSeatOrder(students, studentIdsFromSeatGrid(grid));
}
