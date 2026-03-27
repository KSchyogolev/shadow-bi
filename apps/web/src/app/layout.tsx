import { useProjectStore } from "@/entities/project";
import { cn } from "@/shared/lib/cn";
import {
  AgentIcon,
  ChartIcon,
  ListIcon,
  SettingsIcon,
  SprintIcon,
  TeamIcon,
} from "@/shared/ui/icons";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

const mainNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: ChartIcon },
  { to: "/issues", label: "Issues", icon: ListIcon },
  { to: "/sprints", label: "Sprints", icon: SprintIcon },
  { to: "/team", label: "Team", icon: TeamIcon },
  { to: "/agent", label: "Agent", icon: AgentIcon },
];

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}

function Sidebar() {
  const selectedProject = useProjectStore((s) => s.selectedProject);

  return (
    <aside className="w-60 h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-xl font-bold text-sidebar-primary tracking-tight">
            UniBI
          </h1>
        </div>
        {selectedProject ? (
          <div className="flex items-center gap-2 mt-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {selectedProject.name}
              </p>
              <p className="text-[10px] text-muted-foreground tracking-wide">
                {selectedProject.key}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">
            No project selected
          </p>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {mainNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-secondary",
              )
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:text-sidebar-foreground hover:bg-secondary",
            )
          }
        >
          <SettingsIcon className="size-5" />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
