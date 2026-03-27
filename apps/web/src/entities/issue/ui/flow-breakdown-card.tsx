import type { Issue } from "@jira-board/shared";
import { Card, CardContent } from "@/shared/ui";
import { formatMinutes } from "@/shared/lib/format";
import { computeIssueMetrics } from "../lib";
import { FlowBar } from "./flow-bar";

export function FlowBreakdownCard({ issue }: { issue: Issue }) {
  const m = computeIssueMetrics(issue);

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="font-heading text-base font-semibold mb-4">
          Flow Breakdown
        </h2>
        <FlowBar issue={issue} />
        {m.hoursPerSp != null && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-muted-foreground">
                Hours per Story Point
              </span>
              <span className="text-base font-bold font-heading">
                {m.hoursPerSp.toFixed(1)}h
              </span>
              <span className="text-xs text-muted-foreground">
                ({formatMinutes(issue.activeTimeMin)} active /{" "}
                {issue.storyPoints} SP)
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
