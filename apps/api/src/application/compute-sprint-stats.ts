import type { BurndownPoint, SprintStats } from "@jira-board/shared";

export interface SprintIssue {
  storyPoints: number | null;
  flowPhase: string | null;
  actualEnd: Date | null;
  sprintIds: string[];
  createdAt: Date;
}

export interface SprintWindow {
  startMs: number;
  endMs: number;
  state: "active" | "closed" | "future";
}

export function computeSprintStats(
  allIssues: SprintIssue[],
  startMs: number,
  endMs: number,
): SprintStats {
  const scopeIssues = allIssues.filter(
    (i) => !i.actualEnd || i.actualEnd.getTime() >= startMs,
  );

  const committedSp = sumSp(scopeIssues);

  const completedIssues = scopeIssues.filter(
    (i) =>
      i.flowPhase === "Done" &&
      i.actualEnd &&
      i.actualEnd.getTime() >= startMs &&
      i.actualEnd.getTime() <= endMs,
  );
  const completedSp = sumSp(completedIssues);

  const remainingIssues = scopeIssues.filter(
    (i) => i.flowPhase !== "Done",
  );
  const remainingSp = sumSp(remainingIssues);

  const carryOverIssues = scopeIssues.filter(
    (i) => i.sprintIds.length > 1,
  );
  const carryOverSp = sumSp(carryOverIssues);

  const addedIssues = startMs
    ? scopeIssues.filter(
        (i) =>
          i.sprintIds.length === 1 &&
          i.createdAt.getTime() > startMs &&
          i.createdAt.getTime() <= endMs,
      )
    : [];
  const addedSp = sumSp(addedIssues);

  const newSp = committedSp - carryOverSp - addedSp;

  return {
    committedSp,
    newSp,
    carryOverSp,
    addedSp,
    completedSp,
    remainingSp,
    totalTasks: scopeIssues.length,
    doneTasks: completedIssues.length,
  };
}

export function computeBurndown(
  allIssues: SprintIssue[],
  sprint: SprintWindow & { startDate: Date; endDate: Date },
): BurndownPoint[] {
  const start = sprint.startDate.getTime();
  const end = sprint.endDate.getTime();
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  if (totalDays <= 0) return [];

  const now = Date.now();
  const lastDay =
    sprint.state === "active"
      ? Math.min(
          Math.ceil((now - start) / (1000 * 60 * 60 * 24)),
          totalDays,
        )
      : totalDays;

  const scopeIssues = allIssues.filter(
    (i) => !i.actualEnd || i.actualEnd.getTime() >= start,
  );
  const scopePoints = sumSp(scopeIssues);

  const isWeekend = (date: Date) => {
    const day = date.getUTCDay();
    return day === 0 || day === 6;
  };

  let totalWorkingDays = 0;
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(start + d * 24 * 60 * 60 * 1000);
    if (!isWeekend(date)) totalWorkingDays++;
  }
  if (totalWorkingDays === 0) totalWorkingDays = totalDays;

  const pointPerWorkingDay = scopePoints / totalWorkingDays;
  const burndown: BurndownPoint[] = [];
  let workingDaysPassed = 0;

  for (let d = 0; d <= lastDay; d++) {
    const currentDate = new Date(start + d * 24 * 60 * 60 * 1000);
    const dateStr = currentDate.toISOString().split("T")[0]!;

    if (d > 0 && !isWeekend(currentDate)) {
      workingDaysPassed++;
    }

    const remaining = sumSp(
      scopeIssues.filter((i) => {
        if (!i.actualEnd) return true;
        if (i.actualEnd.getTime() > currentDate.getTime()) return true;
        return i.flowPhase !== "Done";
      }),
    );

    burndown.push({
      date: dateStr,
      remaining,
      ideal: Math.max(
        0,
        Math.round(
          (scopePoints - pointPerWorkingDay * workingDaysPassed) * 10,
        ) / 10,
      ),
    });
  }

  return burndown;
}

function sumSp(issues: SprintIssue[]): number {
  return issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
}
