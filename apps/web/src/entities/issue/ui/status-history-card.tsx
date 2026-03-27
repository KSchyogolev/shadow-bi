import { Card, CardContent } from "@/shared/ui";
import { useIssueTransitions } from "../api";
import { TransitionTimeline } from "./transition-timeline";

export function StatusHistoryCard({ issueKey }: { issueKey: string }) {
  const { data: transitions } = useIssueTransitions(issueKey);

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="font-heading text-base font-semibold mb-4">
          Status History
        </h2>
        <TransitionTimeline transitions={transitions ?? []} />
      </CardContent>
    </Card>
  );
}
