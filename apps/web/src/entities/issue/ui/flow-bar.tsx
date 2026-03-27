import type { Issue } from "@jira-board/shared";
import { cn } from "@/shared/lib/cn";
import { formatMinutes } from "@/shared/lib/format";

const SEGMENTS_CONFIG = [
  { key: "active", label: "Active", field: "activeTimeMin", color: "bg-info" },
  {
    key: "queue",
    label: "Queue",
    field: "queueTimeMin",
    color: "bg-warning/70",
  },
  {
    key: "rework",
    label: "Rework",
    field: "reworkWaitMin",
    color: "bg-destructive/70",
  },
] as const;

export function FlowBar({ issue }: { issue: Issue }) {
  const total =
    issue.activeTimeMin + issue.queueTimeMin + issue.reworkWaitMin;

  if (total === 0)
    return (
      <p className="text-sm text-muted-foreground py-2">
        No flow data — recalculate metrics in Settings.
      </p>
    );

  const segments = SEGMENTS_CONFIG.map((cfg) => ({
    ...cfg,
    min: issue[cfg.field],
  })).filter((s) => s.min > 0);

  return (
    <div className="space-y-2.5">
      <div className="flex h-3.5 rounded-full overflow-hidden bg-secondary">
        {segments.map((s) => (
          <div
            key={s.key}
            className={cn(s.color, "transition-all")}
            style={{ width: `${(s.min / total) * 100}%` }}
            title={`${s.label}: ${formatMinutes(s.min)}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((s) => (
          <span
            key={s.key}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span className={cn("inline-block size-2.5 rounded-sm", s.color)} />
            {s.label} {formatMinutes(s.min)} (
            {((s.min / total) * 100).toFixed(0)}%)
          </span>
        ))}
      </div>
    </div>
  );
}
