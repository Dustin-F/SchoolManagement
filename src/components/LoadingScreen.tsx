import { useEffect, useRef, useState } from "react";
import { GraduationCap, LoaderIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FallingStar {
  id: number;
  x: number;
  y: number;
  speed: number;
  size: number;
}

const CATCH_RADIUS = 34;
const CATCHER_LERP = 0.2;
const SPAWN_INTERVAL_S = 0.5;

export function LoadingScreen() {
  const arenaRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const catcherRef = useRef({ x: 0, y: 0 });
  const starsRef = useRef<FallingStar[]>([]);
  const starIdRef = useRef(0);
  const spawnTimerRef = useRef(0);

  const [score, setScore] = useState(0);
  const [catcher, setCatcher] = useState({ x: 0, y: 0 });
  const [stars, setStars] = useState<FallingStar[]>([]);
  const [arenaReady, setArenaReady] = useState(false);

  useEffect(() => {
    const arena = arenaRef.current;
    if (!arena) return;

    const initPositions = () => {
      const rect = arena.getBoundingClientRect();
      const center = { x: rect.width / 2, y: rect.height / 2 };
      pointerRef.current = center;
      catcherRef.current = center;
      setCatcher(center);
      setArenaReady(true);
    };

    initPositions();

    const onPointerMove = (event: PointerEvent) => {
      const rect = arena.getBoundingClientRect();
      pointerRef.current = {
        x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
        y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
      };
    };

    arena.addEventListener("pointermove", onPointerMove);

    let lastFrame = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;

      spawnTimerRef.current += dt;
      if (spawnTimerRef.current >= SPAWN_INTERVAL_S) {
        spawnTimerRef.current = 0;
        const width = arena.clientWidth;
        starIdRef.current += 1;
        starsRef.current.push({
          id: starIdRef.current,
          x: 24 + Math.random() * Math.max(48, width - 48),
          y: -16,
          speed: 90 + Math.random() * 70,
          size: 14 + Math.random() * 8,
        });
      }

      catcherRef.current.x += (pointerRef.current.x - catcherRef.current.x) * CATCHER_LERP;
      catcherRef.current.y += (pointerRef.current.y - catcherRef.current.y) * CATCHER_LERP;

      const height = arena.clientHeight;
      let caught = 0;
      starsRef.current = starsRef.current.filter((star) => {
        star.y += star.speed * dt;
        const dx = star.x - catcherRef.current.x;
        const dy = star.y - catcherRef.current.y;
        if (Math.hypot(dx, dy) < CATCH_RADIUS + star.size * 0.35) {
          caught += 1;
          return false;
        }
        return star.y < height + 24;
      });

      if (caught > 0) {
        setScore((value) => value + caught);
      }

      setCatcher({ x: catcherRef.current.x, y: catcherRef.current.y });
      setStars([...starsRef.current]);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    const onResize = () => initPositions();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      arena.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center gap-5 overflow-hidden bg-background px-4 py-8 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: "var(--gradient-page)" }}
        aria-hidden
      />

      <div className="relative z-10 max-w-lg text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">School Hub</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Loading your dashboard
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Move your cursor over the play area — guide the cap to catch falling stars.
        </p>
      </div>

      <div
        ref={arenaRef}
        className={cn(
          "relative z-10 h-56 w-full max-w-xl cursor-none touch-none overflow-hidden rounded-2xl border-2 border-primary/25 bg-card/80 shadow-lg backdrop-blur-sm sm:h-64",
          !arenaReady && "opacity-0"
        )}
        aria-label="Loading mini-game play area"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-card/90 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card/90 to-transparent" />

        {stars.map((star) => (
          <Sparkles
            key={star.id}
            className="pointer-events-none absolute text-amber-500"
            style={{
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              transform: "translate(-50%, -50%)",
            }}
            aria-hidden
          />
        ))}

        <div
          className="pointer-events-none absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/15 shadow-md"
          style={{ left: catcher.x, top: catcher.y }}
        >
          <GraduationCap className="h-7 w-7 text-primary" strokeWidth={1.5} aria-hidden />
        </div>
      </div>

      <div className="relative z-10 text-center">
        <p className="text-3xl font-bold tabular-nums text-foreground">{score}</p>
        <p className="text-xs text-muted-foreground">stars caught</p>
      </div>

      <div className="relative z-10 flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderIcon className="h-4 w-4 animate-spin text-primary" aria-hidden />
        <span>Syncing classes and schedules…</span>
      </div>
    </div>
  );
}
