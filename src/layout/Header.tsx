import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Database,
  Download,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  getLastSyncError,
  getPendingSyncCount,
  getSyncStatus,
  getTableSyncHealth,
  subscribePendingSync,
  subscribeSyncError,
  subscribeSyncStatus,
  subscribeTableSyncHealth,
  type TableSyncHealth,
  flushCloudPersist,
} from "@/lib/storage";
import { exportAppDataBackup, parseAppDataBackup } from "@/lib/backupUtils";
import { storage } from "@/lib/storage";
import type { AppData } from "@/types";
import { AppBreadcrumb, useBreadcrumbCrumbs } from "@/components/AppBreadcrumb";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";

const THEME_STORAGE_KEY = "schoolhub-theme";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/classes": "Classes",
  "/students": "Students",
  "/teachers": "Teachers",
  "/subjects": "Subjects",
  "/attendance": "Attendance",
  "/points": "Points",
  "/behaviour": "Points",
  "/missing-work": "Incomplete & to-do",
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());
  const [syncError, setSyncError] = useState(getLastSyncError());
  const [tableHealth, setTableHealth] = useState(getTableSyncHealth);
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const resetToSeed = useAppStore((s) => s.resetToSeed);
  const hydrateFromCloud = useAppStore((s) => s.hydrateFromCloud);
  const [pendingCount, setPendingCount] = useState(getPendingSyncCount());

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains("dark"));
    const unsubStatus = subscribeSyncStatus(setSyncStatus);
    const unsubError = subscribeSyncError(setSyncError);
    const unsubHealth = subscribeTableSyncHealth(setTableHealth);
    const unsubPending = subscribePendingSync(setPendingCount);
    return () => {
      unsubStatus();
      unsubError();
      unsubHealth();
      unsubPending();
    };
  }, []);

  const syncLabel =
    syncStatus === "error"
      ? syncError
        ? `Sync error (${syncError.table})`
        : "Sync error"
      : syncStatus === "syncing"
        ? "Syncing..."
        : syncStatus === "synced"
          ? "Synced"
          : null;

  const syncLabelClass = cn(
    "text-xs font-medium",
    syncStatus === "error" && "text-red-600 dark:text-red-400",
    syncStatus === "synced" && "text-green-600 dark:text-green-400",
    syncStatus === "syncing" && "text-amber-600 dark:text-amber-400"
  );

  function renderHealthIcon(entry: TableSyncHealth) {
    if (entry.state === "ok") {
      return <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />;
    }
    if (entry.state === "error") {
      return <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />;
    }
    if (entry.state === "syncing") {
      return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-600 dark:text-amber-400" />;
    }
    return <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" />;
  }

  // Match exact path or the first segment for nested routes
  const basePath = "/" + (location.pathname.split("/")[1] || "");
  const title = pageTitles[basePath] || "SchoolHub";
  const breadcrumbCrumbs = useBreadcrumbCrumbs();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed out.");
  };

  const handleLoadDemoData = async () => {
    resetToSeed();
    setDemoDialogOpen(false);
    try {
      await flushCloudPersist();
      toast.success("Demo data loaded.");
    } catch {
      toast.success("Demo data loaded locally. Cloud sync will retry shortly.");
    }
  };

  const handleExportBackup = () => {
    const s = useAppStore.getState();
    exportAppDataBackup({
      teachers: s.teachers,
      students: s.students,
      classes: s.classes,
      subjects: s.subjects,
      attendance: s.attendance,
      behaviourSkills: s.behaviourSkills,
      pointEvents: s.pointEvents,
      classTasks: s.classTasks,
      studentTaskRecords: s.studentTaskRecords,
      classSessionNotes: s.classSessionNotes,
      classScheduleEvents: s.classScheduleEvents,
      classSessionExceptions: s.classSessionExceptions,
      academicTerms: s.academicTerms,
      taskAssessmentCategories: s.taskAssessmentCategories,
      termGrades: s.termGrades,
    });
    toast.success("Backup downloaded.");
  };

  const handleImportBackup = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = parseAppDataBackup(text);
        hydrateFromCloud(data);
        (Object.keys(data) as (keyof AppData)[]).forEach((key) => {
          storage.set(key, data[key]);
        });
        toast.success("Backup imported. Syncing to cloud…");
      } catch {
        toast.error("Could not read backup file.");
      }
    };
    input.click();
  };

  const handleToggleTheme = () => {
    const next = !darkMode;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    setDarkMode(next);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-primary/20 bg-white/75 px-4 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-white/60 sm:px-6 dark:border-primary/15 dark:bg-background/75 dark:supports-backdrop-filter:bg-background/60">
      <div className="flex min-w-0 flex-1 items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mr-2 lg:hidden"
          onClick={() => onMenuClick?.()}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        {breadcrumbCrumbs ? (
          <AppBreadcrumb crumbs={breadcrumbCrumbs} />
        ) : (
          <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">{title}</h1>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        {pendingCount > 0 && (
          <span className="mr-1 hidden text-xs font-medium text-amber-600 dark:text-amber-400 sm:inline">
            {pendingCount} pending
          </span>
        )}
        {syncLabel ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "inline-flex h-8 max-w-[4.5rem] px-2 sm:mr-1 sm:max-w-[240px]",
                  syncLabelClass
                )}
                aria-label="Cloud sync status — click for details"
              >
                <span className="hidden truncate sm:inline">{syncLabel}</span>
                <Loader2
                  className={cn(
                    "h-4 w-4 shrink-0 sm:hidden",
                    syncStatus !== "syncing" && "hidden"
                  )}
                />
                <CheckCircle2
                  className={cn(
                    "h-4 w-4 shrink-0 sm:hidden",
                    syncStatus !== "synced" && "hidden"
                  )}
                />
                <AlertCircle
                  className={cn(
                    "h-4 w-4 shrink-0 sm:hidden",
                    syncStatus !== "error" && "hidden"
                  )}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <p className="px-2 py-1.5 text-sm font-semibold">Cloud sync</p>
              <DropdownMenuSeparator />
              <div className="max-h-72 overflow-y-auto px-1 py-1">
                {tableHealth.map((entry) => (
                  <div
                    key={entry.table}
                    className="flex gap-2 rounded-sm px-2 py-1.5 text-sm"
                  >
                    {renderHealthIcon(entry)}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "font-medium leading-tight",
                          entry.state === "ok" && "text-green-700 dark:text-green-400",
                          entry.state === "error" && "text-red-700 dark:text-red-400"
                        )}
                      >
                        {entry.label}
                      </p>
                      {entry.state === "error" && entry.message ? (
                        <p className="mt-0.5 text-xs text-muted-foreground break-words">
                          {entry.message}
                        </p>
                      ) : entry.state === "ok" ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">Connected</p>
                      ) : entry.state === "syncing" ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">Syncing…</p>
                      ) : (
                        <p className="mt-0.5 text-xs text-muted-foreground">Not checked yet</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {syncStatus === "error" && syncError ? (
                <>
                  <DropdownMenuSeparator />
                  <p className="px-2 pb-2 text-xs text-muted-foreground">
                    Some data could not sync to the cloud. Check your connection and settings, then refresh the
                    page.
                  </p>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          onClick={handleToggleTheme}
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDemoDialogOpen(true)}>
              <Database className="mr-2 h-4 w-4" />
              Load demo data
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportBackup}>
              <Download className="mr-2 h-4 w-4" />
              Export school backup
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleImportBackup}>
              <Upload className="mr-2 h-4 w-4" />
              Import school backup
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Load demo data?</AlertDialogTitle>
              <AlertDialogDescription>
                This replaces all your current school data with sample teachers, students, classes,
                attendance, points, and tasks. Your cloud data will be overwritten after
                sync.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLoadDemoData}>Load demo data</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </header>
  );
}
