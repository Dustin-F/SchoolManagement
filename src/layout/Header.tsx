import { useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useAppStore } from "@/store";
import { toast } from "sonner";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/classes": "Classes",
  "/students": "Students",
  "/teachers": "Teachers",
  "/subjects": "Subjects",
  "/attendance": "Attendance",
  "/behaviour": "Behaviour",
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const resetToSeed = useAppStore((s) => s.resetToSeed);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Match exact path or the first segment for nested routes
  const basePath = "/" + (location.pathname.split("/")[1] || "");
  const title = pageTitles[basePath] || "SchoolHub";

  const handleClearAllData = () => {
    resetToSeed();
    setConfirmClearOpen(false);
    toast.success("All app data cleared.");
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmClearOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear all data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all app data?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes all students, classes, attendance, behaviour, and task data from this browser.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
