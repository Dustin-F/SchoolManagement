import type { AppData } from "@/types";
import { supabase } from "@/lib/supabase";

type StorageKey = keyof AppData;

const TABLE_BY_KEY: Record<StorageKey, string> = {
  teachers: "app_teachers",
  students: "app_students",
  classes: "app_classes",
  subjects: "app_subjects",
  attendance: "app_attendance",
  behaviourSkills: "app_behaviour_skills",
  pointEvents: "app_point_events",
  classTasks: "app_class_tasks",
  studentTaskRecords: "app_student_task_records",
};

let currentUserId: string | null = null;
let getStateSnapshot: (() => AppData) | null = null;
const memory: Partial<Record<StorageKey, unknown>> = {};
let persistTimer: ReturnType<typeof setTimeout> | null = null;
const pendingKeys = new Set<StorageKey>();
type SyncStatus = "idle" | "syncing" | "synced" | "error";

export interface SyncErrorInfo {
  table: string;
  message: string;
}

export type TableSyncState = "unknown" | "syncing" | "ok" | "error";

export interface TableSyncHealth {
  table: string;
  label: string;
  state: TableSyncState;
  message?: string;
}

const TABLE_LABELS: Record<string, string> = {
  app_teachers: "Teachers",
  app_students: "Students",
  app_classes: "Classes",
  app_subjects: "Subjects",
  app_attendance: "Attendance",
  app_behaviour_skills: "Point skills",
  app_point_events: "Point events",
  app_class_tasks: "Class tasks",
  app_student_task_records: "Task records",
  config: "Environment (.env)",
};

const ALL_SYNC_TABLES = [...Object.values(TABLE_BY_KEY), "config"] as const;

let syncStatus: SyncStatus = "idle";
let lastSyncError: SyncErrorInfo | null = null;
const tableHealth = new Map<string, TableSyncHealth>();
const syncListeners = new Set<(status: SyncStatus) => void>();
const errorListeners = new Set<(error: SyncErrorInfo | null) => void>();
const healthListeners = new Set<(health: TableSyncHealth[]) => void>();
const pendingListeners = new Set<(count: number) => void>();

function notifyPendingListeners() {
  const count = pendingKeys.size;
  for (const listener of pendingListeners) {
    listener(count);
  }
}

function buildDefaultTableHealth(): TableSyncHealth[] {
  return ALL_SYNC_TABLES.map((table) => ({
    table,
    label: TABLE_LABELS[table] ?? table,
    state: "unknown" as const,
  }));
}

function resetTableHealth() {
  tableHealth.clear();
  for (const entry of buildDefaultTableHealth()) {
    tableHealth.set(entry.table, entry);
  }
  notifyHealthListeners();
}

function notifyHealthListeners() {
  const snapshot = getTableSyncHealth();
  for (const listener of healthListeners) {
    listener(snapshot);
  }
}

function setTableHealth(table: string, state: TableSyncState, message?: string) {
  const label = TABLE_LABELS[table] ?? table;
  tableHealth.set(table, { table, label, state, message });
  notifyHealthListeners();
}

resetTableHealth();

export const SCHEMA_VERSION = 1;

function setSyncStatus(next: SyncStatus) {
  syncStatus = next;
  for (const listener of syncListeners) {
    listener(next);
  }
}

function setSyncError(error: SyncErrorInfo | null) {
  lastSyncError = error;
  for (const listener of errorListeners) {
    listener(error);
  }
}

function reportSyncFailure(table: string, message: string) {
  console.error(`Cloud sync failed (${table}):`, message);
  setTableHealth(table, "error", message);
  setSyncError({ table, message });
  setSyncStatus("error");
}

export function getTableSyncHealth(): TableSyncHealth[] {
  return ALL_SYNC_TABLES.map(
    (table) =>
      tableHealth.get(table) ?? {
        table,
        label: TABLE_LABELS[table] ?? table,
        state: "unknown",
      }
  );
}

export function subscribeTableSyncHealth(listener: (health: TableSyncHealth[]) => void) {
  healthListeners.add(listener);
  return () => {
    healthListeners.delete(listener);
  };
}

export function getLastSyncError(): SyncErrorInfo | null {
  return lastSyncError;
}

export function subscribeSyncError(listener: (error: SyncErrorInfo | null) => void) {
  errorListeners.add(listener);
  return () => {
    errorListeners.delete(listener);
  };
}

export function getSyncStatus(): SyncStatus {
  return syncStatus;
}

export function subscribeSyncStatus(listener: (status: SyncStatus) => void) {
  syncListeners.add(listener);
  return () => {
    syncListeners.delete(listener);
  };
}

