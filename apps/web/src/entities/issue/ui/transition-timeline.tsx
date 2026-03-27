import type { StatusTransition } from "@jira-board/shared";
import { Badge } from "@/shared/ui";
import { formatDateTimeOrNull } from "@/shared/lib/format";
import { getStatusBadgeVariant } from "../lib";

export function TransitionTimeline({
  transitions,
}: {
  transitions: StatusTransition[];
}) {
  if (transitions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No status transitions recorded.
      </p>
    );
  }

  return (
    <div className="relative pl-6">
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
      {transitions.map((t, i) => (
        <div
          key={i}
          className="relative flex items-start gap-4 pb-5 last:pb-0"
        >
          <div className="absolute left-[-15px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-primary bg-background z-10" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {t.fromStatus && (
                <>
                  <Badge
                    variant={getStatusBadgeVariant(t.fromStatus)}
                    className="text-[11px]"
                  >
                    {t.fromStatus}
                  </Badge>
                  <span className="text-muted-foreground text-xs">→</span>
                </>
              )}
              <Badge
                variant={getStatusBadgeVariant(t.toStatus)}
                className="text-[11px]"
              >
                {t.toStatus}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{formatDateTimeOrNull(t.changedAt)}</span>
              {t.author && <span>by {t.author}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
