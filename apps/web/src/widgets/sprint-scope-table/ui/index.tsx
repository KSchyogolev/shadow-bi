import { useSprint } from "@/entities/sprint";
import { api } from "@/shared/api";
import { cn } from "@/shared/lib/cn";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/shared/ui";
import { useQuery } from "@tanstack/react-query";
import type { Issue } from "@jira-board/shared";
import { ExternalLink } from "lucide-react";

export function SprintScopeTable({ sprintId }: { sprintId: string }) {
  const { data: sprintData, isLoading } = useSprint(sprintId);
  const { data: jiraConfig } = useQuery({
    queryKey: ["jira-host"],
    queryFn: () => api.jira.host(),
    staleTime: Infinity,
  });

  if (isLoading) return <ScopeTableSkeleton />;
  if (!sprintData) return null;

  const jiraHost = jiraConfig?.host ?? null;
  const startMs = sprintData.startDate ? new Date(sprintData.startDate).getTime() : 0;
  const endMs = sprintData.endDate ? new Date(sprintData.endDate).getTime() : Date.now();
  const allIssues: Issue[] = sprintData.issues ?? [];

  const scopeIssues = allIssues.filter(
    (i) => !i.actualEnd || new Date(i.actualEnd).getTime() >= startMs,
  );
  const excluded = allIssues.filter(
    (i) => i.actualEnd && new Date(i.actualEnd).getTime() < startMs,
  );

  const newIssues = scopeIssues.filter(
    (i) => i.sprintIds.length === 1 && (!startMs || new Date(i.createdAt).getTime() <= startMs),
  );
  const carryOver = scopeIssues.filter((i) => i.sprintIds.length > 1);
  const addedMid = startMs
    ? scopeIssues.filter(
        (i) => i.sprintIds.length === 1 && new Date(i.createdAt).getTime() > startMs,
      )
    : [];
  const completed = scopeIssues.filter(
    (i) =>
      i.flowPhase === "Done" &&
      i.actualEnd &&
      new Date(i.actualEnd).getTime() >= startMs &&
      new Date(i.actualEnd).getTime() <= endMs,
  );
  const remaining = scopeIssues.filter((i) => i.flowPhase !== "Done");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Debug: Scope Issues</span>
          <span className="text-xs font-normal text-muted-foreground">
            start: {startMs ? fmtDate(new Date(startMs)) : "—"} · end: {fmtDate(new Date(endMs))}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <IssueTable issues={newIssues} title={`New — ${spSum(newIssues)} SP`} jiraHost={jiraHost} />
        <IssueTable issues={carryOver} title={`Carry-over (multi-sprint) — ${spSum(carryOver)} SP`} jiraHost={jiraHost} />
        <IssueTable issues={addedMid} title={`Added mid-sprint — ${spSum(addedMid)} SP`} jiraHost={jiraHost} />
        <IssueTable issues={completed} title={`Completed in sprint — ${spSum(completed)} SP`} jiraHost={jiraHost} />
        <IssueTable issues={remaining} title={`Remaining — ${spSum(remaining)} SP`} jiraHost={jiraHost} />
        <IssueTable issues={excluded} title="Excluded (Done before sprint)" muted jiraHost={jiraHost} />
      </CardContent>
    </Card>
  );
}

function IssueTable({
  issues,
  title,
  muted,
  jiraHost,
}: { issues: Issue[]; title: string; muted?: boolean; jiraHost: string | null }) {
  return (
    <div>
      <h4 className={cn("text-sm font-medium mb-2", muted && "text-muted-foreground")}>
        {title} ({issues.length})
      </h4>
      {issues.length === 0 ? (
        <p className="text-xs text-muted-foreground">None</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-1.5 pr-3 font-medium">Key</th>
                <th className="py-1.5 pr-3 font-medium">Summary</th>
                <th className="py-1.5 pr-3 font-medium text-right">SP</th>
                <th className="py-1.5 pr-3 font-medium">Phase</th>
                <th className="py-1.5 pr-3 font-medium">Status</th>
                <th className="py-1.5 pr-3 font-medium">Sprints</th>
                <th className="py-1.5 pr-3 font-medium">Actual End</th>
                <th className="py-1.5 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr
                  key={issue.key}
                  className={cn("border-b border-border/50", muted && "opacity-50")}
                >
                  <td className="py-1.5 pr-3 font-mono text-primary/80">
                    {jiraHost ? (
                      <a
                        href={`${jiraHost}/browse/${issue.key}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        {issue.key}
                        <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      issue.key
                    )}
                  </td>
                  <td className="py-1.5 pr-3 max-w-[300px] truncate">{issue.summary}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{issue.storyPoints ?? "—"}</td>
                  <td className="py-1.5 pr-3">
                    <span
                      className={cn(
                        "inline-block px-1.5 py-0.5 rounded text-[10px] font-medium",
                        issue.flowPhase === "Done"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : issue.flowPhase === "Active"
                            ? "bg-sky-500/15 text-sky-400"
                            : issue.flowPhase === "Queue"
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {issue.flowPhase ?? "—"}
                    </span>
                  </td>
                  <td className="py-1.5 pr-3 text-muted-foreground">{issue.status}</td>
                  <td className="py-1.5 pr-3 text-muted-foreground font-mono text-[10px]">
                    {issue.sprintIds.length > 0 ? issue.sprintIds.join(", ") : "—"}
                    {issue.sprintIds.length > 1 && (
                      <span className="ml-1 text-amber-400">({issue.sprintIds.length})</span>
                    )}
                  </td>
                  <td className="py-1.5 pr-3 tabular-nums">{fmtDate(issue.actualEnd)}</td>
                  <td className="py-1.5 tabular-nums">{fmtDate(issue.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ScopeTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent className="space-y-6">
        {Array.from({ length: 3 }).map((_, section) => (
          <div key={section}>
            <Skeleton className="h-4 w-36 mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 3 - section }).map((_, row) => (
                <div key={row} className="flex gap-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const spSum = (arr: Issue[]) => arr.reduce((s, i) => s + (i.storyPoints ?? 0), 0);

const fmtDate = (d: Date | string | null) => {
  if (!d) return "—";
  return new Date(d).toISOString().split("T")[0];
};
