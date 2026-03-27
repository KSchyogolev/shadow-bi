import type { Issue } from "@jira-board/shared";

export interface IssueMetrics {
  cycleTimeMs: number | null;
  leadTimeMs: number | null;
  totalWorkMin: number;
  efficiency: number;
  hoursPerSp: number | null;
}

export function computeIssueMetrics(issue: Issue): IssueMetrics {
  const cycleTimeMs =
    issue.actualStart && issue.actualEnd
      ? new Date(issue.actualEnd).getTime() -
        new Date(issue.actualStart).getTime()
      : null;

  const leadTimeMs =
    issue.createdAt && issue.resolvedAt
      ? new Date(issue.resolvedAt).getTime() -
        new Date(issue.createdAt).getTime()
      : null;

  const totalWorkMin =
    issue.activeTimeMin + issue.queueTimeMin + issue.reworkWaitMin;
  const efficiency =
    totalWorkMin > 0 ? issue.activeTimeMin / totalWorkMin : 0;

  const hoursPerSp =
    issue.storyPoints && issue.storyPoints > 0 && issue.activeTimeMin > 0
      ? issue.activeTimeMin / 60 / issue.storyPoints
      : null;

  return { cycleTimeMs, leadTimeMs, totalWorkMin, efficiency, hoursPerSp };
}

export function getStatusBadgeVariant(
  status: string,
): "success" | "info" | "destructive" | "warning" | "default" {
  const s = status.toLowerCase();
  if (s.includes("done") || s.includes("closed") || s.includes("resolved"))
    return "success";
  if (s.includes("progress") || s.includes("active")) return "info";
  if (s.includes("blocked")) return "destructive";
  if (s.includes("review") || s.includes("testing")) return "warning";
  return "default";
}

export function getFlowPhaseColor(phase: string | null): string {
  if (!phase) return "text-muted-foreground";
  switch (phase) {
    case "Queue":
      return "text-warning";
    case "Active":
      return "text-info";
    case "Done":
      return "text-success";
    case "Rework":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
}

export function getPriorityColor(priority: string | null): string {
  if (!priority) return "text-muted-foreground";
  const p = priority.toLowerCase();
  if (p.includes("critical")) return "text-destructive";
  if (p.includes("high")) return "text-warning";
  if (p.includes("medium")) return "text-foreground";
  if (p.includes("low")) return "text-muted-foreground";
  return "text-muted-foreground";
}

export function getActiveQueueRatioColor(ratio: number): string {
  if (ratio >= 0.7) return "text-success";
  if (ratio >= 0.4) return "text-warning";
  return "text-destructive";
}

export function formatLeadTime(issue: Issue): string {
  if (!issue.resolvedAt || !issue.createdAt) return "—";
  const created = new Date(issue.createdAt).getTime();
  const resolved = new Date(issue.resolvedAt).getTime();
  const hours = (resolved - created) / (1000 * 60 * 60);
  return `${hours.toFixed(1)}h`;
}
