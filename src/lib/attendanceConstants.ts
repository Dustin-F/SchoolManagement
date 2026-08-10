import type { AttendanceReasonCode, AttendanceStatus } from "@/types";

export const ATTENDANCE_REASON_CODES: {
  value: AttendanceReasonCode;
  label: string;
}[] = [
  { value: "illness", label: "Illness" },
  { value: "appointment", label: "Appointment" },
  { value: "family", label: "Family" },
  { value: "transport", label: "Transport" },
  { value: "other", label: "Other" },
];

export function attendanceStatusShowsReason(status: AttendanceStatus): boolean {
  return status === "absent" || status === "late" || status === "excused";
}
