import type { Issue } from "@jira-board/shared";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { api } from "@/shared/api";
import { getStatusBadgeVariant, getFlowPhaseColor } from "../lib";

export function IssueHeader({ issue }: { issue: Issue }) {
  const { data: jiraConfig } = useQuery({
    queryKey: ["jira-host"],
    queryFn: () => api.jira.host(),
    staleTime: Infinity,
  });

  const jiraUrl = jiraConfig?.host
    ? `${jiraConfig.host}/browse/${issue.key}`
    : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        {jiraUrl ? (
          <a
            href={jiraUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-sm text-primary font-medium hover:underline"
          >
            {issue.key}
            <ExternalLink className="size-3.5" />
          </a>
        ) : (
          <span className="font-mono text-sm text-primary font-medium">
            {issue.key}
          </span>
        )}
        <Badge variant={getStatusBadgeVariant(issue.status)}>
          {issue.status}
        </Badge>
        {issue.flowPhase && (
          <span
            className={cn(
              "text-xs font-medium",
              getFlowPhaseColor(issue.flowPhase),
            )}
          >
            {issue.flowPhase}
          </span>
        )}
      </div>
      <h1 className="font-heading text-2xl font-bold text-foreground leading-snug">
        {issue.summary}
      </h1>
    </div>
  );
}
