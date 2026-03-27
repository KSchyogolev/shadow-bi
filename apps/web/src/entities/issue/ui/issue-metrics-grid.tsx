import { formatHours, formatMinutes } from "@/shared/lib/format";
import { StatCard } from "@/shared/ui";
import type { Issue } from "@jira-board/shared";
import { computeIssueMetrics, getActiveQueueRatioColor } from "../lib";

export function IssueMetricsGrid({ issue }: { issue: Issue }) {
  const m = computeIssueMetrics(issue);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard
        label="Lead Time"
        value={m.leadTimeMs != null ? formatHours(m.leadTimeMs) : "—"}
        sub="Created → Resolved"
      />
      <StatCard
        label="Cycle Time"
        value={m.cycleTimeMs != null ? formatHours(m.cycleTimeMs) : "—"}
        sub="First Active → Done"
      />
      <StatCard
        label="Active Time"
        value={formatMinutes(issue.activeTimeMin)}
        colorClass="text-info"
      />
      <StatCard
        label="Queue Time"
        value={formatMinutes(issue.queueTimeMin)}
        colorClass="text-warning"
      />
      <StatCard
        label="Flow Efficiency"
        value={m.totalWorkMin > 0 ? `${(m.efficiency * 100).toFixed(0)}%` : "—"}
        colorClass={
          m.totalWorkMin > 0
            ? getActiveQueueRatioColor(m.efficiency)
            : undefined
        }
        sub={
          m.totalWorkMin > 0
            ? `${formatMinutes(issue.activeTimeMin)} / ${formatMinutes(m.totalWorkMin)}`
            : undefined
        }
      />
      <StatCard
        label="Rework"
        value={
          issue.reworkCount > 0
            ? `${issue.reworkCount}× · ${formatMinutes(issue.reworkWaitMin)}`
            : "None"
        }
        colorClass={issue.reworkCount > 0 ? "text-destructive" : "text-success"}
      />
    </div>
  );
}
