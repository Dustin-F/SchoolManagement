import { useMemo, useState } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { GripVertical, Minus, Plus, Sparkles } from "lucide-react";
import type { AttendanceStatus, SchoolClass, Student } from "@/types";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { getStudentSeatNames } from "@/lib/displayHelpers";
import { toast } from "sonner";
import {
  MAX_SEAT_COLUMNS,
  MAX_SEAT_ROWS,
  MIN_SEAT_COLUMNS,
  MIN_SEAT_ROWS,
  autoSeatRows,
  ensureLayoutFitsStudents,
  getSeatColumns,
  getSeatRows,
  parseSeatCellId,
  reconcileSeatGrid,
  resizeSeatGrid,
  resolveSeatGrid,
  seatCellId,
  seatDropId,
  swapSeatCells,
} from "@/lib/seatingUtils";
import { seatViewTransitionName, withViewTransition } from "@/lib/viewTransition";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

const attendanceDotClass: Record<AttendanceStatus, string> = {
  present: "bg-emerald-500",
  absent: "bg-red-500",
  late: "bg-amber-500",
  excused: "bg-blue-500",
};

const attendanceLabels: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
};

interface ClassSeatingGridProps {
  cls: SchoolClass;
  students: Student[];
  selectedStudentId: string | null;
  onSelectStudent: (studentId: string) => void;
  pointsTodayByStudent: Map<string, number>;
  getAttendanceStatus: (studentId: string) => AttendanceStatus | null;
}

interface DragHandleProps {
  ref: (element: HTMLElement | null) => void;
  listeners: SyntheticListenerMap | undefined;
  attributes: DraggableAttributes;
}

interface SeatCardProps {
  student: Student;
  selected: boolean;
  points: number;
  attendance: AttendanceStatus | null;
  onSelect: () => void;
  dragHandle?: DragHandleProps;
  isDragOverlay?: boolean;
  style?: CSSProperties;
}

function SeatCard({
  student,
  selected,
  points,
  attendance,
  onSelect,
  dragHandle,
  isDragOverlay,
  style,
}: SeatCardProps) {
  const names = getStudentSeatNames(student);
  const hasAnyName = names.english || names.pinyin || names.chinese;

  return (
    <div
      className={cn(
        "relative flex h-full min-h-[7.5rem] flex-col items-center justify-center rounded-xl border p-2 text-center",
        selected
          ? "border-primary bg-primary/10 ring-2 ring-primary/30"
          : "border-border bg-card hover:border-primary/40",
        isDragOverlay && "shadow-lg ring-2 ring-primary/40"
      )}
      style={style}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {dragHandle ? (
        <button
          type="button"
          ref={dragHandle.ref}
          className="absolute left-1 top-1 z-10 flex h-7 w-7 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted/80 active:cursor-grabbing"
          title="Drag to move seat"
          aria-label="Drag to move seat"
          onClick={(e) => e.stopPropagation()}
          {...dragHandle.listeners}
          {...dragHandle.attributes}
        >
          <GripVertical className="h-4 w-4 opacity-70" />
        </button>
      ) : (
        <div
          className="absolute left-1.5 top-1.5 text-muted-foreground"
          aria-hidden
        >
          <GripVertical className="h-3.5 w-3.5 opacity-50" />
        </div>
      )}

      <span
        className={cn(
          "absolute right-2 top-2 h-2.5 w-2.5 rounded-full ring-2 ring-background",
          attendance ? attendanceDotClass[attendance] : "bg-muted-foreground/40"
        )}
        title={attendance ? attendanceLabels[attendance] : "No attendance marked"}
        aria-hidden
      />

      <div className="mt-1 flex w-full min-w-0 flex-col items-center justify-center gap-0.5 px-0.5">
        {names.english && (
          <p className="line-clamp-2 w-full text-[11px] font-semibold leading-tight text-foreground sm:text-xs">
            {names.english}
          </p>
        )}
        {names.pinyin && (
          <p className="line-clamp-1 w-full text-[10px] leading-tight text-muted-foreground sm:text-[11px]">
            {names.pinyin}
          </p>
        )}
        {names.chinese && (
          <p className="line-clamp-1 w-full text-[11px] leading-tight text-foreground sm:text-xs">
            {names.chinese}
          </p>
        )}
        {!hasAnyName && (
          <p className="text-[11px] text-muted-foreground sm:text-xs">Unnamed student</p>
        )}
      </div>
      <span
        className={cn(
          "mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums sm:text-xs",
          points > 0 && "text-emerald-600 dark:text-emerald-400",
          points < 0 && "text-amber-600 dark:text-amber-400",
          points === 0 && "text-muted-foreground"
        )}
      >
        <Sparkles className="h-3 w-3" />
        {points > 0 ? `+${points}` : points}
      </span>
    </div>
  );
}

