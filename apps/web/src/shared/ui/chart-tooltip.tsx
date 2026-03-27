import { TooltipWithBounds } from "@visx/tooltip";
import type { ReactNode } from "react";

interface ChartTooltipProps {
  left?: number;
  top?: number;
  children: ReactNode;
}

const tooltipStyle = {
  position: "absolute" as const,
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  padding: "8px 12px",
  fontSize: "12px",
  color: "var(--foreground)",
  pointerEvents: "none" as const,
};

export function ChartTooltip({ left, top, children }: ChartTooltipProps) {
  return (
    <TooltipWithBounds left={left} top={top} style={tooltipStyle}>
      {children}
    </TooltipWithBounds>
  );
}
