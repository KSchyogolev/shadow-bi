import {
  Axis,
  Grid,
  LineSeries,
  Tooltip,
  XYChart,
} from "@visx/xychart";
import { useCycleTimeBySprint } from "@/entities/metrics";
import { useSprintChartParams } from "@/features/filter-issues";
import { BAR_PADDING, CHART_HEIGHT, CHART_NUM_TICKS } from "@/shared/config";
import { chartTheme } from "@/shared/lib/chart-theme";
import { ChartCard, InfoBadge } from "@/shared/ui";
import { ChartContainer } from "@/shared/ui/chart-container";
import type { CycleTimeBySprintPoint } from "@jira-board/shared";

const MEDIAN_COLOR = "#06b6d4";
const P85_COLOR = "#f97316";

const CYCLE_TIME_HELP = (
  <>
    <p className="font-medium mb-1.5">Cycle Time per Sprint</p>
    <p className="text-muted-foreground leading-relaxed">
      How long issues take from first active status to completion, tracked across
      sprints.
    </p>
    <hr className="my-2 border-border" />
    <dl className="space-y-1.5 text-muted-foreground leading-relaxed">
      <div>
        <dt className="inline font-medium text-popover-foreground">Median</dt>
        <dd className="inline"> — middle value; less sensitive to outliers.</dd>
      </div>
      <div>
        <dt className="inline font-medium text-popover-foreground">P85</dt>
        <dd className="inline"> — 85th percentile; 85% of issues are faster than this.</dd>
      </div>
    </dl>
  </>
);

const xAccessor = (d: CycleTimeBySprintPoint) => d.sprint;
const medianAccessor = (d: CycleTimeBySprintPoint) => d.medianHours;
const p85Accessor = (d: CycleTimeBySprintPoint) => d.p85Hours;

export function CycleTimeTrend() {
  const { params, hasProject } = useSprintChartParams();
  const { data, isLoading } = useCycleTimeBySprint(params, hasProject);

  return (
    <ChartCard
      title="Cycle Time per Sprint"
      hasProject={hasProject}
      isLoading={isLoading}
      isEmpty={!data?.length}
      headerExtra={<InfoBadge>{CYCLE_TIME_HELP}</InfoBadge>}
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
            <Axis orientation="left" label="Hours" />
            <LineSeries
              dataKey="Median"
              data={data!}
              xAccessor={xAccessor}
              yAccessor={medianAccessor}
              colorAccessor={() => MEDIAN_COLOR}
            />
            <LineSeries
              dataKey="P85"
              data={data!}
              xAccessor={xAccessor}
              yAccessor={p85Accessor}
              colorAccessor={() => P85_COLOR}
            />
            <Tooltip<CycleTimeBySprintPoint>
              snapTooltipToDatumX
              showVerticalCrosshair
              showSeriesGlyphs
              unstyled
              applyPositionStyle
              renderTooltip={({ tooltipData }) => {
                const datum = tooltipData?.nearestDatum?.datum as
                  | CycleTimeBySprintPoint
                  | undefined;
                if (!datum) return null;
                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
                    <div className="font-medium">{datum.sprint}</div>
                    <div className="mt-1 space-y-0.5 text-muted-foreground">
                      <div>
                        <span
                          className="mr-1.5 inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: MEDIAN_COLOR }}
                        />
                        Median: {datum.medianHours}h
                      </div>
                      <div>
                        <span
                          className="mr-1.5 inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: P85_COLOR }}
                        />
                        P85: {datum.p85Hours}h
                      </div>
                      <div>
                        {datum.count} issues · avg {datum.avgHours}h
                      </div>
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
