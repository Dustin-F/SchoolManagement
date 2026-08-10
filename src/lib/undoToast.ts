import { toast } from "sonner";

export function showUndoToast(message: string, onUndo: () => void) {
  toast.success(message, {
    action: { label: "Undo", onClick: onUndo },
    duration: 5000,
  });
}
