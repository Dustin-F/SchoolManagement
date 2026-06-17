import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Download, Upload, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppStore } from "@/store";
import { findDuplicateStudent } from "@/lib/studentIdentity";
import { findImportHeaderRow } from "@/lib/studentImportHeader";
import { getStudentDisplayName } from "@/lib/displayHelpers";
import type { Student } from "@/types";

interface StudentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetClassId?: string;
  lockToClass?: boolean;
}

type RawRow = Record<string, unknown>;

export interface ParsedImportRow {
  firstName: string;
  lastName: string;
  name2First?: string;
  name2Last?: string;
  name3First?: string;
  name3Last?: string;
  email?: string;
  dateOfBirth?: string;
  parentName?: string;
  parentPhone?: string;
  notes?: string;
}

interface ImportPreview {
  toImport: ParsedImportRow[];
  emptySkipped: number;
  duplicateSkipped: number;
}

function toText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: parts[0] ?? "", last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function pick(row: RawRow, keys: string[]): string {
  const map = new Map<string, unknown>();
  for (const [k, v] of Object.entries(row)) {
    map.set(k.trim().toLowerCase(), v);
  }
  for (const key of keys) {
    const v = map.get(key.toLowerCase());
    if (v != null && String(v).trim() !== "") return toText(v);
  }
  return "";
}

function parseRow(row: RawRow): ParsedImportRow | null {
  const name1Full = pick(row, ["name 1", "name1", "full name", "name", "english", "english name"]);
  const name1First =
    pick(row, ["name 1 first", "name1 first", "first name", "firstname", "first"]) ||
    splitName(name1Full).first;
  const name1Last =
    pick(row, ["name 1 last", "name1 last", "last name", "lastname", "last"]) ||
    splitName(name1Full).last;

  const name2Full = pick(row, [
    "name 2",
    "name2",
    "native",
    "native name",
    "native script",
    "chinese",
    "chinese name",
    "中文",
    "中文名",
  ]);
  const name2First = pick(row, ["name 2 first", "name2 first"]) || splitName(name2Full).first;
  const name2Last = pick(row, ["name 2 last", "name2 last"]) || splitName(name2Full).last;

  const name3Full = pick(row, [
    "name 3",
    "name3",
    "phonetic",
    "phonetic name",
    "romanized",
    "romanized name",
    "pinyin",
    "pinyin name",
  ]);
  const name3First = pick(row, ["name 3 first", "name3 first"]) || splitName(name3Full).first;
  const name3Last = pick(row, ["name 3 last", "name3 last"]) || splitName(name3Full).last;

  const hasAnyName =
    name1First || name1Last || name2First || name2Last || name3First || name3Last;
  if (!hasAnyName) return null;

  return {
    firstName: name1First,
    lastName: name1Last,
    name2First: name2First || undefined,
    name2Last: name2Last || undefined,
    name3First: name3First || undefined,
    name3Last: name3Last || undefined,
    email: pick(row, ["email"]) || undefined,
    dateOfBirth: pick(row, ["date of birth", "dob", "birth date"]) || undefined,
    parentName: pick(row, ["parent name", "guardian name"]) || undefined,
    parentPhone: pick(row, ["parent phone", "guardian phone", "phone"]) || undefined,
    notes: pick(row, ["notes", "note"]) || undefined,
  };
}

export function buildImportPreview(buffer: ArrayBuffer, knownStudents: Student[]): ImportPreview {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("No worksheet found in the file.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const headerRow = findImportHeaderRow(sheet);
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, {
    defval: "",
    range: headerRow,
  });

  if (rows.length === 0) {
    throw new Error("No student rows found.");
  }

  let emptySkipped = 0;
  let duplicateSkipped = 0;
  const toImport: ParsedImportRow[] = [];
  const seen: Student[] = [...knownStudents];

  for (const row of rows) {
    const parsed = parseRow(row);
    if (!parsed) {
      emptySkipped += 1;
      continue;
    }

    const candidate = {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      name2First: parsed.name2First,
      name2Last: parsed.name2Last,
      name3First: parsed.name3First,
      name3Last: parsed.name3Last,
      dateOfBirth: parsed.dateOfBirth,
    };
    if (findDuplicateStudent(candidate, seen)) {
      duplicateSkipped += 1;
      continue;
    }

    toImport.push(parsed);
    seen.push({
      id: `preview-${toImport.length}`,
      createdAt: "",
      updatedAt: "",
      ...candidate,
    });
  }

  return { toImport, emptySkipped, duplicateSkipped };
}

function previewDisplayName(row: ParsedImportRow): string {
  return getStudentDisplayName({
    id: "",
    createdAt: "",
    updatedAt: "",
    firstName: row.firstName,
    lastName: row.lastName,
    name2First: row.name2First,
    name2Last: row.name2Last,
    name3First: row.name3First,
    name3Last: row.name3Last,
  });
}

