export type StudentProfileLocationState = {
  from?: string;
};

const RETURN_STORAGE_KEY = "studentProfileReturnTo";

export function studentProfilePath(studentId: string, returnTo?: string): string {
  if (!returnTo) return `/students/${studentId}`;
  try {
    sessionStorage.setItem(RETURN_STORAGE_KEY, returnTo);
  } catch {
    // ignore storage errors (private mode, etc.)
  }
  return `/students/${studentId}?from=${encodeURIComponent(returnTo)}`;
}

/** @deprecated use studentProfilePath */
export function studentProfileLink(studentId: string, returnTo?: string) {
  return studentProfilePath(studentId, returnTo);
}

export function getStudentProfileBackPath(
  state: unknown,
  searchParams: URLSearchParams,
  fallback = "/students"
): string {
  const fromQuery = searchParams.get("from");
  if (fromQuery?.startsWith("/")) return fromQuery;

  const fromState = (state as StudentProfileLocationState | null)?.from;
  if (typeof fromState === "string" && fromState.startsWith("/")) return fromState;

  try {
    const stored = sessionStorage.getItem(RETURN_STORAGE_KEY);
    if (stored?.startsWith("/")) return stored;
  } catch {
    // ignore
  }

  return fallback;
}

export function classPageReturnTo(classId: string, search = ""): string {
  return `/classes/${classId}${search}`;
}

/** Append `from` so destination pages can show a back link. */
export function pathWithReturn(path: string, returnTo?: string): string {
  if (!returnTo?.startsWith("/")) return path;
  const [pathname, existingSearch = ""] = path.split("?");
  const params = new URLSearchParams(existingSearch);
  params.set("from", returnTo);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function getPageBackPath(
  searchParams: URLSearchParams,
  state: unknown,
  fallback: string
): string {
  return getStudentProfileBackPath(state, searchParams, fallback);
}

export function classNameFromReturnPath(
  returnPath: string,
  classes: Array<{ id: string; name: string }>
): string | undefined {
  const match = returnPath.match(/^\/classes\/([^/?#]+)/);
  if (!match) return undefined;
  return classes.find((c) => c.id === match[1])?.name;
}

export function readStudentReturnFrom(
  state: unknown,
  searchParams: URLSearchParams
): string | undefined {
  const fromQuery = searchParams.get("from");
  if (fromQuery?.startsWith("/")) return fromQuery;
  const fromState = (state as StudentProfileLocationState | null)?.from;
  if (typeof fromState === "string" && fromState.startsWith("/")) return fromState;
  return undefined;
}
