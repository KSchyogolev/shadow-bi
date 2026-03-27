import { CHART_COLORS, chartTheme } from "@/shared/lib/chart-theme";
import { cn } from "@/shared/lib/cn";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ChartLegend,
  ChartTooltip,
  PageHeader,
  Spinner,
} from "@/shared/ui";
import { ChartContainer } from "@/shared/ui/chart-container";
import { SendIcon } from "@/shared/ui/icons";
import { Group } from "@visx/group";
import { Pie } from "@visx/shape";
import { useTooltip } from "@visx/tooltip";
import {
  Axis,
  BarGroup,
  BarSeries,
  Grid,
  LineSeries,
  Tooltip,
  XYChart,
} from "@visx/xychart";
import { useRef, useState, type FormEvent } from "react";

type AgentState = "idle" | "thinking" | "done";

interface SprintComparison {
  metric: string;
  sprint10: number;
  sprint11: number;
}

interface TrendPoint {
  period: string;
  value: number;
}

interface WorkloadSlice {
  label: string;
  value: number;
  color: string;
}

const FAKE_SPRINT_DATA: SprintComparison[] = [
  { metric: "Issues Completed", sprint10: 14, sprint11: 18 },
  { metric: "SP Completed", sprint10: 34, sprint11: 42 },
  { metric: "Avg Cycle Time (d)", sprint10: 4.2, sprint11: 3.1 },
  { metric: "Rework Rate (%)", sprint10: 12, sprint11: 18 },
];

const FAKE_TREND_DATA: TrendPoint[] = [
  { period: "Sprint 6", value: 22 },
  { period: "Sprint 7", value: 28 },
  { period: "Sprint 8", value: 25 },
  { period: "Sprint 9", value: 31 },
  { period: "Sprint 10", value: 34 },
  { period: "Sprint 11", value: 42 },
];

const FAKE_PIE_DATA: WorkloadSlice[] = [
  { label: "Feature", value: 45, color: CHART_COLORS[0] },
  { label: "Bug Fix", value: 20, color: CHART_COLORS[1] },
  { label: "Tech Debt", value: 15, color: CHART_COLORS[2] },
  { label: "Research", value: 10, color: CHART_COLORS[3] },
  { label: "Code Review", value: 10, color: CHART_COLORS[4] },
];

const FAKE_SUMMARY = `### Productivity Analysis: Danil

**Sprint 10 vs Sprint 11:**
Danil showed a notable improvement in Sprint 11 compared to Sprint 10. Story points completed increased from **34 SP to 42 SP** (+23.5%), while average cycle time dropped from **4.2 days to 3.1 days** (−26.2%). However, the rework rate increased from 12% to 18%, suggesting potential issues with code quality or requirements clarity.

**Global Trends:**
Over the last 6 sprints, Danil demonstrates a consistent upward trajectory in throughput, with a particularly strong acceleration starting from Sprint 9. His overall velocity has improved by **91%** compared to Sprint 6.

**Key Takeaway:**
Sprint 11 shows strong throughput gains, but the rising rework rate (+50%) is a concern. Higher velocity may be coming at the cost of quality — worth investigating root causes before the next sprint.`;

const THINKING_STEPS = [
  "Analyzing prompt…",
  "Breaking down query into sub-tasks…",
  "Fetching sprint data from database…",
  "Comparing metrics across sprints…",
  "Aggregating global performance data…",
  "Generating summary and visualizations…",
];

