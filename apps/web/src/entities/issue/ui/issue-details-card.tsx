import type { Issue } from "@jira-board/shared";
import { Card, CardContent, Badge, InfoRow } from "@/shared/ui";
import { getPriorityColor } from "../lib";

export function IssueDetailsCard({ issue }: { issue: Issue }) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="font-heading text-base font-semibold mb-3">Details</h2>
        <InfoRow label="Type">{issue.type}</InfoRow>
        <InfoRow label="Priority">
          <span className={getPriorityColor(issue.priority)}>
            {issue.priority}
          </span>
        </InfoRow>
        <InfoRow label="Assignee">{issue.assignee ?? "Unassigned"}</InfoRow>
        <InfoRow label="Reporter">{issue.reporter}</InfoRow>
        <InfoRow label="Project">{issue.projectKey}</InfoRow>
        <InfoRow label="Sprint">
          {issue.sprintIds.length > 0 ? issue.sprintIds.join(", ") : "—"}
        </InfoRow>
        <InfoRow label="Story Points">{issue.storyPoints ?? "—"}</InfoRow>
        <InfoRow label="Labels">
          {issue.labels.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 justify-end">
              {issue.labels.map((l) => (
                <Badge key={l} variant="outline" className="text-[11px]">
                  {l}
                </Badge>
              ))}
            </div>
          ) : (
            "—"
          )}
        </InfoRow>
      </CardContent>
    </Card>
  );
}
