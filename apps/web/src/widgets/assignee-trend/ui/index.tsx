import { useAssigneeTrend } from "@/entities/team";
import { useMetricsParams } from "@/features/filter-issues";
import { CHART_HEIGHT, CHART_NUM_TICKS } from "@/shared/config";
import { CHART_COLORS, chartTheme } from "@/shared/lib/chart-theme";
import { ChartCard, ChartLegend, InfoBadge } from "@/shared/ui";
import { ChartContainer } from "@/shared/ui/chart-container";
import type { AssigneeTrendPoint } from "@jira-board/shared";
import { Axis, Grid, LineSeries, Tooltip, XYChart } from "@visx/xychart";
import { useMemo, useState } from "react";

const ASSIGNEE_TREND_HELP = (
  <>
    <p className="font-medium mb-1.5">Individual Trend</p>
    <p className="text-muted-foreground leading-relaxed">
      Tracks each team member's throughput or cycle time over successive time
      periods. Use the selector to switch between metrics.
    </p>
    <hr className="my-2 border-border" />
    <dl className="space-y-1.5 text-muted-foreground leading-relaxed">
      <div>
        <dt className="inline font-medium text-popover-foreground">Throughput</dt>
        <dd className="inline"> — issues completed per period.</dd>
      </div>
      <div>
        <dt className="inline font-medium text-popover-foreground">Avg Cycle Time</dt>
        <dd className="inline"> — average days from start to completion.</dd>
      </div>
    </dl>
  </>
);

type Metric = "throughput" | "avgCycleTime";

interface TransformedPoint {
  period: string;
  value: number;
}

function transformData(
  data: AssigneeTrendPoint[],
  metric: Metric,
): Map<string, TransformedPoint[]> {
  const byAssignee = new Map<string, TransformedPoint[]>();
  for (const d of data) {
    const value = metric === "throughput" ? d.throughput : d.avgCycleTime;
    const existing = byAssignee.get(d.assignee) ?? [];
    existing.push({ period: d.period, value });
    byAssignee.set(d.assignee, existing);
  }
  for (const points of byAssignee.values()) {
    points.sort((a, b) =>
      a.period.localeCompare(b.period, undefined, { numeric: true }),
    );
  }
  return byAssignee;
}

export function AssigneeTrend() {
  const { params, hasProject } = useMetricsParams();
  const { data, isLoading } = useAssigneeTrend(params, hasProject);
  const [metric, setMetric] = useState<Metric>("throughput");

  const { assignees, seriesData } = useMemo(() => {
    if (!data?.length)
      return {
        assignees: [] as string[],
        seriesData: new Map<string, TransformedPoint[]>(),
      };
    const transformed = transformData(data, metric);
    const assignees = [...new Set(data.map((d) => d.assignee))].sort();
    return { assignees, seriesData: transformed };
  }, [data, metric]);

  const headerExtra = (
    <div className="flex items-center gap-2">
      <select
        value={metric}
        onChange={(e) => setMetric(e.target.value as Metric)}
        className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground"
      >
        <option value="throughput">Throughput</option>
        <option value="avgCycleTime">Avg Cycle Time</option>
      </select>
      <InfoBadge>{ASSIGNEE_TREND_HELP}</InfoBadge>
    </div>
  );

  return (
    <ChartCard
      title="Individual Trend"
      hasProject={hasProject}
      isLoading={isLoading}
      isEmpty={!data?.length}
      headerExtra={headerExtra}
    >
      <ChartContainer height={CHART_HEIGHT}>
        {({ width, height }) => (
          <XYChart
            width={width}
            height={height}
            xScale={{ type: "band", paddingInner: 0.1 }}
            yScale={{ type: "linear" }}
            theme={chartTheme}
          >
            <Grid columns={false} numTicks={CHART_NUM_TICKS} />
            <Axis orientation="bottom" />
            <Axis orientation="left" />
            {assignees.map((assignee) => {
              const points = seriesData.get(assignee) ?? [];
              return (
                <LineSeries
                  key={assignee}
                  dataKey={assignee}
                  data={points}
                  xAccessor={(d: TransformedPoint) => d.period}
                  yAccessor={(d: TransformedPoint) => d.value}
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
                  | TransformedPoint
                  | undefined;
                const key = tooltipData?.nearestDatum?.key as
                  | string
                  | undefined;
                if (!datum || !key) return null;
                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
                    <div className="font-medium">{datum.period}</div>
                    <div className="mt-1 space-y-0.5 text-muted-foreground">
                      <div>
                        {key}: {datum.value}{" "}
                        {metric === "avgCycleTime" ? "days" : ""}
                      </div>
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
          items={assignees.map((assignee, i) => ({
            key: assignee,
            label: assignee,
            color: CHART_COLORS[i % CHART_COLORS.length] ?? CHART_COLORS[0],
          }))}
        />
      )}
    </ChartCard>
  );
}
