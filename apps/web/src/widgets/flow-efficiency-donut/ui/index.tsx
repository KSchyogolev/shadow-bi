import { useRef } from "react";
import { useFlowEfficiency } from "@/entities/metrics";
import { useMetricsParams } from "@/features/filter-issues";
import { TOOLTIP_Y_OFFSET } from "@/shared/config";
import { ChartContainer } from "@/shared/ui/chart-container";
import { ChartCard, ChartTooltip, ChartLegend, InfoBadge } from "@/shared/ui";
import { formatMinutes } from "@/shared/lib/format";
import { Pie } from "@visx/shape";
import { Group } from "@visx/group";
import { useTooltip } from "@visx/tooltip";

const ACTIVE_COLOR = "#10b981";
const QUEUE_COLOR = "#f59e0b";

const FLOW_EFFICIENCY_HELP = (
  <>
    <p className="font-medium mb-1.5">Flow Efficiency</p>
    <p className="text-muted-foreground leading-relaxed">
      Ratio of active work time to total time (active + waiting). Higher values
      indicate less time spent in queues.
    </p>
    <hr className="my-2 border-border" />
    <dl className="space-y-1.5 text-muted-foreground leading-relaxed">
      <div>
        <dt className="inline font-medium text-popover-foreground">Active</dt>
        <dd className="inline"> — time spent in statuses mapped to the Active phase.</dd>
      </div>
      <div>
        <dt className="inline font-medium text-popover-foreground">Queue</dt>
        <dd className="inline"> — time spent waiting (statuses mapped to Queue phase).</dd>
      </div>
    </dl>
  </>
);

type SliceDatum = { label: string; value: number; color: string };

export function FlowEfficiencyDonut() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { params, hasProject } = useMetricsParams();
  const { data, isLoading } = useFlowEfficiency(params, hasProject);
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    showTooltip,
    hideTooltip,
  } = useTooltip<SliceDatum>();

  const totalActive = data?.reduce((sum, d) => sum + d.activeMin, 0) ?? 0;
  const totalQueue = data?.reduce((sum, d) => sum + d.queueMin, 0) ?? 0;
  const total = totalActive + totalQueue;
  const efficiency = total > 0 ? (totalActive / total) * 100 : 0;

  const pieData: SliceDatum[] = [
    { label: "Active", value: totalActive, color: ACTIVE_COLOR },
    { label: "Queue", value: totalQueue, color: QUEUE_COLOR },
  ].filter((d) => d.value > 0);

  return (
    <ChartCard
      title="Flow Efficiency"
      isLoading={isLoading}
      isEmpty={!data?.length || pieData.length === 0}
      headerExtra={<InfoBadge>{FLOW_EFFICIENCY_HELP}</InfoBadge>}
    >
      <div ref={containerRef} className="relative">
        <ChartContainer height={280}>
          {({ width, height }) => {
            const centerX = width / 2;
            const centerY = height / 2 - 20;
            const outerRadius = Math.min(width, height) / 2 - 20;
            const innerRadius = outerRadius * 0.6;

            return (
              <svg width={width} height={height}>
                <Group left={centerX} top={centerY}>
                  <Pie<SliceDatum>
                    data={pieData}
                    pieValue={(d) => d.value}
                    outerRadius={outerRadius}
                    innerRadius={innerRadius}
                  >
                    {(pie) =>
                      pie.arcs.map((arc) => (
                        <path
                          key={arc.data.label}
                          d={pie.path(arc) ?? ""}
                          fill={arc.data.color}
                          onMouseEnter={(e) => {
                            const rect =
                              containerRef.current?.getBoundingClientRect();
                            if (rect) {
                              showTooltip({
                                tooltipData: arc.data,
                                tooltipLeft: e.clientX - rect.left,
                                tooltipTop: e.clientY - rect.top - TOOLTIP_Y_OFFSET,
                              });
                            }
                          }}
                          onMouseLeave={hideTooltip}
                        />
                      ))
                    }
                  </Pie>

                  <text
                    textAnchor="middle"
                    dy="0.33em"
                    fill="var(--foreground)"
                    fontSize={24}
                    fontWeight={600}
                  >
                    {efficiency.toFixed(1)}%
                  </text>
                  <text
                    textAnchor="middle"
                    dy="1.4em"
                    fill="var(--muted-foreground)"
                    fontSize={12}
                  >
                    efficiency
                  </text>
                </Group>
              </svg>
            );
          }}
        </ChartContainer>

        {tooltipOpen && tooltipData && (
          <ChartTooltip left={tooltipLeft} top={tooltipTop}>
            <div>
              <div className="font-medium">{tooltipData.label}</div>
              <div className="text-muted-foreground text-xs">
                {formatMinutes(tooltipData.value)}
              </div>
            </div>
          </ChartTooltip>
        )}

        <ChartLegend
          items={[
            { key: "active", label: "Active", color: ACTIVE_COLOR },
            { key: "queue", label: "Queue", color: QUEUE_COLOR },
          ]}
        />
      </div>
    </ChartCard>
  );
}
