import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/classes": "Classes",
  "/students": "Students",
  "/teachers": "Teachers",
  "/subjects": "Subjects",
  "/attendance": "Attendance",
  "/behaviour": "Behaviour",
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();

  // Match exact path or the first segment for nested routes
  const basePath = "/" + (location.pathname.split("/")[1] || "");
  const title = pageTitles[basePath] || "SchoolHub";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="mr-2 lg:hidden"
        onClick={() => onMenuClick?.()}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
    </header>
  );
}
