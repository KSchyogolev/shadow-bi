import type { Issue } from "@jira-board/shared";
import { Card, CardContent, InfoRow } from "@/shared/ui";

export function IssueIdentifiersCard({ issue }: { issue: Issue }) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="font-heading text-base font-semibold mb-3">
          Identifiers
        </h2>
        <InfoRow label="ID">
          <span className="font-mono text-xs">{issue.id}</span>
        </InfoRow>
        <InfoRow label="Key">
          <span className="font-mono text-xs">{issue.key}</span>
        </InfoRow>
      </CardContent>
    </Card>
  );
}
