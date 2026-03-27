import { useMembers } from "@/entities/member";
import { useProjectStore } from "@/entities/project";
import { useTeamPerformance } from "@/entities/team";
import { useMetricsParams } from "@/features/filter-issues";
import { cn } from "@/shared/lib/cn";
import { Badge, ChartCard, InfoBadge } from "@/shared/ui";
import type { AssigneePerformance, MemberRole } from "@jira-board/shared";
import { useMemo, useState } from "react";

const LEADERBOARD_HELP = (
  <>
    <p className="font-medium mb-1.5">Team Leaderboard</p>
    <p className="text-muted-foreground leading-relaxed">
      Compares individual contributors across key performance metrics. Click
      column headers to sort.
    </p>
    <hr className="my-2 border-border" />
    <dl className="space-y-1.5 text-muted-foreground leading-relaxed">
      <div>
        <dt className="inline font-medium text-popover-foreground">Role</dt>
        <dd className="inline">
          {" "}
          — DEV or QA badge based on team member role.
        </dd>
      </div>
      <div>
        <dt className="inline font-medium text-popover-foreground">Velocity</dt>
        <dd className="inline">
          {" "}
          — average story points delivered per sprint.
        </dd>
      </div>
      <div>
        <dt className="inline font-medium text-popover-foreground">
          Avg Cycle Time
        </dt>
        <dd className="inline"> — average hours from start to completion.</dd>
      </div>
      <div>
        <dt className="inline font-medium text-popover-foreground">
          Rework Rate
        </dt>
        <dd className="inline"> — % of issues returned to an earlier phase.</dd>
      </div>
      <div>
        <dt className="inline font-medium text-popover-foreground">
          Flow Efficiency
        </dt>
        <dd className="inline"> — active work time vs total time.</dd>
      </div>
      <div>
        <dt className="inline font-medium text-popover-foreground">
          Commit Rate
        </dt>
        <dd className="inline">
          {" "}
          — ratio of completed SP to committed SP. Shows delivery reliability.
        </dd>
      </div>
    </dl>
  </>
);

type SortKey = keyof AssigneePerformance | "commitRate" | null;
type SortDir = "asc" | "desc";

function getCommitRate(row: AssigneePerformance): number {
  return row.spCommitted > 0 ? row.spCompleted / row.spCommitted : 0;
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "assignee", label: "Assignee" },
  { key: "avgSpPerSprint", label: "Velocity" },
  { key: "avgCycleTimeHours", label: "Avg Cycle Time" },
  { key: "reworkRate", label: "Rework Rate" },
  { key: "activeRatio", label: "Flow Efficiency" },
  { key: "commitRate", label: "Commit Rate" },
];

const ROLE_BADGE_VARIANT: Record<string, "info" | "success" | "default"> = {
  DEV: "info",
  QA: "success",
};

function formatValue(
  row: AssigneePerformance,
  key: SortKey,
  roleMap?: Map<string, MemberRole>,
): React.ReactNode {
  if (!key) return null;
  switch (key) {
    case "assignee": {
      const role = roleMap?.get(row.assignee);
      return (
        <span className="flex items-center gap-2">
          <span className="font-bold">{row.assignee}</span>
          {role && role !== "-" && (
            <Badge
              variant={ROLE_BADGE_VARIANT[role] ?? "default"}
              className="text-[10px] px-1.5 py-0 leading-4"
            >
              {role}
            </Badge>
          )}
        </span>
      );
    }
    case "issuesCompleted":
      return row.issuesCompleted;
    case "spCompleted":
      return row.spCompleted;
    case "avgSpPerSprint":
      return (
        <span className="flex items-center gap-1.5">
          <span>{row.avgSpPerSprint.toFixed(1)}</span>
          <span className="text-muted-foreground text-xs">
            SP / {row.sprintCount} spr
          </span>
        </span>
      );
    case "avgCycleTimeHours":
      return `${row.avgCycleTimeHours.toFixed(1)}h`;
    case "avgLeadTimeHours":
      return `${row.avgLeadTimeHours.toFixed(1)}h`;
    case "reworkRate": {
      const pct = (row.reworkRate * 100).toFixed(1);
      return row.reworkRate > 0.2 ? (
        <Badge variant="destructive">{pct}%</Badge>
      ) : (
        `${pct}%`
      );
    }
    case "activeRatio": {
      const pct = (row.activeRatio * 100).toFixed(1);
      return row.activeRatio > 0.7 ? (
        <Badge variant="success">{pct}%</Badge>
      ) : (
        `${pct}%`
      );
    }
    case "avgHoursPerSP":
      return row.avgHoursPerSP.toFixed(1);
    case "commitRate": {
      if (row.spCommitted === 0) return "—";
      const rate = getCommitRate(row);
      const pct = (rate * 100).toFixed(0);
      return (
        <span className="flex items-center gap-1.5">
          {rate >= 0.9 ? (
            <Badge variant="success">{pct}%</Badge>
          ) : rate >= 0.7 ? (
            <span>{pct}%</span>
          ) : (
            <Badge variant="destructive">{pct}%</Badge>
          )}
          <span className="text-muted-foreground text-xs">
            {row.spCompleted}/{row.spCommitted} SP
          </span>
        </span>
      );
    }
    default:
      return String((row as Record<string, unknown>)[key] ?? "");
  }
}

export function TeamLeaderboard() {
  const { params, hasProject } = useMetricsParams();
  const projectKey = useProjectStore((s) => s.selectedProject?.key);
  const { data, isLoading } = useTeamPerformance(params, hasProject);
  const { data: members } = useMembers(projectKey);
  const [sortKey, setSortKey] = useState<SortKey>("assignee");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const roleMap = useMemo(() => {
    if (!members) return undefined;
    return new Map(members.map((m) => [m.displayName, m.role]));
  }, [members]);

  const sortedData = useMemo(() => {
    if (!data || !sortKey) return data ?? [];
    return [...data].sort((a, b) => {
      let aVal: unknown;
      let bVal: unknown;
      if (sortKey === "commitRate") {
        aVal = getCommitRate(a);
        bVal = getCommitRate(b);
      } else {
        aVal = (a as Record<string, unknown>)[sortKey];
        bVal = (b as Record<string, unknown>)[sortKey];
      }
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      const numA = Number(aVal ?? 0);
      const numB = Number(bVal ?? 0);
      return sortDir === "asc" ? numA - numB : numB - numA;
    });
  }, [data, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (!key) return;
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <ChartCard
      title="Team Leaderboard"
      hasProject={hasProject}
      isLoading={isLoading}
      isEmpty={!data?.length}
      headerExtra={<InfoBadge>{LEADERBOARD_HELP}</InfoBadge>}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {COLUMNS.map(({ key, label }) => (
                <th
                  key={label}
                  className={cn(
                    "bg-secondary/50 text-muted-foreground text-xs uppercase tracking-wider px-4 py-3 text-left",
                    key && "cursor-pointer hover:bg-secondary/70",
                  )}
                  onClick={() => key && handleSort(key)}
                >
                  {label}
                  {sortKey === key && (
                    <span className="ml-1">
                      {sortDir === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row) => (
              <tr
                key={row.assignee}
                className="border-b border-border hover:bg-secondary/30 transition-colors"
              >
                {COLUMNS.map(({ key }) => (
                  <td key={key ?? "empty"} className="px-4 py-3">
                    {formatValue(row, key, roleMap)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
