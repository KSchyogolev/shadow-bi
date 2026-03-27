import { CircleHelp } from "lucide-react";
import type { ReactNode } from "react";

interface InfoBadgeProps {
  children: ReactNode;
}

export function InfoBadge({ children }: InfoBadgeProps) {
  return (
    <div className="group/info relative shrink-0">
      <button
        type="button"
        className="text-muted-foreground/50 hover:text-foreground/70 transition-colors"
        aria-label="Chart info"
      >
        <CircleHelp size={18} strokeWidth={1.8} />
      </button>
      <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-border bg-popover px-3.5 py-3 text-xs text-popover-foreground shadow-lg opacity-0 transition-opacity group-hover/info:pointer-events-auto group-hover/info:opacity-100">
        {children}
      </div>
    </div>
  );
}
