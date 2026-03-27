import {
  Axis,
  BarGroup,
  BarSeries,
  Grid,
  Tooltip,
  XYChart,
} from "@visx/xychart";
import { useThroughput } from "@/entities/metrics";
import { useMetricsParams } from "@/features/filter-issues";
import { BAR_PADDING, CHART_HEIGHT, CHART_NUM_TICKS } from "@/shared/config";
import { chartTheme } from "@/shared/lib/chart-theme";
import { ChartCard, InfoBadge } from "@/shared/ui";
import { ChartContainer } from "@/shared/ui/chart-container";
import type { ThroughputPoint } from "@jira-board/shared";

const SP_COLOR = "#06b6d4";
const ISSUES_COLOR = "#10b981";

const THROUGHPUT_HELP = (
  <>
    <p className="font-medium mb-1.5">Throughput</p>
    <p className="text-muted-foreground leading-relaxed">
      Number of story points and issues completed per time period. Helps
      evaluate delivery capacity over time.
    </p>
    <hr className="my-2 border-border" />
    <dl className="space-y-1.5 text-muted-foreground leading-relaxed">
      <div>
        <dt className="inline font-medium text-popover-foreground">SP Completed</dt>
        <dd className="inline"> — total story points resolved in the period.</dd>
      </div>
      <div>
        <dt className="inline font-medium text-popover-foreground">Issues Completed</dt>
        <dd className="inline"> — total issues resolved in the period.</dd>
      </div>
    </dl>
  </>
);

export function ThroughputChart() {
  const { params, hasProject } = useMetricsParams();
  const { data, isLoading } = useThroughput(params, hasProject);

  return (
    <ChartCard
      title="Throughput"
      hasProject={hasProject}
      isLoading={isLoading}
      isEmpty={!data?.length}
      headerExtra={<InfoBadge>{THROUGHPUT_HELP}</InfoBadge>}
    >
      <ChartContainer height={CHART_HEIGHT}>
        {({ width, height }) => (
          <XYChart
            width={width}
            height={height}
            xScale={{ type: "band", paddingInner: BAR_PADDING }}
            yScale={{ type: "linear" }}
            theme={chartTheme}
          >
            <Grid columns={false} numTicks={CHART_NUM_TICKS} />
            <Axis orientation="bottom" />
            <Axis orientation="left" />
            <BarGroup>
              <BarSeries
                dataKey="SP Completed"
                data={data!}
                xAccessor={(d: ThroughputPoint) => d.period}
                yAccessor={(d: ThroughputPoint) => d.spCompleted}
                colorAccessor={() => SP_COLOR}
              />
              <BarSeries
                dataKey="Issues Completed"
                data={data!}
                xAccessor={(d: ThroughputPoint) => d.period}
                yAccessor={(d: ThroughputPoint) => d.issuesCompleted}
                colorAccessor={() => ISSUES_COLOR}
              />
            </BarGroup>
            <Tooltip
              snapTooltipToDatumX
              showVerticalCrosshair
              showSeriesGlyphs
              unstyled
              applyPositionStyle
              renderTooltip={({ tooltipData }) => {
                const datum = tooltipData?.nearestDatum?.datum as
                  | ThroughputPoint
                  | undefined;
                if (!datum) return null;
                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
                    <div className="font-medium">{datum.period}</div>
                    <div className="mt-1 space-y-0.5 text-muted-foreground">
                      <div>SP Completed: {datum.spCompleted}</div>
                      <div>Issues Completed: {datum.issuesCompleted}</div>
                    </div>
                  </div>
                );
              }}
            />
          </XYChart>
        )}
      </ChartContainer>
    </ChartCard>
  );
}
