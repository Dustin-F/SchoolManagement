import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Download, Upload } from "lucide-react";
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
import { useAppStore } from "@/store";
import { findDuplicateStudent } from "@/lib/studentIdentity";
import type { Student } from "@/types";

interface StudentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetClassId?: string;
  lockToClass?: boolean;
}

type RawRow = Record<string, unknown>;

function toText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function splitEnglishName(englishName: string): { firstName: string; lastName: string } {
  const parts = englishName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? "", lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
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
  const [isImporting, setIsImporting] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(targetClassId ?? "none");

  const effectiveClassId = lockToClass ? (targetClassId ?? "none") : selectedClassId;
  const classNameById = useMemo(
    () => new Map(classes.map((c) => [c.id, c.name])),
    [classes]
  );

  const downloadTemplate = () => {
    const rows = [
      {
        "Chinese Name": "马路博",
        "English Name": "Kobe",
        "Pinyin Name": "Ma Lubo",
        Email: "",
        "Date of Birth": "",
        "Parent Name": "",
        "Parent Phone": "",
        Notes: "",
      },
      {
        "Chinese Name": "秦伊雯",
        "English Name": "Evie",
        "Pinyin Name": "Qin Yiwen",
        Email: "",
        "Date of Birth": "",
        "Parent Name": "",
        "Parent Phone": "",
        Notes: "",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "student-import-template.xlsx");
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please choose an Excel file first.");
      return;
    }

    try {
      setIsImporting(true);
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        toast.error("No worksheet found in the file.");
        return;
      }

      const rows = XLSX.utils.sheet_to_json<RawRow>(workbook.Sheets[firstSheetName], {
        defval: "",
      });

      if (rows.length === 0) {
        toast.error("No student rows found.");
        return;
      }

      let imported = 0;
      let skipped = 0;
      let duplicateSkipped = 0;
      const enrollClassId = effectiveClassId === "none" ? "" : effectiveClassId;
      const knownStudents: Student[] = [...students];

      for (const row of rows) {
        const englishCombined = pick(row, ["english", "english name"]);
        const firstNameFromColumns = pick(row, ["first name", "firstname", "first"]);
        const lastNameFromColumns = pick(row, ["last name", "lastname", "last"]);
        const chineseName = pick(row, ["chinese", "chinese name", "中文", "中文名"]);
        const pinyinName = pick(row, ["pinyin", "pinyin name"]);

        const splitEnglish = splitEnglishName(englishCombined);
        const firstName = firstNameFromColumns || splitEnglish.firstName;
        const lastName = lastNameFromColumns || splitEnglish.lastName;

        const hasAnyName = `${firstName} ${lastName}`.trim() || chineseName || pinyinName;
        if (!hasAnyName) {
          skipped += 1;
          continue;
        }

        const candidate = {
          firstName,
          lastName,
          chineseName: chineseName || undefined,
          pinyinName: pinyinName || undefined,
          dateOfBirth: pick(row, ["date of birth", "dob", "birth date"]) || undefined,
        };
        if (findDuplicateStudent(candidate, knownStudents)) {
          duplicateSkipped += 1;
          continue;
        }

        const studentId = addStudent({
          ...candidate,
          email: pick(row, ["email"]) || undefined,
          dateOfBirth: candidate.dateOfBirth,
          parentName: pick(row, ["parent name", "guardian name"]) || undefined,
          parentPhone: pick(row, ["parent phone", "guardian phone", "phone"]) || undefined,
          notes: pick(row, ["notes", "note"]) || undefined,
        });
        knownStudents.push({
          id: studentId,
          createdAt: "",
          updatedAt: "",
          ...candidate,
        });

        if (enrollClassId) {
          setStudentEnrollment(studentId, [enrollClassId]);
        }
        imported += 1;
      }

      if (imported === 0) {
        toast.error("No rows were imported. Check that at least one name field is filled.");
        return;
      }

      const enrolledMessage = enrollClassId
        ? ` and enrolled into ${classNameById.get(enrollClassId) ?? "selected class"}`
        : "";
      const skippedParts = [
        skipped > 0 ? `${skipped} empty-row skipped` : "",
        duplicateSkipped > 0 ? `${duplicateSkipped} duplicate skipped` : "",
      ].filter(Boolean);
      const skippedMessage = skippedParts.length > 0 ? ` (${skippedParts.join(", ")})` : "";
      toast.success(`Imported ${imported} student(s)${enrolledMessage}${skippedMessage}.`);

      setFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Import failed. Please check the file format.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Students from Excel</DialogTitle>
          <DialogDescription>
            Upload an `.xlsx` file to bulk-create students. You can include Chinese, English, and Pinyin names.
          </DialogDescription>
        </DialogHeader>

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
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Supported headers: Chinese Name, English Name, Pinyin Name, Email, Date of Birth, Parent Name,
              Parent Phone, Notes.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleImport} disabled={!file || isImporting}>
              <Upload className="mr-2 h-4 w-4" />
              {isImporting ? "Importing..." : "Import Students"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

