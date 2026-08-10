import { useEffect } from "react";
import type { BehaviourSkill } from "@/types";

interface UseClassKeyboardShortcutsOptions {
  enabled?: boolean;
  toolbarSkills: BehaviourSkill[];
  selectedStudentId: string | null;
  onMarkPresent: (studentId: string) => void;
  onAwardSkill: (studentId: string, skill: BehaviourSkill) => void;
  onNextStudent: () => void;
}

export function useClassKeyboardShortcuts({
  enabled = true,
  toolbarSkills,
  selectedStudentId,
  onMarkPresent,
  onAwardSkill,
  onNextStudent,
}: UseClassKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "p" || e.key === "P") {
        if (!selectedStudentId) return;
        e.preventDefault();
        onMarkPresent(selectedStudentId);
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        onNextStudent();
        return;
      }

      const skillIndex = Number(e.key) - 1;
      if (skillIndex >= 0 && skillIndex < 4 && toolbarSkills[skillIndex] && selectedStudentId) {
        e.preventDefault();
        onAwardSkill(selectedStudentId, toolbarSkills[skillIndex]);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, toolbarSkills, selectedStudentId, onMarkPresent, onAwardSkill, onNextStudent]);
}
