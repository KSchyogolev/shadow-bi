export interface LegendItem {
  key: string;
  label: string;
  color: string;
}

interface ChartLegendProps {
  items: LegendItem[];
}

export function ChartLegend({ items }: ChartLegendProps) {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-4">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-2">
          <div
            className="size-3 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
