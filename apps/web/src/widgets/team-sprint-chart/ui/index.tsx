import { useAssigneeSprintMetrics } from "@/entities/team";
import { useSprintChartParams } from "@/features/filter-issues";
import { CHART_NUM_TICKS, VISIBLE_SPRINTS } from "@/shared/config";
import { CHART_COLORS, chartTheme } from "@/shared/lib/chart-theme";
import { ChartCard, ChartLegend, InfoBadge } from "@/shared/ui";
import { ChartContainer } from "@/shared/ui/chart-container";
import type { AssigneeSprintMetric } from "@jira-board/shared";
import { Axis, Grid, LineSeries, Tooltip, XYChart } from "@visx/xychart";
import { useMemo, useState } from "react";

type Metric = "velocity" | "avgCycleTimeHours" | "reworkRate";

const METRIC_OPTIONS: { value: Metric; label: string; unit: string }[] = [
  { value: "velocity", label: "Velocity", unit: "SP" },
  { value: "avgCycleTimeHours", label: "Avg Cycle Time", unit: "h" },
  { value: "reworkRate", label: "Rework Rate", unit: "%" },
];

const HELP_CONTENT = (
  <>
    <p className="font-medium mb-1.5">Team Sprint Chart</p>
    <p className="text-muted-foreground leading-relaxed">
      Per-person metrics across the last {VISIBLE_SPRINTS} closed sprints. Sprint and date
      filters are ignored — only assignee, type, priority, and label filters
      apply.
    </p>
    <hr className="my-2 border-border" />
    <dl className="space-y-1.5 text-muted-foreground leading-relaxed">
      <div>
        <dt className="inline font-medium text-popover-foreground">Velocity</dt>
        <dd className="inline"> — story points completed in the sprint.</dd>
      </div>
      <div>
        <dt className="inline font-medium text-popover-foreground">
          Avg Cycle Time
        </dt>
        <dd className="inline"> — average hours from start to completion.</dd>
      </div>
      <div>
        <dt className="inline font-medium text-popover-foreground">
          Rework Rate
        </dt>
        <dd className="inline"> — % of issues returned to an earlier phase.</dd>
      </div>
    </dl>
  </>
);

interface ChartPoint {
  sprint: string;
  value: number;
}

function buildSeries(
  data: AssigneeSprintMetric[],
  metric: Metric,
): { assignees: string[]; byAssignee: Map<string, ChartPoint[]> } {
  const byAssignee = new Map<string, ChartPoint[]>();
  for (const d of data) {
    let value = d[metric];
    if (metric === "reworkRate") value = value * 100;
    const points = byAssignee.get(d.assignee) ?? [];
    points.push({ sprint: d.sprint, value });
    byAssignee.set(d.assignee, points);
  }
  const assignees = [...byAssignee.keys()].sort();
  return { assignees, byAssignee };
}

function formatTooltipValue(value: number, metric: Metric): string {
  const opt = METRIC_OPTIONS.find((o) => o.value === metric)!;
  if (metric === "reworkRate") return `${value.toFixed(1)}${opt.unit}`;
  if (metric === "avgCycleTimeHours") return `${value.toFixed(1)}${opt.unit}`;
  return `${value}${opt.unit}`;
}

export function TeamSprintChart() {
  const { params, hasProject } = useSprintChartParams();
  const { data, isLoading } = useAssigneeSprintMetrics(params, hasProject);
  const [metric, setMetric] = useState<Metric>("velocity");

  const { assignees, byAssignee } = useMemo(() => {
    if (!data?.length)
      return { assignees: [] as string[], byAssignee: new Map<string, ChartPoint[]>() };
    return buildSeries(data, metric);
  }, [data, metric]);

  const yLabel = METRIC_OPTIONS.find((o) => o.value === metric)?.unit ?? "";

  const headerExtra = (
    <div className="flex items-center gap-2">
      <select
        value={metric}
        onChange={(e) => setMetric(e.target.value as Metric)}
        className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground"
      >
        {METRIC_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <InfoBadge>{HELP_CONTENT}</InfoBadge>
    </div>
  );

  return (
    <ChartCard
      title="Team Sprint Chart"
      hasProject={hasProject}
      isLoading={isLoading}
      isEmpty={!data?.length}
      headerExtra={headerExtra}
    >
      <ChartContainer height={320}>
        {({ width, height }) => (
          <XYChart
            width={width}
            height={height}
            xScale={{ type: "band", paddingInner: 0.15 }}
            yScale={{ type: "linear" }}
            theme={chartTheme}
          >
            <Grid columns={false} numTicks={CHART_NUM_TICKS} />
            <Axis orientation="bottom" />
            <Axis orientation="left" label={yLabel} />
            {assignees.map((assignee) => {
              const points = byAssignee.get(assignee) ?? [];
              return (
                <LineSeries
                  key={assignee}
                  dataKey={assignee}
                  data={points}
                  xAccessor={(d: ChartPoint) => d.sprint}
                  yAccessor={(d: ChartPoint) => d.value}
                />
              );
            })}
            <Tooltip
              snapTooltipToDatumX
              showVerticalCrosshair
              showSeriesGlyphs
              unstyled
              applyPositionStyle
              renderTooltip={({ tooltipData }) => {
                const datum = tooltipData?.nearestDatum?.datum as
                  | ChartPoint
                  | undefined;
                const key = tooltipData?.nearestDatum?.key as
                  | string
                  | undefined;
                if (!datum || !key) return null;
                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
                    <div className="font-medium">{datum.sprint}</div>
                    <div className="mt-1 text-muted-foreground">
                      {key}: {formatTooltipValue(datum.value, metric)}
                    </div>
                  </div>
                );
              }}
            />
          </XYChart>
        )}
      </ChartContainer>
      {assignees.length > 0 && (
        <ChartLegend
          items={assignees.map((a, i) => ({
            key: a,
            label: a,
            color: CHART_COLORS[i % CHART_COLORS.length] ?? CHART_COLORS[0],
          }))}
        />
      )}
    </ChartCard>
  );
}