function EmptySeatCell({
  isDragOverlay,
  isDropTarget,
  isVacated,
}: {
  isDragOverlay?: boolean;
  isDropTarget?: boolean;
  isVacated?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[7.5rem] items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/15",
        isDragOverlay && "border-primary/50 bg-primary/5",
        isDropTarget && "border-primary/60 bg-primary/10 ring-2 ring-primary/25",
        isVacated && "border-primary/30 bg-primary/5"
      )}
      aria-hidden
    />
  );
}

function SeatGridCell({
  seatIndex,
  student,
  selected,
  points,
  attendance,
  onSelect,
}: {
  seatIndex: number;
  student: Student | null;
  selected: boolean;
  points: number;
  attendance: AttendanceStatus | null;
  onSelect: () => void;
}) {
  const dropId = seatDropId(seatIndex);
  const dragId = seatCellId(seatIndex);

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dropId,
    data: { seatIndex },
  });
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    setActivatorNodeRef,
    isDragging,
  } = useDraggable({
    id: dragId,
    disabled: !student,
    data: { seatIndex },
  });

  const isDropTarget = isOver && !isDragging;

  return (
    <div ref={setDropRef} className="relative h-full">
      {!student ? (
        <EmptySeatCell isDropTarget={isDropTarget} />
      ) : (
        <>
          <div ref={setDragRef} className={cn("h-full", isDragging && "invisible")}>
            <SeatCard
              student={student}
              selected={selected}
              points={points}
              attendance={attendance}
              onSelect={onSelect}
              dragHandle={{
                ref: setActivatorNodeRef,
                listeners,
                attributes,
              }}
              style={{ viewTransitionName: seatViewTransitionName(student.id) } as CSSProperties}
            />
          </div>
          {isDragging && (
            <div className="absolute inset-0">
              <EmptySeatCell isVacated />
            </div>
          )}
        </>
      )}
      {student && isDropTarget && (
        <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-primary/50" />
      )}
    </div>
  );
}

