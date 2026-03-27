import { useProjectStore } from "@/entities/project";
import { PageHeader } from "@/shared/ui";
import { CycleTimeTrend } from "@/widgets/cycle-time-trend";
import { FiltersPanel } from "@/widgets/filters-panel";
import { FlowEfficiencyDonut } from "@/widgets/flow-efficiency-donut";
import { SummaryCards } from "@/widgets/summary-cards";
import { SprintVelocity } from "@/widgets/sprint-velocity";
import { TimeInStatusChart } from "@/widgets/time-in-status-chart";

export function DashboardPage() {
  const hasProject = useProjectStore((s) => !!s.selectedProject);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Flow metrics overview for your project"
      />

      <FiltersPanel />

      {!hasProject ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Select a project in Settings to view metrics
        </div>
      ) : (
        <>
          <SummaryCards />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CycleTimeTrend />
            <SprintVelocity />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TimeInStatusChart />
            </div>
            <FlowEfficiencyDonut />
          </div>
        </>
      )}
    </div>
  );
}
