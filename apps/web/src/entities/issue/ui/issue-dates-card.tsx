import type { Issue } from "@jira-board/shared";
import { Card, CardContent, InfoRow } from "@/shared/ui";
import { formatDateTimeOrNull } from "@/shared/lib/format";

export function IssueDatesCard({ issue }: { issue: Issue }) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="font-heading text-base font-semibold mb-3">Dates</h2>
        <InfoRow label="Created">{formatDateTimeOrNull(issue.createdAt)}</InfoRow>
        <InfoRow label="Updated">{formatDateTimeOrNull(issue.updatedAt)}</InfoRow>
        <InfoRow label="Resolved">{formatDateTimeOrNull(issue.resolvedAt)}</InfoRow>
      </CardContent>
    </Card>
  );
}
