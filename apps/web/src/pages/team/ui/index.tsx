import { useProjectStore } from "@/entities/project";
import { PageHeader } from "@/shared/ui";
import { FiltersPanel } from "@/widgets/filters-panel";
import { TeamLeaderboard } from "@/widgets/team-leaderboard";
import { TeamSprintChart } from "@/widgets/team-sprint-chart";

export function TeamPage() {
  const hasProject = useProjectStore((s) => !!s.selectedProject);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Performance"
        description="Individual and comparative team metrics"
      />

      <FiltersPanel />

      {!hasProject ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Select a project in Settings to view team metrics
        </div>
      ) : (
        <>
          <TeamLeaderboard />
          <TeamSprintChart />
        </>
      )}
    </div>
  );
}
