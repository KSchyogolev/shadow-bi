import { useProjectStore } from "@/entities/project";
import { useSprints } from "@/entities/sprint";
import { cn } from "@/shared/lib/cn";
import { PageHeader, Skeleton } from "@/shared/ui";
import { SprintBurndown } from "@/widgets/sprint-burndown";
import { SprintScopeTable } from "@/widgets/sprint-scope-table";
import { SprintStats } from "@/widgets/sprint-stats";
import { SprintVelocityDetailed } from "@/widgets/sprint-velocity-detailed";
import { useMemo, useState } from "react";

export function SprintsPage() {
  const selectedProject = useProjectStore((s) => s.selectedProject);
  const hasProject = !!selectedProject;
  const { data: sprintsData, isLoading } = useSprints(selectedProject?.key);
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");

  const sprints = sprintsData?.data ?? [];

  const activeSprint = useMemo(() => {
    if (selectedSprintId)
      return sprints.find((s) => String(s.id) === selectedSprintId);
    return sprints.find((s) => s.state === "active") ?? sprints[0];
  }, [sprints, selectedSprintId]);

  const sprintId = activeSprint ? String(activeSprint.id) : "";

  if (!hasProject) {
    return (
      <div className="space-y-6">
        <PageHeader title="Sprints" description="Sprint analytics and burndown" />
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Select a project in Settings to view sprints
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Sprints" description="Sprint analytics and burndown" />

      {isLoading ? (
        <SprintTabsSkeleton />
      ) : sprints.length === 0 ? (
        <div className="text-muted-foreground text-center py-12">No sprints found</div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sprints.map((sprint) => (
              <button
                key={sprint.id}
                type="button"
                onClick={() => setSelectedSprintId(String(sprint.id))}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                  String(sprint.id) === sprintId
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                {sprint.name}
                {sprint.state === "active" && (
                  <span className="ml-2 inline-block size-1.5 rounded-full bg-success" />
                )}
              </button>
            ))}
          </div>

          <SprintStats sprintId={sprintId} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SprintBurndown sprintId={sprintId} />
            <SprintVelocityDetailed />
          </div>

          <SprintScopeTable sprintId={sprintId} />
        </>
      )}
    </div>
  );
}

function SprintTabsSkeleton() {
  return (
    <div className="flex gap-2 pb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-28 rounded-lg shrink-0" />
      ))}
    </div>
  );
}
