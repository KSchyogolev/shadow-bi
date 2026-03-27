import { Card, CardContent } from "./card";
import { cn } from "@/shared/lib/cn";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  colorClass?: string;
}

export function StatCard({ label, value, sub, colorClass }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p
          className={cn(
            "text-lg font-bold font-heading leading-tight",
            colorClass ?? "text-foreground",
          )}
        >
          {value}
        </p>
        {sub && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}
