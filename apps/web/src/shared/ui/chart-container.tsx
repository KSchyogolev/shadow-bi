import { useParentSize } from "@visx/responsive";
import type { ReactNode } from "react";

interface ChartContainerProps {
  height?: number;
  children: (dimensions: { width: number; height: number }) => ReactNode;
  className?: string;
}

export function ChartContainer({
  height = 300,
  children,
  className,
}: ChartContainerProps) {
  const { parentRef, width } = useParentSize({ debounceTime: 150 });

  return (
    <div ref={parentRef} className={className} style={{ height }}>
      {width > 0 && children({ width, height })}
    </div>
  );
}
