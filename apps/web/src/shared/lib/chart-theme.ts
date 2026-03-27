import { buildChartTheme } from "@visx/xychart";

export const CHART_COLORS = [
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
] as const;

export const chartTheme = buildChartTheme({
  backgroundColor: "transparent",
  colors: [...CHART_COLORS],
  gridColor: "#1e293b",
  gridColorDark: "#334155",
  tickLength: 4,
});