export function getPendingSyncCount(): number {
  return pendingKeys.size;
}

export function subscribePendingSync(listener: (count: number) => void) {
  pendingListeners.add(listener);
  listener(pendingKeys.size);
  return () => {
    pendingListeners.delete(listener);
  };
}

function schedulePersist(keys: StorageKey[]) {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    reportSyncFailure("config", "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
    return;
  }
  if (!currentUserId || !getStateSnapshot) return;
  keys.forEach((k) => pendingKeys.add(k));
  notifyPendingListeners();
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    void persistNow();
  }, 350);
}

async function persistNow() {
  if (!currentUserId || !getStateSnapshot) return;
  const payload = getStateSnapshot();
  const keys = Array.from(pendingKeys);
  pendingKeys.clear();
  notifyPendingListeners();
  if (keys.length === 0) return;
  setSyncStatus("syncing");
  let hadFailure = false;

  for (const key of keys) {
    const table = TABLE_BY_KEY[key];
    setTableHealth(table, "syncing");
    const value = payload[key] as unknown;
    if (!Array.isArray(value)) continue;
    const rows = value.filter((v) => v && typeof v === "object" && "id" in (v as object)) as Array<
      Record<string, unknown>
    >;
    const ids = rows.map((r) => String(r.id));

    const { data: existingRows, error: selectError } = await supabase
      .from(table)
      .select("id")
      .eq("user_id", currentUserId);
    if (selectError) {
      reportSyncFailure(table, selectError.message);
      hadFailure = true;
      continue;
    }

    const existingIds = (existingRows ?? []).map((r) => String((r as { id: string }).id));
    const toDelete = existingIds.filter((id) => !ids.includes(id));
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq("user_id", currentUserId)
        .in("id", toDelete);
      if (deleteError) {
        reportSyncFailure(table, deleteError.message);
        hadFailure = true;
        continue;
      }
    }

    if (rows.length > 0) {
      const { error: upsertError } = await supabase.from(table).upsert(
        rows.map((r) => ({
          user_id: currentUserId,
          id: String(r.id),
          data: r,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "user_id,id" }
      );
      if (upsertError) {
        reportSyncFailure(table, upsertError.message);
        hadFailure = true;
        continue;
      }
    }
    setTableHealth(table, "ok");
  }

  if (hadFailure) {
    setSyncStatus("error");
    return;
  }
  setSyncError(null);
  setSyncStatus("synced");
}

export async function initializeCloudForUser(userId: string): Promise<Partial<AppData>> {
  currentUserId = userId;
  const payload: Partial<Record<StorageKey, unknown[]>> = {};
  for (const k of Object.keys(TABLE_BY_KEY) as StorageKey[]) {
    delete memory[k];
  }
  for (const key of Object.keys(TABLE_BY_KEY) as StorageKey[]) {
    const table = TABLE_BY_KEY[key];
    setTableHealth(table, "syncing");
    const { data, error } = await supabase
      .from(table)
      .select("data")
      .eq("user_id", userId)
      .order("updated_at", { ascending: true });
    if (error) {
      console.error(`Failed to load ${table}:`, error.message);
      reportSyncFailure(table, error.message);
      payload[key] = [];
      memory[key] = [];
      continue;
    }
    const list = (data ?? []).map((r) => (r as { data: unknown }).data);
    payload[key] = list;
    memory[key] = list;
    setTableHealth(table, "ok");
  }
  if (
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !lastSyncError
  ) {
    setTableHealth("config", "ok");
  }
  if (pendingKeys.size === 0 && !lastSyncError) {
    setSyncStatus("synced");
  }
  return payload as Partial<AppData>;
}

export function clearCloudUser() {
  currentUserId = null;
  pendingKeys.clear();
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  for (const k of Object.keys(memory) as StorageKey[]) {
    delete memory[k];
  }
  setSyncError(null);
  setSyncStatus("idle");
  resetTableHealth();
}

export function connectCloudPersistence(getter: () => AppData) {
  getStateSnapshot = getter;
}

export const storage = {
  get<T>(key: string): T | null {
    const k = key as StorageKey;
    return (memory[k] as T | undefined) ?? null;
  },

  set<T>(key: string, value: T): boolean {
    const k = key as StorageKey;
    memory[k] = value as unknown;
    schedulePersist([k]);
    return true;
  },

  remove(key: string): void {
    const k = key as StorageKey;
    delete memory[k];
    schedulePersist([k]);
  },

  clear(): void {
    for (const k of Object.keys(memory) as StorageKey[]) {
      delete memory[k];
    }
    schedulePersist(Object.keys(TABLE_BY_KEY) as StorageKey[]);
  },
};
