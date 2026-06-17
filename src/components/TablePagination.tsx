import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TablePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

export function TablePagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  className,
}: TablePaginationProps) {
  if (totalItems === 0) return null;

  const showPager = totalPages > 1;
  const pageSizeSelect = onPageSizeChange && pageSize != null && (
    <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
      <SelectTrigger className="h-9 w-[110px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {pageSizeOptions.map((size) => (
          <SelectItem key={size} value={String(size)}>
            {size} / page
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className={className ?? "mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {showPager && <span>Page {page} of {totalPages}</span>}
        {(showPager || !pageSizeSelect) && (
          <span>
            {showPager && "· "}
            {totalItems} result{totalItems !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {pageSizeSelect}
        {showPager && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
