import { useState, useMemo } from "react";

export function usePagination<T>(items: T[], pageSize: number = 20) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginated = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );
  const reset = () => setPage(1);
  return { paginated, page, setPage, totalPages, reset };
}
