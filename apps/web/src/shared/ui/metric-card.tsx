import type { ReactNode } from "react";
import { Card, CardContent } from "./card";
import { cn } from "@/shared/lib/cn";

interface MetricCardProps {
  title: string;
  value: ReactNode;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
  isLoading: boolean;
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
  isLoading,
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              iconClassName,
            )}
          >
            <Icon className="size-4" />
          </div>
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
        <div className="mt-3 font-heading text-2xl font-bold">
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-secondary" />
          ) : (
            value
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
