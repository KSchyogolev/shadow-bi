import { useProjectStore } from "@/entities/project";
import { PageHeader } from "@/shared/ui";
import { FiltersPanel } from "@/widgets/filters-panel";
import { IssuesTable } from "@/widgets/issues-table";

export function IssuesPage() {
  const hasProject = useProjectStore((s) => !!s.selectedProject);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Issues"
        description="All issues with flow metrics and sorting"
      />

      <FiltersPanel />

      {!hasProject ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Select a project in Settings to view issues
        </div>
      ) : (
        <IssuesTable />
      )}
    </div>
  );
}
