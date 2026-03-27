import { useVelocity } from "@/entities/sprint";
import { useSprintChartParams } from "@/features/filter-issues";
import {
  BAR_PADDING,
  CHART_HEIGHT,
  CHART_NUM_TICKS,
  VISIBLE_SPRINTS,
} from "@/shared/config";
import { chartTheme } from "@/shared/lib/chart-theme";
import { ChartCard, InfoBadge, Skeleton } from "@/shared/ui";
import { ChartContainer } from "@/shared/ui/chart-container";
import type { VelocityPoint } from "@jira-board/shared";
import {
  Axis,
  BarSeries,
  BarStack,
  Grid,
  LineSeries,
  Tooltip,
  XYChart,
} from "@visx/xychart";

const COLOR_NEW = "#38bdf8";
const COLOR_CARRY_OVER = "#fb7185";
const COLOR_ADDED = "#a78bfa";
const COLOR_COMPLETED = "#34d399";

const VELOCITY_HELP = (
  <>
    <p className="font-medium mb-1.5">Sprint Velocity</p>
    <p className="text-muted-foreground leading-relaxed">
      Stacked breakdown of story points committed per sprint: new scope,
      carry-over from previous sprints, and items added mid-sprint. The line
      shows how many points were actually completed.
    </p>
    <hr className="my-2 border-border" />
    <dl className="space-y-1.5 text-muted-foreground leading-relaxed">
      <div>
        <dt className="inline font-medium text-popover-foreground">New</dt>
        <dd className="inline">
          {" "}
          — points planned at sprint start (original scope).
        </dd>
      </div>
      <div>
        <dt className="inline font-medium text-popover-foreground">
          Carry-over
        </dt>
        <dd className="inline">
          {" "}
          — points rolled over from a previous sprint.
        </dd>
      </div>
      <div>
        <dt className="inline font-medium text-popover-foreground">
          Added mid-sprint
        </dt>
        <dd className="inline"> — points added after the sprint started.</dd>
      </div>
      <div>
        <dt className="inline font-medium text-popover-foreground">
          Completed
        </dt>
        <dd className="inline">
          {" "}
          — points actually resolved within the sprint.
        </dd>
      </div>
    </dl>
  </>
);

const LEGEND_ITEMS = [
  { label: "New", color: COLOR_NEW },
  { label: "Carry-over", color: COLOR_CARRY_OVER },
  { label: "Added mid-sprint", color: COLOR_ADDED },
  { label: "Completed", color: COLOR_COMPLETED, isLine: true },
];

export function SprintVelocityDetailed() {
  const { params, hasProject } = useSprintChartParams();
  const { data, isLoading } = useVelocity(params, hasProject);

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

            <BarStack>
              <BarSeries
                dataKey="New"
                data={data!}
                xAccessor={(d: VelocityPoint) => d.sprintName}
                yAccessor={(d: VelocityPoint) => d.newSp}
                colorAccessor={() => COLOR_NEW}
              />
              <BarSeries
                dataKey="Carry-over"
                data={data!}
                xAccessor={(d: VelocityPoint) => d.sprintName}
                yAccessor={(d: VelocityPoint) => d.carryOverSp}
                colorAccessor={() => COLOR_CARRY_OVER}
              />
              <BarSeries
                dataKey="Added mid-sprint"
                data={data!}
                xAccessor={(d: VelocityPoint) => d.sprintName}
                yAccessor={(d: VelocityPoint) => d.addedSp}
                colorAccessor={() => COLOR_ADDED}
              />
            </BarStack>

            <LineSeries
              dataKey="Completed"
              data={data!}
              xAccessor={(d: VelocityPoint) => d.sprintName}
              yAccessor={(d: VelocityPoint) => d.completed}
              colorAccessor={() => COLOR_COMPLETED}
              strokeWidth={3}
            />

            <Axis orientation="bottom" />
            <Axis orientation="left" numTicks={CHART_NUM_TICKS} />

            <Tooltip
              snapTooltipToDatumX
              showSeriesGlyphs
              unstyled
              applyPositionStyle
              renderTooltip={({ tooltipData }) => {
                const datum = tooltipData?.nearestDatum?.datum as
                  | VelocityPoint
                  | undefined;
                if (!datum) return null;

                const rows = [
                  { label: "New", value: datum.newSp, color: COLOR_NEW },
                  {
                    label: "Carry-over",
                    value: datum.carryOverSp,
                    color: COLOR_CARRY_OVER,
                  },
                  {
                    label: "Added mid-sprint",
                    value: datum.addedSp,
                    color: COLOR_ADDED,
                  },
                ];

                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
                    <div className="font-medium">{datum.sprintName}</div>
                    <div className="mt-1 space-y-0.5 text-muted-foreground">
                      {rows.map((r) => (
                        <div
                          key={r.label}
                          className="flex items-center gap-1.5"
                        >
                          <span
                            className="inline-block size-2 rounded-sm"
                            style={{ background: r.color }}
                          />
                          {r.label}: {r.value} SP
                        </div>
                      ))}
                      <div className="border-t border-border/50 pt-0.5 mt-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-block w-3 h-0.5 rounded-full"
                            style={{ background: COLOR_COMPLETED }}
                          />
                          Completed: {datum.completed} SP
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </XYChart>
        )}
      </ChartContainer>

      <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-muted-foreground flex-wrap">
        {LEGEND_ITEMS.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            {item.isLine ? (
              <span
                className="inline-block w-3 h-0.5 rounded-full"
                style={{ background: item.color }}
              />
            ) : (
              <span
                className="inline-block size-2 rounded-sm"
                style={{ background: item.color }}
              />
            )}
            {item.label}
          </span>
        ))}
      </div>
    </ChartCard>
  );
}

function VelocitySkeleton() {
  return (
    <div className="h-[300px] flex items-end gap-6 px-8 pb-8 pt-4">
      {Array.from({ length: VISIBLE_SPRINTS }).map((_, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col justify-end gap-0.5 h-full"
        >
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
