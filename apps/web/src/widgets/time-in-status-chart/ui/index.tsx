import { useRef } from "react";
import { useTimeInStatus } from "@/entities/metrics";
import { useMetricsParams } from "@/features/filter-issues";
import { AXIS_MARGIN, CHART_HEIGHT, CHART_NUM_TICKS, GRID_STROKE, TICK_FILL, TOOLTIP_Y_OFFSET } from "@/shared/config";
import { CHART_COLORS } from "@/shared/lib/chart-theme";
import { ChartContainer } from "@/shared/ui/chart-container";
import { ChartCard, ChartTooltip, InfoBadge } from "@/shared/ui";
import { formatMinutes } from "@/shared/lib/format";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";
import { Group } from "@visx/group";
import { GridRows } from "@visx/grid";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { useTooltip } from "@visx/tooltip";
import type { TimeInStatusPoint } from "@jira-board/shared";

const TIME_IN_STATUS_HELP = (
  <>
    <p className="font-medium mb-1.5">Time in Status</p>
    <p className="text-muted-foreground leading-relaxed">
      Average time issues spend in each workflow status across the selected
      period.
    </p>
    <hr className="my-2 border-border" />
    <dl className="space-y-1.5 text-muted-foreground leading-relaxed">
      <div>
        <dt className="inline font-medium text-popover-foreground">Avg</dt>
        <dd className="inline"> — arithmetic mean of all issues.</dd>
      </div>
      <div>
        <dt className="inline font-medium text-popover-foreground">Median</dt>
        <dd className="inline"> — middle value; less sensitive to outliers than Avg.</dd>
      </div>
      <div>
        <dt className="inline font-medium text-popover-foreground">P90</dt>
        <dd className="inline"> — 90th percentile; 90% of issues are faster than this.</dd>
      </div>
    </dl>
  </>
);

export function TimeInStatusChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { params, hasProject } = useMetricsParams();
  const { data, isLoading } = useTimeInStatus(params, hasProject);
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    showTooltip,
    hideTooltip,
  } = useTooltip<TimeInStatusPoint>();

  const maxMinutes = data ? Math.max(...data.map((d) => d.avgMinutes), 1) : 1;

  return (
    <ChartCard
      title="Time in Status"
      isLoading={isLoading}
      isEmpty={!data?.length}
      headerExtra={<InfoBadge>{TIME_IN_STATUS_HELP}</InfoBadge>}
    >
      <div ref={containerRef} className="relative">
        <ChartContainer height={CHART_HEIGHT}>
          {({ width, height }) => {
            const xMax = width - AXIS_MARGIN.left - AXIS_MARGIN.right;
            const yMax = height - AXIS_MARGIN.top - AXIS_MARGIN.bottom;

            const xScale = scaleBand({
              domain: data!.map((d) => d.status),
              range: [0, xMax],
              padding: 0.3,
            });

            const yScale = scaleLinear({
              domain: [0, maxMinutes],
              range: [yMax, 0],
              nice: true,
            });

            return (
              <svg width={width} height={height}>
                <Group left={AXIS_MARGIN.left} top={AXIS_MARGIN.top}>
                  <GridRows
                    scale={yScale}
                    width={xMax}
                    stroke={GRID_STROKE}
                    numTicks={CHART_NUM_TICKS}
                  />

                  {data!.map((d, i) => {
                    const barWidth = xScale.bandwidth();
                    const barHeight = Math.max(0, yMax - yScale(d.avgMinutes));
                    const barX = xScale(d.status) ?? 0;
                    const barY = yScale(d.avgMinutes);

                    return (
                      <Bar
                        key={d.status}
                        x={barX}
                        y={barY}
                        width={barWidth}
                        height={barHeight}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                        rx={3}
                        onMouseEnter={(e) => {
                          const rect =
                            containerRef.current?.getBoundingClientRect();
                          if (rect) {
                            showTooltip({
                              tooltipData: d,
                              tooltipLeft: e.clientX - rect.left,
                              tooltipTop: e.clientY - rect.top - TOOLTIP_Y_OFFSET,
                            });
                          }
                        }}
                        onMouseLeave={hideTooltip}
                      />
                    );
                  })}

                  <AxisLeft
                    scale={yScale}
                    numTicks={CHART_NUM_TICKS}
                    stroke="transparent"
                    tickStroke="transparent"
                    tickLength={0}
                    tickLabelProps={() => ({
                      fill: TICK_FILL,
                      fontSize: 11,
                      fontWeight: 500,
                      textAnchor: "end",
                      dx: "-0.4em",
                      dy: "0.3em",
                    })}
                    tickFormat={(v) => formatMinutes(Number(v))}
                  />

                  <AxisBottom
                    scale={xScale}
                    top={yMax}
                    stroke="transparent"
                    tickStroke="transparent"
                    tickLength={0}
                    tickLabelProps={() => ({
                      fill: TICK_FILL,
                      fontSize: 10,
                      fontWeight: 500,
                      textAnchor: "end",
                      angle: -35,
                      dx: "-0.3em",
                      dy: "0.15em",
                    })}
                  />
                </Group>
              </svg>
            );
          }}
        </ChartContainer>

        {tooltipOpen && tooltipData && (
          <ChartTooltip left={tooltipLeft} top={tooltipTop}>
            <div className="space-y-1">
              <div className="font-medium">{tooltipData.status}</div>
              <div className="text-muted-foreground text-xs">
                Avg: {formatMinutes(tooltipData.avgMinutes)}
              </div>
              <div className="text-muted-foreground text-xs">
                Median: {formatMinutes(tooltipData.medianMinutes)}
              </div>
              <div className="text-muted-foreground text-xs">
                P90: {formatMinutes(tooltipData.p90Minutes)}
              </div>
            </div>
          </ChartTooltip>
        )}
      </div>
    </ChartCard>
  );
}
