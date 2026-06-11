import type { AppData } from "@/types";
import { SCHEMA_VERSION } from "@/lib/storage";

export interface BackupBundle {
  schemaVersion: number;
  exportedAt: string;
  data: AppData;
}

export function exportAppDataBackup(data: AppData): void {
  const bundle: BackupBundle = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `schoolhub-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseAppDataBackup(json: string): AppData {
  const parsed = JSON.parse(json) as BackupBundle | AppData;
  if ("data" in parsed && parsed.data) {
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      console.warn(`Backup schema ${parsed.schemaVersion} may differ from current ${SCHEMA_VERSION}`);
    }
    return parsed.data;
  }
  return parsed as AppData;
}
