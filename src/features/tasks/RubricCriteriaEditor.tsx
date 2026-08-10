import { Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RubricCriterion } from "@/types";

interface RubricCriteriaEditorProps {
  rubric: RubricCriterion[];
  onChange: (next: RubricCriterion[]) => void;
}

export function RubricCriteriaEditor({ rubric, onChange }: RubricCriteriaEditorProps) {
  const total = rubric.reduce((s, c) => s + (c.maxPoints ?? 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label>Criteria</Label>
          <p className="text-xs text-muted-foreground">
            Each criterion has a max. Student scores add up to the total
            {total > 0 && (
              <>
                {" "}
                (<strong className="text-foreground">{total}</strong> points)
              </>
            )}
            .
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onChange([...rubric, { id: nanoid(), label: "Criterion", maxPoints: 5 }])}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add criterion
        </Button>
      </div>
      {rubric.length === 0 ? (
        <p className="text-sm text-muted-foreground">Add at least one criterion.</p>
      ) : (
        <div className="space-y-2">
          {rubric.map((c, i) => (
            <div key={c.id} className="flex gap-2">
              <Input
                value={c.label}
                onChange={(e) =>
                  onChange(rubric.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                }
                placeholder="Criterion label"
              />
              <Input
                type="number"
                min={0}
                step={0.5}
                className="w-24"
                value={c.maxPoints ?? ""}
                onChange={(e) =>
                  onChange(
                    rubric.map((x, j) =>
                      j === i ? { ...x, maxPoints: Number(e.target.value) || 0 } : x
                    )
                  )
                }
                placeholder="Max"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => onChange(rubric.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