export function ClassSeatingGrid({
  cls,
  students,
  selectedStudentId,
  onSelectStudent,
  pointsTodayByStudent,
  getAttendanceStatus,
}: ClassSeatingGridProps) {
  const updateClass = useAppStore((s) => s.updateClass);
  const enrolledIds = cls.studentIds;
  const columns = getSeatColumns(cls);
  const grid = useMemo(() => resolveSeatGrid(cls, enrolledIds), [cls, enrolledIds]);
  const studentById = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const [activeCellId, setActiveCellId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const activeIndex = activeCellId ? parseSeatCellId(activeCellId) : null;
  const activeStudentId =
    activeIndex != null && activeIndex >= 0 ? grid[activeIndex] : null;
  const activeStudent = activeStudentId ? studentById.get(activeStudentId) : null;

  const persistGrid = (nextGrid: (string | null)[]) => {
    updateClass(cls.id, { seatGrid: nextGrid });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCellId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    const from =
      (active.data.current?.seatIndex as number | undefined) ??
      parseSeatCellId(String(active.id));
    const to =
      (over?.data.current?.seatIndex as number | undefined) ??
      (over ? parseSeatCellId(String(over.id)) : null);

    setActiveCellId(null);

    if (from == null || to == null || from === to) return;

    const nextGrid = swapSeatCells(grid, from, to);
    withViewTransition(() => {
      persistGrid(nextGrid);
    });
  };

  const handleDragCancel = () => setActiveCellId(null);

  return (
    <div className="space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div
          className="grid gap-2 sm:gap-3"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {grid.map((studentId, index) => {
            const student = studentId ? studentById.get(studentId) : null;
            return (
              <SeatGridCell
                key={seatCellId(index)}
                seatIndex={index}
                student={student ?? null}
                selected={!!studentId && selectedStudentId === studentId}
                points={studentId ? (pointsTodayByStudent.get(studentId) ?? 0) : 0}
                attendance={studentId ? getAttendanceStatus(studentId) : null}
                onSelect={() => studentId && onSelectStudent(studentId)}
              />
            );
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeStudent ? (
            <SeatCard
              student={activeStudent}
              selected={selectedStudentId === activeStudent.id}
              points={pointsTodayByStudent.get(activeStudent.id) ?? 0}
              attendance={getAttendanceStatus(activeStudent.id)}
              onSelect={() => {}}
              isDragOverlay
            />
          ) : activeCellId ? (
            <EmptySeatCell isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

interface LayoutStepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

function LayoutStepper({ label, value, min, max, onChange }: LayoutStepperProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-xs text-muted-foreground">{label}</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-7 w-7"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        aria-label={`Decrease ${label}`}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums">{value}</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-7 w-7"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        aria-label={`Increase ${label}`}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

interface SeatLayoutPickerProps {
  cls: SchoolClass;
}

function clampRows(n: number): number {
  return Math.min(MAX_SEAT_ROWS, Math.max(MIN_SEAT_ROWS, n));
}

export function SeatLayoutPicker({ cls }: SeatLayoutPickerProps) {
  const updateClass = useAppStore((s) => s.updateClass);
  const enrolledIds = cls.studentIds;
  const columns = getSeatColumns(cls);
  const rows = getSeatRows(cls, enrolledIds.length);
  const autoRows = cls.seatRows == null;
  const grid = resolveSeatGrid(cls, enrolledIds);

  const applyLayout = (nextCols: number, nextRows: number | undefined, fixedRows: boolean) => {
    const oldCols = getSeatColumns(cls);
    const oldRows = getSeatRows(cls, enrolledIds.length);
    const requestedRows = fixedRows
      ? clampRows(nextRows ?? rows)
      : autoSeatRows({ ...cls, seatColumns: nextCols }, enrolledIds.length);

    const { columns: fitCols, rows: fitRows, wasClamped } = ensureLayoutFitsStudents(
      nextCols,
      requestedRows,
      enrolledIds.length
    );

    let nextGrid = resizeSeatGrid(grid, oldCols, oldRows, fitCols, fitRows, enrolledIds);
    nextGrid = reconcileSeatGrid(nextGrid, fitCols, fitRows, enrolledIds);

    updateClass(cls.id, {
      seatColumns: fitCols,
      seatRows: fixedRows ? fitRows : undefined,
      seatGrid: nextGrid,
    });

    if (wasClamped) {
      toast.info(`Expanded to ${fitCols}×${fitRows} so all ${enrolledIds.length} students stay on the plan.`);
    }
  };

  return (
    <div className="mb-3 flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-4">
        <LayoutStepper
          label="Cols"
          value={columns}
          min={MIN_SEAT_COLUMNS}
          max={MAX_SEAT_COLUMNS}
          onChange={(n) => applyLayout(n, rows, !autoRows)}
        />
        <LayoutStepper
          label="Rows"
          value={rows}
          min={MIN_SEAT_ROWS}
          max={MAX_SEAT_ROWS}
          onChange={(n) => applyLayout(columns, n, true)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={autoRows ? "default" : "outline"}
          className="h-7 text-xs"
          onClick={() => applyLayout(columns, undefined, false)}
        >
          Auto rows
        </Button>
        <Button
          type="button"
          size="sm"
          variant={autoRows ? "outline" : "default"}
          className="h-7 text-xs"
          onClick={() => applyLayout(columns, rows, true)}
        >
          Fixed rows
        </Button>
        <span className="text-xs text-muted-foreground">
          {columns}×{rows} = {columns * rows} desks · {enrolledIds.length} students · drag{" "}
          <GripVertical className="inline h-3 w-3 align-text-bottom" /> to move · tap card for
          details
        </span>
      </div>
    </div>
  );
}
