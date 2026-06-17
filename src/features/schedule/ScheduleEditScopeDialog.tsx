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
import type { ScheduleEditScope } from "@/types";

interface ScheduleEditScopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "edit" | "delete";
  onSelect: (scope: ScheduleEditScope) => void;
}

export function ScheduleEditScopeDialog({
  open,
  onOpenChange,
  action,
  onSelect,
}: ScheduleEditScopeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action === "edit" ? "Edit recurring session" : "Delete recurring session"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            This session is part of a repeating series. What would you like to change?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <AlertDialogAction
            className="w-full"
            onClick={() => {
              onSelect("occurrence");
              onOpenChange(false);
            }}
          >
            This session only
          </AlertDialogAction>
          <AlertDialogAction
            className="w-full"
            onClick={() => {
              onSelect("future");
              onOpenChange(false);
            }}
          >
            This and following sessions
          </AlertDialogAction>
          <AlertDialogAction
            className="w-full"
            onClick={() => {
              onSelect("series");
              onOpenChange(false);
            }}
          >
            Entire series
          </AlertDialogAction>
          <AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
