import XLSX from "xlsx-js-style";
import { TEMPLATE_HEADER_ROW } from "@/lib/studentImportHeader";

const COLUMNS = [
  { header: "First Name", width: 18 },
  { header: "Last Name", width: 18 },
  { header: "Name 2 First", width: 18 },
  { header: "Name 2 Last", width: 18 },
  { header: "Name 3 First", width: 18 },
  { header: "Name 3 Last", width: 18 },
  { header: "Email", width: 30 },
  { header: "Date of Birth", width: 18 },
  { header: "Parent Name", width: 24 },
  { header: "Parent Phone", width: 18 },
  { header: "Notes", width: 36 },
] as const;

const COL_COUNT = COLUMNS.length;

const SAMPLE_ROWS: string[][] = [
  ["Emily", "Chen", "陈艾米", "", "Chen", "Aimi", "", "", "", "", ""],
  ["Kobe", "", "马路博", "", "Ma", "Lubo", "", "", "", "", ""],
];

type CellStyle = {
  font?: { bold?: boolean; sz?: number; color?: { rgb: string }; name?: string; italic?: boolean };
  fill?: { fgColor: { rgb: string }; patternType: "solid" };
  alignment?: { horizontal?: string; vertical?: string; wrapText?: boolean };
  border?: Partial<
    Record<"top" | "bottom" | "left" | "right", { style: string; color: { rgb: string } }>
  >;
};

const thinBorder = {
  top: { style: "thin", color: { rgb: "CBD5E1" } },
  bottom: { style: "thin", color: { rgb: "CBD5E1" } },
  left: { style: "thin", color: { rgb: "CBD5E1" } },
  right: { style: "thin", color: { rgb: "CBD5E1" } },
};

const titleStyle: CellStyle = {
  font: { bold: true, sz: 20, color: { rgb: "FFFFFF" }, name: "Calibri" },
  fill: { fgColor: { rgb: "1E3A5F" }, patternType: "solid" },
  alignment: { horizontal: "center", vertical: "center" },
};

const subtitleStyle: CellStyle = {
  font: { sz: 11, color: { rgb: "1E3A5F" }, name: "Calibri", italic: true },
  fill: { fgColor: { rgb: "E0E7FF" }, patternType: "solid" },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
};

const headerStyle: CellStyle = {
  font: { bold: true, sz: 11, color: { rgb: "FFFFFF" }, name: "Calibri" },
  fill: { fgColor: { rgb: "2563EB" }, patternType: "solid" },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: thinBorder,
};

const sampleEvenStyle: CellStyle = {
  font: { sz: 11, color: { rgb: "0F172A" }, name: "Calibri" },
  fill: { fgColor: { rgb: "FFFFFF" }, patternType: "solid" },
  alignment: { vertical: "center" },
  border: thinBorder,
};

const sampleOddStyle: CellStyle = {
  ...sampleEvenStyle,
  fill: { fgColor: { rgb: "F1F5F9" }, patternType: "solid" },
};

function cell(value: string, style?: CellStyle) {
  return { v: value, t: "s" as const, s: style };
}

function setCell(ws: XLSX.WorkSheet, row: number, col: number, value: string, style?: CellStyle) {
  ws[XLSX.utils.encode_cell({ r: row, c: col })] = cell(value, style);
}

export function downloadStudentImportTemplate() {
  const ws: XLSX.WorkSheet = {};

  setCell(ws, 0, 0, "Student Import Template", titleStyle);
  setCell(
    ws,
    1,
    0,
    "Add one row per student below the blue header. Name 2 and Name 3 are optional. Replace the sample rows with your data. Date of Birth: YYYY-MM-DD.",
    subtitleStyle
  );

  COLUMNS.forEach((col, c) => {
    setCell(ws, TEMPLATE_HEADER_ROW, c, col.header, headerStyle);
  });

  SAMPLE_ROWS.forEach((row, rowIndex) => {
    const style = rowIndex % 2 === 0 ? sampleEvenStyle : sampleOddStyle;
    row.forEach((value, c) => {
      setCell(ws, TEMPLATE_HEADER_ROW + 1 + rowIndex, c, value, style);
    });
  });

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: COL_COUNT - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: COL_COUNT - 1 } },
  ];

  ws["!cols"] = COLUMNS.map((col) => ({ wch: col.width }));
  ws["!rows"] = [
    { hpt: 36 },
    { hpt: 36 },
    { hpt: 8 },
    { hpt: 32 },
    { hpt: 22 },
    { hpt: 22 },
  ];

  ws["!views"] = [
    {
      state: "frozen",
      ySplit: TEMPLATE_HEADER_ROW + 1,
      xSplit: 0,
      topLeftCell: `A${TEMPLATE_HEADER_ROW + 2}`,
      activeCell: `A${TEMPLATE_HEADER_ROW + 2}`,
    },
  ];

  const lastRow = TEMPLATE_HEADER_ROW + SAMPLE_ROWS.length;
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: lastRow, c: COL_COUNT - 1 },
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  XLSX.writeFile(wb, "student-import-template.xlsx");
}
