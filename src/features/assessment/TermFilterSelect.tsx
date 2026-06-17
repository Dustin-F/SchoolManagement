import type { AcademicTerm } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { termLabel } from "@/lib/assessmentUtils";

interface TermFilterSelectProps {
  terms: AcademicTerm[];
  value: string;
  onChange: (termId: string) => void;
  includeAll?: boolean;
  className?: string;
}

export function TermFilterSelect({
  terms,
  value,
  onChange,
  includeAll = true,
  className,
}: TermFilterSelectProps) {
  const sorted = [...terms].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "h-8 w-[11rem] text-xs"}>
        <SelectValue placeholder="Term" />
      </SelectTrigger>
      <SelectContent>
        {includeAll && <SelectItem value="all">All terms</SelectItem>}
        {sorted.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {termLabel(t)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
