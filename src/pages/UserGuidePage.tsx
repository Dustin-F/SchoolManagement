import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronRight, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { USER_GUIDE_SECTIONS, type GuideSection } from "@/data/userGuide";

function GuideSectionContent({ section }: { section: GuideSection }) {
  return (
    <article id={section.id} className="scroll-mt-28 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
        <p className="mt-2 text-muted-foreground">{section.summary}</p>
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">What it is for</p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{section.purpose}</p>
        </div>
      </div>

      <ol className="space-y-5">
        {section.steps.map((step, index) => (
          <li key={step.title} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {index + 1}
              </span>
              <div className="min-w-0 space-y-1">
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {section.tips && section.tips.length > 0 && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
            <Lightbulb className="h-4 w-4" />
            Tips
          </div>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {section.tips.map((tip) => (
              <li key={tip} className="flex gap-2">
                <span className="text-amber-600 dark:text-amber-400" aria-hidden>
                  •
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function GuideContentsNav({
  activeSectionId,
  onSelect,
  className,
}: {
  activeSectionId: string;
  onSelect: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card/95 p-2 shadow-sm backdrop-blur-sm", className)}>
      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Contents
      </p>
      <ul className="space-y-0.5">
        {USER_GUIDE_SECTIONS.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              onClick={() => onSelect(section.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                activeSectionId === section.id
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <span>{section.title}</span>
              {activeSectionId === section.id && (
                <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function UserGuidePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionParam = searchParams.get("section");
  const defaultSection = USER_GUIDE_SECTIONS[0]?.id ?? "";
  const scrollSpyEnabled = useRef(true);
  const pageHeaderRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [pinNav, setPinNav] = useState(false);
  const [navHeight, setNavHeight] = useState(0);

  const [activeSectionId, setActiveSectionId] = useState(() =>
    sectionParam && USER_GUIDE_SECTIONS.some((s) => s.id === sectionParam)
      ? sectionParam
      : defaultSection
  );

  const scrollToSection = (id: string, updateUrl = true) => {
    scrollSpyEnabled.current = false;
    setActiveSectionId(id);
    if (updateUrl) {
      setSearchParams({ section: id }, { replace: true });
    }
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => {
        scrollSpyEnabled.current = true;
      }, 600);
    });
  };

  useEffect(() => {
    if (sectionParam && USER_GUIDE_SECTIONS.some((s) => s.id === sectionParam)) {
      setActiveSectionId(sectionParam);
      requestAnimationFrame(() => {
        document.getElementById(sectionParam)?.scrollIntoView({ block: "start" });
      });
    }
  }, [sectionParam]);

  useEffect(() => {
    const headerEl = pageHeaderRef.current;
    if (!headerEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => setPinNav(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(headerEl);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const navEl = navRef.current;
    if (!navEl) return;

    const updateHeight = () => setNavHeight(navEl.offsetHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(navEl);
    return () => observer.disconnect();
  }, [pinNav]);

  useEffect(() => {
    const sectionElements = USER_GUIDE_SECTIONS.map((s) => document.getElementById(s.id)).filter(
      Boolean
    ) as HTMLElement[];

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!scrollSpyEnabled.current) return;

        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const topmost = visible[0]?.target.id;
        if (topmost) {
          setActiveSectionId(topmost);
          setSearchParams({ section: topmost }, { replace: true });
        }
      },
      {
        root: null,
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.1, 0.25, 0.5],
      }
    );

    for (const el of sectionElements) observer.observe(el);
    return () => observer.disconnect();
  }, [setSearchParams]);

  return (
    <div>
      <div ref={pageHeaderRef}>
        <PageHeader
          title="User guide"
          description="Full documentation for every part of SchoolHub — what each feature is for and how to use it, from setup through report cards."
        />
      </div>

      <div className="lg:flex lg:items-start lg:gap-8">
        {/* Desktop contents — in document flow at top; pins fixed after page header scrolls away */}
        <div className="hidden w-60 shrink-0 lg:block">
          {pinNav && navHeight > 0 && (
            <div aria-hidden className="w-60" style={{ height: navHeight }} />
          )}
          <nav
            ref={navRef}
            aria-label="Guide sections"
            className={cn(
              "max-h-[calc(100vh-6.5rem)] overflow-y-auto overscroll-contain",
              pinNav &&
                "fixed top-[5.5rem] left-[calc(16rem+1.5rem)] z-30 w-60 rounded-xl shadow-md"
            )}
          >
            <GuideContentsNav activeSectionId={activeSectionId} onSelect={scrollToSection} />
          </nav>
        </div>

        <div className="min-w-0 flex-1 space-y-16 pb-8">
          {/* Mobile contents — in document flow so it never covers the page title */}
          <div className="lg:hidden">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Contents</span>
              <select
                value={activeSectionId}
                onChange={(e) => scrollToSection(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {USER_GUIDE_SECTIONS.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {USER_GUIDE_SECTIONS.map((section) => (
            <GuideSectionContent key={section.id} section={section} />
          ))}
        </div>
      </div>
    </div>
  );
}
