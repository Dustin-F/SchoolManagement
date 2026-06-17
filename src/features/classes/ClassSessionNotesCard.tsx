import { useEffect, useRef, useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store";
import { findSessionNote } from "@/lib/sessionNotesUtils";
import { cn, formatDate } from "@/lib/utils";

interface ClassSessionNotesCardProps {
  classId: string;
  sessionDate: string;
  eventId?: string;
  occurrenceDate?: string;
  readOnly?: boolean;
}

type SaveState = "idle" | "pending" | "saved";

export function ClassSessionNotesCard({
  classId,
  sessionDate,
  eventId,
  occurrenceDate,
  readOnly = false,
}: ClassSessionNotesCardProps) {
  const upsertClassSessionNote = useAppStore((s) => s.upsertClassSessionNote);
  const upsertClassSession = useAppStore((s) => s.upsertClassSession);
  const note = useAppStore((s) =>
    findSessionNote(s.classSessionNotes, classId, sessionDate, eventId, occurrenceDate)
  );

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const skipNextSave = useRef(false);

  const lessonPrepared = note?.lessonPrepared ?? false;
  const radioName = `lesson-prepared-${classId}-${sessionDate}-${eventId ?? "default"}`;

  useEffect(() => {
    skipNextSave.current = true;
    const stored = findSessionNote(
      useAppStore.getState().classSessionNotes,
      classId,
      sessionDate,
      eventId,
      occurrenceDate
    );
    setTitle(stored?.title ?? "");
    setContent(stored?.content ?? "");
    setSaveState("idle");
  }, [classId, sessionDate, eventId, occurrenceDate]);

  useEffect(() => {
    if (readOnly) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    const stored = findSessionNote(
      useAppStore.getState().classSessionNotes,
      classId,
      sessionDate,
      eventId,
      occurrenceDate
    );
    const storedTitle = stored?.title ?? "";
    const storedContent = stored?.content ?? "";
    if (title === storedTitle && content === storedContent) {
      setSaveState("idle");
      return;
    }

    setSaveState("pending");
    const timer = window.setTimeout(() => {
      upsertClassSessionNote(classId, sessionDate, {
        title,
        content,
        eventId,
        occurrenceDate,
      });
      setSaveState("saved");
    }, 700);

    return () => window.clearTimeout(timer);
  }, [title, content, classId, sessionDate, eventId, occurrenceDate, readOnly, upsertClassSessionNote]);

  useEffect(() => {
    if (saveState !== "saved") return;
    const timer = window.setTimeout(() => setSaveState("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  const setLessonPrepared = (prepared: boolean) => {
    if (readOnly) return;
    upsertClassSession(classId, sessionDate, {
      eventId,
      occurrenceDate,
      lessonPrepared: prepared,
    });
  };

  const hasContent = Boolean(title.trim() || content.trim());

  return (
    <Card>
      <CardHeader className="pb-2">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 text-left"
          onClick={() => setOpen((v) => !v)}
        >
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              Lesson plan
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(sessionDate)}
              {lessonPrepared && " · Lesson prepared"}
              {!lessonPrepared && hasContent && " · Notes saved"}
              {!lessonPrepared && !hasContent && " · Paste or type your plan for this session"}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3 pt-0">
          <div className="space-y-2">
            <Label htmlFor="session-note-title">Title (optional)</Label>
            <Input
              id="session-note-title"
              placeholder="e.g. Unit 4 — Fractions"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-note-content">Plan &amp; notes</Label>
            <Textarea
              id="session-note-content"
              placeholder="Paste your lesson plan here — objectives, activities, homework…"
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={readOnly}
              className="min-h-[12rem] font-mono text-sm leading-relaxed"
            />
          </div>
          {!readOnly && (
            <p className="text-xs text-muted-foreground">
              {saveState === "pending" && "Saving…"}
              {saveState === "saved" && "Saved"}
              {saveState === "idle" && hasContent && "Auto-saves as you type"}
              {saveState === "idle" && !hasContent && "Clearing all text removes the note for this day"}
            </p>
          )}

          <div className="border-t border-border pt-3">
            <p className="text-sm font-medium">Lesson prepared?</p>
            <div className="mt-2 flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={radioName}
                  className="h-4 w-4 accent-primary"
                  checked={!lessonPrepared}
                  disabled={readOnly}
                  onChange={() => setLessonPrepared(false)}
                />
                Not yet
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={radioName}
                  className="h-4 w-4 accent-primary"
                  checked={lessonPrepared}
                  disabled={readOnly}
                  onChange={() => setLessonPrepared(true)}
                />
                Prepared
              </label>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
