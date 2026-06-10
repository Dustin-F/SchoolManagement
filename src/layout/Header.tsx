import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Database,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
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
  getSyncStatus,
  getTableSyncHealth,
  subscribeSyncError,
  subscribeSyncStatus,
  subscribeTableSyncHealth,
  type TableSyncHealth,
} from "@/lib/storage";
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

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains("dark"));
    const unsubStatus = subscribeSyncStatus(setSyncStatus);
    const unsubError = subscribeSyncError(setSyncError);
    const unsubHealth = subscribeTableSyncHealth(setTableHealth);
    return () => {
      unsubStatus();
      unsubError();
      unsubHealth();
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

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed out.");
  };

  const handleLoadDemoData = () => {
    resetToSeed();
    setDemoDialogOpen(false);
    toast.success("Demo data loaded. Syncing to cloud…");
  };

  const handleToggleTheme = () => {
    const next = !darkMode;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    setDarkMode(next);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex items-center">
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
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-1">
        {syncLabel ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn("inline-flex h-8 px-2 mr-1 max-w-[200px] sm:max-w-[240px]", syncLabelClass)}
                aria-label="Cloud sync status — click for details"
              >
                {syncLabel}
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
                    Fix the failed items in Supabase (see SUPABASE_SETUP.md), then refresh the
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
