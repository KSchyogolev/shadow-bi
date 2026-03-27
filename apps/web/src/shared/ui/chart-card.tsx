import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

interface ChartCardProps {
  title: string;
  hasProject?: boolean;
  isLoading?: boolean;
  isEmpty?: boolean;
  /** Replaces the default loading skeleton */
  loadingContent?: ReactNode;
  /** Shown in CardHeader next to the title (e.g. metric selector) */
  headerExtra?: ReactNode;
  children: ReactNode;
}

export function ChartCard({
  title,
  hasProject = true,
  isLoading = false,
  isEmpty = false,
  loadingContent,
  headerExtra,
  children,
}: ChartCardProps) {
  if (!hasProject) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground">
            Select a project to view metrics
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          {loadingContent ?? (
            <div className="h-[300px] animate-pulse rounded-lg bg-muted" />
          )}
        </CardContent>
      </Card>
    );
  }

  if (isEmpty) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="py-8 text-center text-sm text-muted-foreground">
            No data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          {headerExtra}
        </div>
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
    </Card>
  );
}
