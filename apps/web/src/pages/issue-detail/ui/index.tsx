import {
  FlowBreakdownCard,
  IssueDatesCard,
  IssueDetailsCard,
  IssueHeader,
  IssueIdentifiersCard,
  IssueMetricsGrid,
  StatusHistoryCard,
  useIssue,
} from "@/entities/issue";
import { PageSpinner } from "@/shared/ui";
import { useParams } from "react-router-dom";
import { BackLink } from "./back-link";

export function IssueDetailPage() {
  const { key } = useParams<{ key: string }>();
  const { data: issue, isLoading, isError } = useIssue(key ?? "");

  if (isLoading) return <PageSpinner />;

  if (isError || !issue) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Issue not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink />
      <IssueHeader issue={issue} />
      <IssueMetricsGrid issue={issue} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <IssueDetailsCard issue={issue} />
          <FlowBreakdownCard issue={issue} />
        </div>
        <div className="space-y-6">
          <IssueDatesCard issue={issue} />
          <IssueIdentifiersCard issue={issue} />
          <StatusHistoryCard issueKey={issue.key} />
        </div>
      </div>
    </div>
  );
}
