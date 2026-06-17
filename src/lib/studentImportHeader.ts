import * as XLSX from "xlsx";

/** Row index (0-based) where column headers live in the official template. */
export const TEMPLATE_HEADER_ROW = 3;

/** Locate the header row in any sheet (styled template or legacy flat-header files). */
export function findImportHeaderRow(sheet: XLSX.WorkSheet): number {
  const ref = sheet["!ref"];
  if (!ref) return 0;

  const range = XLSX.utils.decode_range(ref);
  const markers = new Set(["first name", "firstname", "name 1", "name1", "english name"]);

  for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + 20); r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const address = XLSX.utils.encode_cell({ r, c });
      const raw = sheet[address]?.v;
      const value = String(raw ?? "")
        .trim()
        .toLowerCase();
      if (markers.has(value)) return r;
    }
  }
  return 0;
}