export function StudentImportDialog({
  open,
  onOpenChange,
  targetClassId,
  lockToClass = false,
}: StudentImportDialogProps) {
  const classes = useAppStore((s) => s.classes);
  const addStudent = useAppStore((s) => s.addStudent);
  const setStudentEnrollment = useAppStore((s) => s.setStudentEnrollment);
  const students = useAppStore((s) => s.students);

  const [file, setFile] = useState<File | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(targetClassId ?? "none");
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  const effectiveClassId = lockToClass ? (targetClassId ?? "none") : selectedClassId;
  const classNameById = useMemo(
    () => new Map(classes.map((c) => [c.id, c.name])),
    [classes]
  );

  const resetState = () => {
    setFile(null);
    setStep("upload");
    setPreview(null);
    setIsWorking(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetState();
    onOpenChange(next);
  };

  const downloadTemplate = async () => {
    const { downloadStudentImportTemplate } = await import("@/lib/studentImportTemplate");
    downloadStudentImportTemplate();
  };

  const handleReview = async () => {
    if (!file) {
      toast.error("Please choose an Excel file first.");
      return;
    }

    try {
      setIsWorking(true);
      const buffer = await file.arrayBuffer();
      const result = buildImportPreview(buffer, students);
      if (result.toImport.length === 0) {
        toast.error("No new students to import. Check names or remove duplicates.");
        return;
      }
      setPreview(result);
      setStep("preview");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Could not read the file.");
    } finally {
      setIsWorking(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview || preview.toImport.length === 0) return;

    try {
      setIsWorking(true);
      const enrollClassId = effectiveClassId === "none" ? "" : effectiveClassId;
      let imported = 0;

      for (const row of preview.toImport) {
        const studentId = addStudent({
          firstName: row.firstName,
          lastName: row.lastName,
          name2First: row.name2First,
          name2Last: row.name2Last,
          name3First: row.name3First,
          name3Last: row.name3Last,
          email: row.email,
          dateOfBirth: row.dateOfBirth,
          parentName: row.parentName,
          parentPhone: row.parentPhone,
          notes: row.notes,
        });
        if (enrollClassId) {
          setStudentEnrollment(studentId, [enrollClassId]);
        }
        imported += 1;
      }

      const enrolledMessage = enrollClassId
        ? ` and enrolled into ${classNameById.get(enrollClassId) ?? "selected class"}`
        : "";
      const skippedParts = [
        preview.emptySkipped > 0 ? `${preview.emptySkipped} empty-row skipped` : "",
        preview.duplicateSkipped > 0 ? `${preview.duplicateSkipped} duplicate skipped` : "",
      ].filter(Boolean);
      const skippedMessage = skippedParts.length > 0 ? ` (${skippedParts.join(", ")})` : "";
      toast.success(`Imported ${imported} student(s)${enrolledMessage}${skippedMessage}.`);

      handleOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Import failed. Please try again.");
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Students from Excel</DialogTitle>
          <DialogDescription>
            {step === "upload"
              ? "Upload an `.xlsx` file, review the rows, then confirm the import."
              : "Review the students below before importing."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" ? (
          <div className="space-y-4">
            {!lockToClass && (
              <div className="space-y-2">
                <Label>Assign imported students to class (optional)</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Do not assign to a class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Do not assign</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {lockToClass && targetClassId && (
              <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                Imported students will be assigned to:{" "}
                <span className="font-medium text-foreground">
                  {classNameById.get(targetClassId) ?? "Current class"}
                </span>
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="student-import-file">Excel file</Label>
              <Input
                id="student-import-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setPreview(null);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Supported headers: First Name, Last Name, Name 2 First, Name 2 Last, Name 3 First, Name 3 Last,
                Email, Date of Birth, Parent Name, Parent Phone, Notes.
              </p>
            </div>
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
              <p>
                <strong>{preview.toImport.length}</strong> student
                {preview.toImport.length !== 1 ? "s" : ""} ready to import
                {preview.duplicateSkipped > 0 && (
                  <> · {preview.duplicateSkipped} duplicate{preview.duplicateSkipped !== 1 ? "s" : ""} skipped</>
                )}
                {preview.emptySkipped > 0 && (
                  <> · {preview.emptySkipped} empty row{preview.emptySkipped !== 1 ? "s" : ""} skipped</>
                )}
              </p>
              {effectiveClassId !== "none" && (
                <p className="mt-1 text-muted-foreground">
                  Class: {classNameById.get(effectiveClassId) ?? "Selected class"}
                </p>
              )}
            </div>

            <div className="max-h-64 overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.toImport.slice(0, 20).map((row, i) => (
                    <TableRow key={`${previewDisplayName(row)}-${i}`}>
                      <TableCell className="font-medium">{previewDisplayName(row)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {row.email || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {preview.toImport.length > 20 && (
              <p className="text-xs text-muted-foreground">
                Showing first 20 of {preview.toImport.length} students.
              </p>
            )}
          </div>
        ) : null}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {step === "upload" ? (
            <>
              <Button type="button" variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleReview} disabled={!file || isWorking}>
                  <Upload className="mr-2 h-4 w-4" />
                  {isWorking ? "Reading…" : "Review import"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("upload")}
                disabled={isWorking}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleConfirmImport} disabled={isWorking}>
                  {isWorking ? "Importing…" : `Import ${preview?.toImport.length ?? 0} students`}
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
