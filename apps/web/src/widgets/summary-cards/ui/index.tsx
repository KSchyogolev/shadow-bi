import {
  useCycleTime,
  useFlowEfficiency,
  useLeadTime,
} from "@/entities/metrics";
import { useVelocity } from "@/entities/sprint";
import { useMetricsParams, useSprintChartParams } from "@/features/filter-issues";
import { MetricCard } from "@/shared/ui";
import {
  ClockIcon,
  ZapIcon,
  TrendUpIcon,
  TimerIcon,
} from "@/shared/ui/icons";

export function SummaryCards() {
  const { params, hasProject } = useMetricsParams();
  const { params: velocityParams, hasProject: hasProjectForVelocity } = useSprintChartParams();
  const cycleTime = useCycleTime(params, hasProject);
  const leadTime = useLeadTime(params, hasProject);
  const velocity = useVelocity(velocityParams, hasProjectForVelocity);
  const flowEfficiency = useFlowEfficiency(params, hasProject);

  const avgCycleTime =
    cycleTime.data && cycleTime.data.length > 0
      ? (
          cycleTime.data.reduce((sum, p) => sum + p.cycleTimeHours, 0) /
          cycleTime.data.length
        ).toFixed(1)
      : null;

  const avgLeadTime =
    leadTime.data && leadTime.data.length > 0
      ? (
          leadTime.data.reduce((sum, p) => sum + p.leadTimeHours, 0) /
          leadTime.data.length
        ).toFixed(1)
      : null;

  const avgVelocity = (() => {
    const nonZero = velocity.data?.filter((p) => p.completed > 0);
    if (!nonZero?.length) return null;
    return (
      nonZero.reduce((sum, p) => sum + p.completed, 0) / nonZero.length
    ).toFixed(1);
  })();

  const avgFlowEfficiency =
    flowEfficiency.data && flowEfficiency.data.length > 0
      ? (
          (flowEfficiency.data.reduce((sum, p) => sum + p.ratio, 0) /
            flowEfficiency.data.length) *
          100
        ).toFixed(1)
      : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="Avg Cycle Time"
        value={avgCycleTime != null ? `${avgCycleTime}h` : "—"}
        description="Average active time per issue"
        icon={ClockIcon}
        iconClassName="bg-primary/10 text-primary"
        isLoading={cycleTime.isLoading}
      />
      <MetricCard
        title="Avg Lead Time"
        value={avgLeadTime != null ? `${avgLeadTime}h` : "—"}
        description="Average time from creation to done"
        icon={TimerIcon}
        iconClassName="bg-info/10 text-info"
        isLoading={leadTime.isLoading}
      />
      <MetricCard
        title="Avg Velocity"
        value={avgVelocity != null ? `${avgVelocity} SP` : "—"}
        description="Average story points completed per sprint"
        icon={TrendUpIcon}
        iconClassName="bg-success/10 text-success"
        isLoading={velocity.isLoading}
      />
      <MetricCard
        title="Flow Efficiency"
        value={avgFlowEfficiency != null ? `${avgFlowEfficiency}%` : "—"}
        description="Active time vs total time"
        icon={ZapIcon}
        iconClassName="bg-warning/10 text-warning"
        isLoading={flowEfficiency.isLoading}
      />
    </div>
  );
}
