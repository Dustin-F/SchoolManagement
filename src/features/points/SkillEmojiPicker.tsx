import { useEffect, useRef, useState } from "react";
import { ChevronDown, Smile } from "lucide-react";
import { SKILL_EMOJI_GROUPS } from "@/lib/skillEmojis";
import { cn } from "@/lib/utils";

interface SkillEmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

function EmojiCell({
  emoji,
  selected,
  onPick,
}: {
  emoji: string;
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      title={emoji}
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-transparent text-xl transition-all duration-150",
        "hover:scale-105 hover:border-primary/25 hover:bg-primary/10 hover:shadow-sm",
        "active:scale-95",
        selected && "border-primary/40 bg-primary/15 ring-2 ring-primary/30"
      )}
      onClick={onPick}
    >
      {emoji}
    </button>
  );
}

export function SkillEmojiPicker({ value, onChange }: SkillEmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const pick = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-10 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors",
          "hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          open && "border-primary/40 ring-2 ring-ring/30"
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-lg",
              value ? "bg-primary/10" : "text-muted-foreground"
            )}
          >
            {value || <Smile className="h-4 w-4" />}
          </span>
          <span className="truncate text-muted-foreground">
            {value ? "Change emoji" : "Choose emoji (optional)"}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 opacity-50 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="listbox"
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+4px)] z-[200]",
            "overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150"
          )}
        >
          <div className="border-b border-border/80 bg-muted/30 px-3 py-2">
            <p className="text-xs font-medium text-foreground">Pick an emoji</p>
          </div>

          <div
            className="max-h-56 overflow-y-auto overscroll-y-contain p-3 [scrollbar-gutter:stable]"
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-2.5 py-1.5">
              <span className="text-xs text-muted-foreground">No emoji</span>
              <button
                type="button"
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
                  !value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => pick("")}
              >
                Skip
              </button>
            </div>

            {SKILL_EMOJI_GROUPS.map((group) => (
              <div key={group.label} className="mb-3 last:mb-0">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-1">
                  {group.emojis.map((emoji) => (
                    <EmojiCell
                      key={emoji}
                      emoji={emoji}
                      selected={value === emoji}
                      onPick={() => pick(emoji)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {value ? (
            <div className="flex items-center justify-center gap-2 border-t border-border bg-muted/20 px-3 py-2">
              <span className="text-xs text-muted-foreground">Selected</span>
              <span className="text-xl leading-none">{value}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
