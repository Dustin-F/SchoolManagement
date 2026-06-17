import { useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useAppStore } from "@/store";
import { classNameFromReturnPath, getPageBackPath } from "@/lib/studentNavigation";

export function usePageBack(fallback: string) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const classes = useAppStore((s) => s.classes);

  const fromParam = searchParams.get("from");
  const backPath = getPageBackPath(searchParams, location.state, fallback);
  const showBack = !!fromParam?.startsWith("/");

  const backLabel = useMemo(() => {
    const name = classNameFromReturnPath(backPath, classes);
    return name ? `Back to ${name}` : "Back";
  }, [backPath, classes]);

  return { backPath, showBack, backLabel };
}
