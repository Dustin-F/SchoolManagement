import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  School,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/classes", label: "Classes", icon: School },
  { to: "/students", label: "Students", icon: Users },
  { to: "/teachers", label: "Teachers", icon: GraduationCap },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/attendance", label: "Attendance", icon: ClipboardList },
  { to: "/skills", label: "Point skills", icon: Sparkles },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-primary/15 bg-gradient-sidebar shadow-theme-sidebar backdrop-blur-xl dark:border-sidebar-border/80 dark:bg-sidebar/95 dark:shadow-none lg:fixed lg:left-0 lg:top-0 lg:z-40">
      <div className="flex h-16 items-center gap-3 border-b border-primary/15 px-6 dark:border-sidebar-border/80">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand text-sm font-extrabold text-white shadow-md dark:shadow-theme-glow">
          S
        </div>
        <span className="text-lg font-bold tracking-tight text-gradient">SchoolHub</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "border border-primary/30 bg-gradient-to-r from-sky-500/12 to-teal-500/8 font-semibold text-primary shadow-sm"
                  : "text-sidebar-foreground hover:bg-white/60 hover:text-foreground dark:hover:bg-muted/80"
              )
            }
            onClick={() => onNavigate?.()}
          >
            <item.icon className={cn("h-5 w-5 shrink-0")} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
