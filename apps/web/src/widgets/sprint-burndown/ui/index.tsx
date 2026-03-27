import { useSprintBurndown } from "@/entities/sprint";
import { CHART_HEIGHT, CHART_NUM_TICKS } from "@/shared/config";
import { CHART_COLORS, chartTheme } from "@/shared/lib/chart-theme";
import { ChartCard, InfoBadge, Skeleton } from "@/shared/ui";
import { ChartContainer } from "@/shared/ui/chart-container";
import type { BurndownPoint } from "@jira-board/shared";
import { Axis, Grid, LineSeries, Tooltip, XYChart } from "@visx/xychart";

const ACTUAL_COLOR = CHART_COLORS[0];
const IDEAL_COLOR = "#475569";

const BURNDOWN_HELP = (
  <>
    <p className="font-medium mb-1.5">Burndown</p>
    <p className="text-muted-foreground leading-relaxed">
      Remaining story points over the course of the sprint. Compares actual
      progress to the ideal (linear) burn.
    </p>
    <hr className="my-2 border-border" />
    <dl className="space-y-1.5 text-muted-foreground leading-relaxed">
      <div>
        <dt className="inline font-medium text-popover-foreground">Remaining</dt>
        <dd className="inline"> — actual story points still open at each day.</dd>
      </div>
      <div>
        <dt className="inline font-medium text-popover-foreground">Ideal</dt>
        <dd className="inline"> — linear guideline for even daily progress.</dd>
      </div>
    </dl>
  </>
);

export function SprintBurndown({ sprintId }: { sprintId: string }) {
  const { data, isLoading } = useSprintBurndown(sprintId);

  return (
    <ChartCard
      title="Burndown"
      isLoading={isLoading}
      isEmpty={!data?.length}
      loadingContent={<BurndownSkeleton />}
      headerExtra={<InfoBadge>{BURNDOWN_HELP}</InfoBadge>}
    >
      <ChartContainer height={CHART_HEIGHT}>
        {({ width, height }) => (
          <XYChart
            width={width}
            height={height}
            theme={chartTheme}
            xScale={{ type: "band" }}
            yScale={{ type: "linear" }}
          >
            <Grid columns={false} numTicks={CHART_NUM_TICKS} />
            <LineSeries
              dataKey="Ideal"
              data={data!}
              xAccessor={(d: BurndownPoint) => d.date}
              yAccessor={(d: BurndownPoint) => d.ideal}
              colorAccessor={() => IDEAL_COLOR}
              strokeDasharray="6 3"
            />
            <LineSeries
              dataKey="Remaining"
              data={data!}
              xAccessor={(d: BurndownPoint) => d.date}
              yAccessor={(d: BurndownPoint) => d.remaining}
              colorAccessor={() => ACTUAL_COLOR}
            />
            <Axis orientation="bottom" numTicks={CHART_NUM_TICKS} />
            <Axis orientation="left" numTicks={CHART_NUM_TICKS} />
            <Tooltip
              snapTooltipToDatumX
              showVerticalCrosshair
              showSeriesGlyphs
              unstyled
              applyPositionStyle
              renderTooltip={({ tooltipData }) => {
                const d = tooltipData?.nearestDatum?.datum as BurndownPoint | undefined;
                if (!d) return null;
                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
                    <div className="font-medium">{d.date}</div>
                    <div className="mt-1 space-y-0.5 text-muted-foreground">
                      <div>Remaining: {d.remaining} SP</div>
                      <div>Ideal: {d.ideal} SP</div>
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

function BurndownSkeleton() {
  return (
    <div className="h-[300px] flex flex-col justify-between py-4">
      <div className="space-y-3 flex-1 flex flex-col justify-between px-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-3 w-8 shrink-0" />
            <Skeleton className="h-px flex-1" style={{ opacity: 1 - i * 0.15 }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-3 px-10">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-10" />
        ))}
      </div>
    </div>
  );
}
