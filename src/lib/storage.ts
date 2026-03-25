import { toast } from "sonner";

const STORAGE_KEY = "schoolhub_data";
export const SCHEMA_VERSION = 1;

const SCHEMA_VERSION_STORAGE_KEY = `${STORAGE_KEY}_schema_version`;

export function migrateStudentTaskRecordsCompletedField(): void {
  try {
    const rawVersion = localStorage.getItem(SCHEMA_VERSION_STORAGE_KEY);
    const version = rawVersion ? Number(rawVersion) : 0;
    if (version >= SCHEMA_VERSION) return;

    const taskRecordsKey = `${STORAGE_KEY}_studentTaskRecords`;
    const raw = localStorage.getItem(taskRecordsKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          const cleaned = parsed.map((r) => {
            if (!r || typeof r !== "object") return r;
            const rec = r as Record<string, unknown>;
            if (!("completed" in rec)) return rec;
            const { completed, ...rest } = rec;
            return rest;
          });
          localStorage.setItem(taskRecordsKey, JSON.stringify(cleaned));
        }
      } catch {
        // If parsing fails, don't block the app; just continue migration gating.
      }
    }

    localStorage.setItem(SCHEMA_VERSION_STORAGE_KEY, String(SCHEMA_VERSION));
  } catch {
    // If localStorage is unavailable, skip migration.
  }
}

export const storage = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_${key}`);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
      toast.error("Failed to save changes. Your browser storage may be full.");
      return false;
    }
  },

  remove(key: string): void {
    localStorage.removeItem(`${STORAGE_KEY}_${key}`);
  },

  clear(): void {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(STORAGE_KEY))
      .forEach((k) => localStorage.removeItem(k));
  },
};
