/** Run a DOM/state update with a cross-element view transition when supported. */
export function withViewTransition(update: () => void): void {
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    document.startViewTransition(update);
  } else {
    update();
  }
}

export function seatViewTransitionName(studentId: string): string {
  return `seat-student-${studentId}`;
}
