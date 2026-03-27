import { useSprintStats } from "@/entities/sprint";
import { cn } from "@/shared/lib/cn";
import { Skeleton } from "@/shared/ui";

export function SprintStats({ sprintId }: { sprintId: string }) {
  const { data: stats, isLoading } = useSprintStats(sprintId);

  if (isLoading) return <SprintStatsSkeleton />;
  if (!stats) return null;

  const breakdownRows = [
    { label: "New", sp: stats.newSp, color: "text-sky-400", dot: "bg-sky-400" },
    { label: "Carry-over", sp: stats.carryOverSp, color: "text-rose-400", dot: "bg-rose-400" },
    { label: "Added mid-sprint", sp: stats.addedSp, color: "text-violet-400", dot: "bg-violet-400" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="rounded-xl border border-border bg-card p-4 sm:col-span-1">
        <div className="flex items-start justify-between mb-3">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            Committed
          </span>
          <span className="inline-flex items-center justify-center size-6 rounded-md text-xs font-bold bg-sky-500/10 text-sky-400">
            ◎
          </span>
        </div>
        <p className="text-2xl font-bold font-heading leading-tight text-sky-400">
          {stats.committedSp} SP
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 mb-3">
          {stats.totalTasks} tasks in scope
        </p>
        <div className="space-y-1.5 border-t border-border/50 pt-2.5">
          {breakdownRows.map((r) => (
            <div key={r.label} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className={cn("size-1.5 rounded-full", r.dot)} />
                {r.label}
              </span>
              <span className={cn("font-medium tabular-nums", r.color)}>
                {r.sp} SP
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start justify-between mb-3">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            Completed
          </span>
          <span className="inline-flex items-center justify-center size-6 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-400">
            ✓
          </span>
        </div>
        <p className="text-2xl font-bold font-heading leading-tight text-emerald-400">
          {stats.completedSp} SP
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {stats.doneTasks} tasks done
        </p>
        {stats.committedSp > 0 && (
          <div className="mt-3 border-t border-border/50 pt-2.5">
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${Math.min(100, Math.round((stats.completedSp / stats.committedSp) * 100))}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
              {Math.round((stats.completedSp / stats.committedSp) * 100)}% of committed
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start justify-between mb-3">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            Remaining
          </span>
          <span className="inline-flex items-center justify-center size-6 rounded-md text-xs font-bold bg-amber-500/10 text-amber-400">
            ↻
          </span>
        </div>
        <p className="text-2xl font-bold font-heading leading-tight text-amber-400">
          {stats.remainingSp} SP
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {stats.totalTasks - stats.doneTasks} tasks left
        </p>
      </div>
    </div>
  );
}

function SprintStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between mb-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="size-6 rounded-md" />
          </div>
          <Skeleton className="h-7 w-20 mb-1" />
          <Skeleton className="h-3 w-24" />
          {i === 0 && (
            <div className="space-y-2 border-t border-border/50 pt-2.5 mt-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
