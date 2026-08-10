import * as React from "react";
import { useCallback, useRef, useState } from "react";
import { LoaderIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

const POINTER_PULL = 0.28;
const POINTER_MAX_OFFSET = 72;

export function SpinnerCustom({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = (event.clientX - centerX) * POINTER_PULL;
    let dy = (event.clientY - centerY) * POINTER_PULL;

    const distance = Math.hypot(dx, dy);
    if (distance > POINTER_MAX_OFFSET) {
      const scale = POINTER_MAX_OFFSET / distance;
      dx *= scale;
      dy *= scale;
    }

    setOffset({ x: dx, y: dy });
    setHovering(true);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setOffset({ x: 0, y: 0 });
    setHovering(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex min-h-screen w-full cursor-default items-center justify-center",
        className
      )}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div
        className="transition-transform duration-300 ease-out will-change-transform"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${hovering ? 1.1 : 1})`,
        }}
      >
        <Spinner className="size-16 text-primary" />
      </div>
    </div>
  );
}

export { Spinner };
