import { Check } from "lucide-react";

interface CheckboxListItem {
  id: string;
  label: string;
  sub?: string;
}

interface CheckboxListProps {
  items: CheckboxListItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  maxHeight?: string;
  emptyMessage?: string;
}

export function CheckboxList({
  items,
  selectedIds,
  onToggle,
  maxHeight = "10rem",
  emptyMessage = "No items available",
}: CheckboxListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-y-auto space-y-0.5 p-1.5" style={{ maxHeight }}>
      {items.map((item) => {
        const selected = selectedIds.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors cursor-pointer ${
              selected
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-foreground"
            }`}
          >
            <div
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                selected
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              }`}
            >
              {selected && <Check className="h-3 w-3 text-white" />}
            </div>
            <span className="truncate">{item.label}</span>
            {item.sub && (
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">{item.sub}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