export function AgentPage() {
  const [state, setState] = useState<AgentState>("idle");
  const [prompt, setPrompt] = useState("");
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [thinkingStep, setThinkingStep] = useState(0);
  const [visibleSections, setVisibleSections] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || state === "thinking") return;

    setSubmittedPrompt(prompt.trim());
    setState("thinking");
    setThinkingStep(0);
    setVisibleSections(0);

    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      if (step >= THINKING_STEPS.length) {
        clearInterval(stepInterval);
        setState("done");
        revealSections();
        return;
      }
      setThinkingStep(step);
    }, 600);
  };

  const revealSections = () => {
    let section = 0;
    const total = 4;
    const reveal = setInterval(() => {
      section++;
      setVisibleSections(section);
      if (section >= total) clearInterval(reveal);
    }, 200);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent"
        description="Ask questions about your project — powered by AI"
      />

      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Enter your question about the project or team..."
          rows={3}
          className={cn(
            "w-full resize-none rounded-xl border border-border bg-card px-4 py-3 pr-14",
            "text-sm text-foreground placeholder:text-muted-foreground/60",
            "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60",
            "transition-shadow duration-200",
          )}
        />
        <button
          type="submit"
          disabled={!prompt.trim() || state === "thinking"}
          className={cn(
            "absolute right-3 bottom-3 rounded-lg p-2",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed",
            "transition-all duration-150",
          )}
        >
          <SendIcon className="size-4" />
        </button>
      </form>

      {state === "thinking" && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <Spinner size="sm" />
              <span className="text-sm text-muted-foreground animate-pulse">
                {THINKING_STEPS[thinkingStep]}
              </span>
            </div>
            <div className="mt-4 flex gap-1.5">
              {THINKING_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors duration-300",
                    i <= thinkingStep ? "bg-primary" : "bg-muted",
                  )}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {state === "done" && (
        <div ref={resultsRef} className="space-y-6">
          {submittedPrompt && (
            <div className="text-sm text-muted-foreground border-l-2 border-primary/40 pl-3">
              {submittedPrompt}
            </div>
          )}

          <div
            className={cn(
              "transition-all duration-500",
              visibleSections >= 1
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4",
            )}
          >
            <SummaryCard />
          </div>

          <div
            className={cn(
              "grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-500",
              visibleSections >= 2
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4",
            )}
          >
            <SprintComparisonChart />
            <ThroughputTrendChart />
          </div>

          <div
            className={cn(
              "grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-500",
              visibleSections >= 3
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4",
            )}
          >
            <div className="lg:col-span-2">
              <MetricsTable />
            </div>
            <WorkDistributionPie />
          </div>

          <div
            className={cn(
              "transition-all duration-500",
              visibleSections >= 4
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4",
            )}
          >
            <Card>
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground text-center">
                  Generated by AI agent — data may be approximate. Verify
                  critical metrics on the Dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard() {
  const lines = FAKE_SUMMARY.split("\n").filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm prose-invert max-w-none space-y-3">
          {lines.map((line, i) => {
            if (line.startsWith("### ")) {
              return (
                <h4 key={i} className="text-base font-semibold text-foreground">
                  {line.replace("### ", "")}
                </h4>
              );
            }
            if (line.startsWith("**") && line.endsWith("**")) {
              return (
                <h5
                  key={i}
                  className="text-sm font-semibold text-foreground mt-4"
                >
                  {line.replace(/\*\*/g, "")}
                </h5>
              );
            }
            const formatted = line.replace(
              /\*\*([^*]+)\*\*/g,
              '<strong class="text-foreground font-semibold">$1</strong>',
            );
            return (
              <p
                key={i}
                className="text-sm text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatted }}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

const S10_COLOR = "#f59e0b";
const S11_COLOR = "#06b6d4";

function SprintComparisonChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sprint 10 vs Sprint 11</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer height={280}>
          {({ width, height }) => (
            <XYChart
              width={width}
              height={height}
              xScale={{ type: "band", paddingInner: 0.3 }}
              yScale={{ type: "linear" }}
              theme={chartTheme}
            >
              <Grid columns={false} numTicks={5} />
              <Axis orientation="bottom" />
              <Axis orientation="left" />
              <BarGroup>
                <BarSeries
                  dataKey="Sprint 10"
                  data={FAKE_SPRINT_DATA}
                  xAccessor={(d: SprintComparison) => d.metric}
                  yAccessor={(d: SprintComparison) => d.sprint10}
                  colorAccessor={() => S10_COLOR}
                />
                <BarSeries
                  dataKey="Sprint 11"
                  data={FAKE_SPRINT_DATA}
                  xAccessor={(d: SprintComparison) => d.metric}
                  yAccessor={(d: SprintComparison) => d.sprint11}
                  colorAccessor={() => S11_COLOR}
                />
              </BarGroup>
              <Tooltip
                snapTooltipToDatumX
                showVerticalCrosshair
                showSeriesGlyphs
                renderTooltip={({ tooltipData }) => {
                  const datum = tooltipData?.nearestDatum?.datum as
                    | SprintComparison
                    | undefined;
                  if (!datum) return null;
                  return (
                    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-md">
                      <div className="font-medium">{datum.metric}</div>
                      <div className="mt-1 space-y-0.5 text-muted-foreground">
                        <div>Sprint 10: {datum.sprint10}</div>
                        <div>Sprint 11: {datum.sprint11}</div>
                      </div>
                    </div>
                  );
                }}
              />
            </XYChart>
          )}
        </ChartContainer>
        <ChartLegend
          items={[
            { key: "s10", label: "Sprint 10", color: S10_COLOR },
            { key: "s11", label: "Sprint 11", color: S11_COLOR },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function ThroughputTrendChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Throughput Trend (SP)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer height={280}>
          {({ width, height }) => (
            <XYChart
              width={width}
              height={height}
              xScale={{ type: "band", paddingInner: 0.1 }}
              yScale={{ type: "linear" }}
              theme={chartTheme}
            >
              <Grid columns={false} numTicks={5} />
              <Axis orientation="bottom" />
              <Axis orientation="left" />
              <LineSeries
                dataKey="SP Completed"
                data={FAKE_TREND_DATA}
                xAccessor={(d: TrendPoint) => d.period}
                yAccessor={(d: TrendPoint) => d.value}
              />
              <Tooltip
                snapTooltipToDatumX
                showVerticalCrosshair
                showSeriesGlyphs
                renderTooltip={({ tooltipData }) => {
                  const datum = tooltipData?.nearestDatum?.datum as
                    | TrendPoint
                    | undefined;
                  if (!datum) return null;
                  return (
                    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-md">
                      <div className="font-medium">{datum.period}</div>
                      <div className="mt-1 text-muted-foreground">
                        SP: {datum.value}
                      </div>
                    </div>
                  );
                }}
              />
            </XYChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function MetricsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">
                  Metric
                </th>
                <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">
                  Sprint 10
                </th>
                <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">
                  Sprint 11
                </th>
                <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">
                  Change
                </th>
              </tr>
            </thead>
            <tbody>
              {FAKE_SPRINT_DATA.map((row) => {
                const diff = row.sprint11 - row.sprint10;
                const pct =
                  row.sprint10 > 0
                    ? ((diff / row.sprint10) * 100).toFixed(1)
                    : "—";
                const isPositive =
                  row.metric.includes("Rework") ||
                  row.metric.includes("Cycle Time")
                    ? diff < 0
                    : diff > 0;

                return (
                  <tr
                    key={row.metric}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-2.5 px-3 text-foreground font-medium">
                      {row.metric}
                    </td>
                    <td className="py-2.5 px-3 text-right text-muted-foreground">
                      {row.sprint10}
                    </td>
                    <td className="py-2.5 px-3 text-right text-foreground">
                      {row.sprint11}
                    </td>
                    <td
                      className={cn(
                        "py-2.5 px-3 text-right font-medium",
                        isPositive ? "text-emerald-500" : "text-red-400",
                      )}
                    >
                      {diff > 0 ? "+" : ""}
                      {diff} ({pct}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkDistributionPie() {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    showTooltip,
    hideTooltip,
  } = useTooltip<WorkloadSlice>();

  const total = FAKE_PIE_DATA.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="relative">
          <ChartContainer height={240}>
            {({ width, height }) => {
              const centerX = width / 2;
              const centerY = height / 2;
              const outerRadius = Math.min(width, height) / 2 - 10;
              const innerRadius = outerRadius * 0.55;

              return (
                <svg width={width} height={height}>
                  <Group left={centerX} top={centerY}>
                    <Pie<WorkloadSlice>
                      data={FAKE_PIE_DATA}
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
                                  tooltipTop: e.clientY - rect.top - 8,
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
                      fontSize={20}
                      fontWeight={600}
                    >
                      {total}%
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
                  {tooltipData.value}%
                </div>
              </div>
            </ChartTooltip>
          )}

          <ChartLegend
            items={FAKE_PIE_DATA.map((d) => ({
              key: d.label,
              label: d.label,
              color: d.color,
            }))}
          />
        </div>
      </CardContent>
    </Card>
  );
}
