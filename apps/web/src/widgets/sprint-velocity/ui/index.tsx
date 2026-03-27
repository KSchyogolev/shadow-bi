import { useVelocity } from "@/entities/sprint";
import { useSprintChartParams } from "@/features/filter-issues";
import { BAR_PADDING, CHART_HEIGHT, CHART_NUM_TICKS, VISIBLE_SPRINTS } from "@/shared/config";
import { CHART_COLORS, chartTheme } from "@/shared/lib/chart-theme";
import { ChartCard, InfoBadge, Skeleton } from "@/shared/ui";
import { ChartContainer } from "@/shared/ui/chart-container";
import type { VelocityPoint } from "@jira-board/shared";
import { Axis, BarSeries, Grid, LineSeries, Tooltip, XYChart } from "@visx/xychart";
import { useMemo } from "react";

const BAR_COLOR = CHART_COLORS[0];
const MEDIAN_COLOR = "#f59e0b";

const VELOCITY_HELP = (
  <>
    <p className="font-medium mb-1.5">Velocity</p>
    <p className="text-muted-foreground leading-relaxed">
      Total story points completed in each sprint. The median line shows the
      team's typical velocity, smoothing out sprint-to-sprint variation.
    </p>
    <hr className="my-2 border-border" />
    <dl className="space-y-1.5 text-muted-foreground leading-relaxed">
      <div>
        <dt className="inline font-medium text-popover-foreground">Completed</dt>
        <dd className="inline"> — story points resolved within the sprint.</dd>
      </div>
      <div>
        <dt className="inline font-medium text-popover-foreground">Median</dt>
        <dd className="inline"> — middle value across all sprints; a stable baseline.</dd>
      </div>
    </dl>
  </>
);

function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

type MedianPoint = { sprintName: string; median: number };

export function SprintVelocity() {
  const { params, hasProject } = useSprintChartParams();
  const { data, isLoading } = useVelocity(params, hasProject);

  const median = useMemo(() => {
    const nonZero = data?.map((d) => d.completed).filter((v) => v > 0) ?? [];
    return nonZero.length ? computeMedian(nonZero) : 0;
  }, [data]);

  const medianData = useMemo<MedianPoint[]>(
    () => data?.map((d) => ({ sprintName: d.sprintName, median })) ?? [],
    [data, median],
  );

  return (
    <ChartCard
      title="Velocity"
      hasProject={hasProject}
      isLoading={isLoading}
      isEmpty={!data?.length}
      loadingContent={<VelocitySkeleton />}
      headerExtra={<InfoBadge>{VELOCITY_HELP}</InfoBadge>}
    >
      <ChartContainer height={CHART_HEIGHT}>
        {({ width, height }) => (
          <XYChart
            width={width}
            height={height}
            theme={chartTheme}
            xScale={{ type: "band", paddingInner: BAR_PADDING }}
            yScale={{ type: "linear" }}
          >
            <Grid columns={false} numTicks={CHART_NUM_TICKS} />
            <BarSeries
              dataKey="Velocity"
              data={data!}
              xAccessor={(d: VelocityPoint) => d.sprintName}
              yAccessor={(d: VelocityPoint) => d.completed}
              colorAccessor={() => BAR_COLOR}
            />
            <LineSeries
              dataKey="Median"
              data={medianData}
              xAccessor={(d: MedianPoint) => d.sprintName}
              yAccessor={(d: MedianPoint) => d.median}
              colorAccessor={() => MEDIAN_COLOR}
              strokeWidth={2}
            />
            <Axis orientation="bottom" />
            <Axis orientation="left" numTicks={CHART_NUM_TICKS} />
            <Tooltip
              snapTooltipToDatumX
              showSeriesGlyphs
              unstyled
              applyPositionStyle
              renderTooltip={({ tooltipData }) => {
                const d = tooltipData?.datumByKey?.["Velocity"]
                  ?.datum as VelocityPoint | undefined;
                if (!d) return null;
                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
                    <div className="font-medium">{d.sprintName}</div>
                    <div className="mt-1 space-y-0.5 text-muted-foreground">
                      <div>Completed: {d.completed} SP</div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-block w-3 h-0.5 rounded-full"
                          style={{ background: MEDIAN_COLOR }}
                        />
                        Median: {median} SP
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </XYChart>
        )}
      </ChartContainer>
      <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-sm" style={{ background: BAR_COLOR }} />
          Velocity
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 rounded-full" style={{ background: MEDIAN_COLOR }} />
          Median ({median} SP)
        </span>
      </div>
    </ChartCard>
  );
}

function VelocitySkeleton() {
  return (
    <div className="h-[300px] flex items-end gap-6 px-8 pb-8 pt-4">
      {Array.from({ length: VISIBLE_SPRINTS }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end gap-0.5 h-full">
          <Skeleton
            className="w-full rounded-t-md"
            style={{ height: `${35 + Math.sin(i * 1.8) * 25 + 15}%` }}
          />
          <Skeleton className="h-3 w-full mt-2" />
        </div>
      ))}
    </div>
  );
}
