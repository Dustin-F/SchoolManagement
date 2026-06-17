import { useState, useMemo, useEffect, useCallback } from "react";

export function usePagination<T>(items: T[], pageSize: number = 20) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const paginated = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  const reset = useCallback(() => setPage(1), []);

  return { paginated, page: safePage, setPage, totalPages, reset };
}
