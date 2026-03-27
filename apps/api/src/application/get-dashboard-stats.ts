import {
  VISIBLE_SPRINTS,
  type CycleTime,
  type DashboardSummary,
  type VelocityPoint,
} from "@jira-board/shared";
import { and, avg, count, eq, inArray, sql } from "drizzle-orm";
import { db } from "../infrastructure/db/client";
import { issues, sprints } from "../infrastructure/db/schema";
import { memberRepo } from "../infrastructure/repositories/member.repo";

export async function getDashboardSummary(params?: {
  project?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<DashboardSummary> {
  const conditions = [];
  if (params?.project) {
    conditions.push(eq(issues.projectKey, params.project));

    const activeMembers = await memberRepo.getActiveMembers(params.project);
    if (activeMembers.size > 0) {
      conditions.push(inArray(issues.assignee, [...activeMembers]));
    }
  }
  if (params?.dateFrom) {
    conditions.push(sql`${issues.createdAt} >= ${new Date(params.dateFrom)}`);
  }
  if (params?.dateTo) {
    conditions.push(sql`${issues.createdAt} <= ${new Date(params.dateTo)}`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, byStatus, byPriority, cycleTimeResult] =
    await Promise.all([
      db.select({ count: count() }).from(issues).where(where),
      db
        .select({ status: issues.status, count: count() })
        .from(issues)
        .where(where)
        .groupBy(issues.status),
      db
        .select({ priority: issues.priority, count: count() })
        .from(issues)
        .where(where)
        .groupBy(issues.priority),
      db
        .select({
          avgDays: avg(sql`${issues.cycleTimeMin} / 1440.0`),
        })
        .from(issues)
        .where(
          where
            ? and(where, sql`${issues.cycleTimeMin} > 0`)
            : sql`${issues.cycleTimeMin} > 0`,
        ),
    ]);

  const totalIssues = totalResult[0]?.count ?? 0;
  const doneStatuses = ["Done", "Closed", "Resolved"];
  const openStatuses = ["To Do", "Open", "New", "Backlog"];

  const doneIssues = byStatus
    .filter((s) => doneStatuses.includes(s.status))
    .reduce((sum, s) => sum + s.count, 0);

  const openIssues = byStatus
    .filter((s) => openStatuses.includes(s.status))
    .reduce((sum, s) => sum + s.count, 0);

  const avgCycleTimeDays = cycleTimeResult[0]?.avgDays
    ? Math.round(Number(cycleTimeResult[0].avgDays) * 10) / 10
    : null;

  return {
    totalIssues,
    openIssues,
    doneIssues,
    avgCycleTimeDays,
    byStatus,
    byPriority: byPriority.map((r) => ({
      priority: r.priority ?? "None",
      count: r.count,
    })),
  };
}

export async function getVelocity(params?: {
  project?: string;
  assignee?: string;
  issueType?: string;
  priority?: string;
  labels?: string;
}): Promise<VelocityPoint[]> {
  const sprintConditions = [eq(sprints.state, "closed")];
  if (params?.project) {
    sprintConditions.push(eq(sprints.projectKey, params.project));
  }

  const closedSprints = await db
    .select()
    .from(sprints)
    .where(and(...sprintConditions));

  if (closedSprints.length === 0) return [];

  const closedSprintIds = closedSprints.map((s) => s.id);
  const sprintMap = new Map(closedSprints.map((s) => [s.id, s]));

  const conditions = [
    sql`${issues.sprintIds} && ARRAY[${sql.join(closedSprintIds.map((id) => sql`${id}`), sql`, `)}]::text[]`,
  ];
  if (params?.project) {
    conditions.push(eq(issues.projectKey, params.project));
  }
  if (params?.assignee) {
    conditions.push(
      inArray(issues.assignee, params.assignee.split(",").map((s) => s.trim())),
    );
  }
  if (params?.issueType) {
    conditions.push(
      inArray(issues.type, params.issueType.split(",").map((s) => s.trim())),
    );
  }
  if (params?.priority) {
    conditions.push(
      inArray(issues.priority, params.priority.split(",").map((s) => s.trim())),
    );
  }
  if (params?.labels) {
    conditions.push(
      sql`${issues.labels} && ARRAY[${params.labels}]::text[]`,
    );
  }

  const sprintIssues = await db
    .select({
      sprintIds: issues.sprintIds,
      storyPoints: issues.storyPoints,
      flowPhase: issues.flowPhase,
      actualEnd: issues.actualEnd,
      createdAt: issues.createdAt,
    })
    .from(issues)
    .where(and(...conditions));

  type Bucket = {
    newSp: number;
    carryOverSp: number;
    addedSp: number;
    completed: number;
  };
  const grouped = new Map<string, Bucket>();

  for (const issue of sprintIssues) {
    if (!issue.sprintIds || issue.sprintIds.length === 0) continue;
    const points = issue.storyPoints ?? 0;

    const relevantSids = issue.sprintIds.filter((sid) => sprintMap.has(sid));
    const isCarryOver = issue.sprintIds.length > 1;

    for (const sid of relevantSids) {
      const sprint = sprintMap.get(sid)!;
      const startMs = sprint.startDate?.getTime() ?? 0;
      const endMs = sprint.endDate?.getTime() ?? Date.now();

      const wasDoneBeforeSprint =
        issue.actualEnd &&
        startMs > 0 &&
        issue.actualEnd.getTime() < startMs;

      if (wasDoneBeforeSprint) continue;

      const entry = grouped.get(sid) ?? {
        newSp: 0,
        carryOverSp: 0,
        addedSp: 0,
        completed: 0,
      };

      if (isCarryOver) {
        entry.carryOverSp += points;
      } else if (startMs && issue.createdAt.getTime() > startMs) {
        entry.addedSp += points;
      } else {
        entry.newSp += points;
      }

      if (
        issue.flowPhase === "Done" &&
        issue.actualEnd &&
        issue.actualEnd.getTime() >= startMs &&
        issue.actualEnd.getTime() <= endMs
      ) {
        entry.completed += points;
      }
      grouped.set(sid, entry);
    }
  }

  return closedSprints
    .sort(
      (a, b) =>
        (a.endDate?.getTime() ?? a.startDate?.getTime() ?? 0) -
        (b.endDate?.getTime() ?? b.startDate?.getTime() ?? 0),
    )
    .slice(-VISIBLE_SPRINTS)
    .map((s) => {
      const b = grouped.get(s.id);
      const newSp = b?.newSp ?? 0;
      const carryOverSp = b?.carryOverSp ?? 0;
      const addedSp = b?.addedSp ?? 0;
      return {
        sprintName: s.name,
        committed: newSp + carryOverSp + addedSp,
        completed: b?.completed ?? 0,
        newSp,
        carryOverSp,
        addedSp,
      };
    });
}

export async function getCycleTime(params?: {
  project?: string;
}): Promise<CycleTime> {
  const conditions = [sql`${issues.cycleTimeMin} > 0`];
  if (params?.project) {
    conditions.push(eq(issues.projectKey, params.project));

    const activeMembers = await memberRepo.getActiveMembers(params.project);
    if (activeMembers.size > 0) {
      conditions.push(inArray(issues.assignee, [...activeMembers]));
    }
  }

  const rows = await db
    .select({
      type: issues.type,
      cycleTimeMin: issues.cycleTimeMin,
    })
    .from(issues)
    .where(and(...conditions));

  if (rows.length === 0) {
    return { avgDays: 0, median: 0, byType: [] };
  }

  const cycleTimes = rows.map((r) => ({
    type: r.type,
    days: Math.round(((r.cycleTimeMin ?? 0) / 1440) * 10) / 10,
  }));

  const allDays = cycleTimes.map((c) => c.days).sort((a, b) => a - b);
  const avgDays =
    Math.round((allDays.reduce((s, d) => s + d, 0) / allDays.length) * 10) / 10;
  const median =
    allDays.length % 2 === 0
      ? Math.round(
          ((allDays[allDays.length / 2 - 1]! + allDays[allDays.length / 2]!) /
            2) *
            10,
        ) / 10
      : allDays[Math.floor(allDays.length / 2)]!;

  const byTypeMap = new Map<string, number[]>();
  for (const ct of cycleTimes) {
    const arr = byTypeMap.get(ct.type) ?? [];
    arr.push(ct.days);
    byTypeMap.set(ct.type, arr);
  }

  const byType = Array.from(byTypeMap.entries()).map(([type, days]) => ({
    type,
    avgDays:
      Math.round((days.reduce((s, d) => s + d, 0) / days.length) * 10) / 10,
  }));

  return { avgDays, median, byType };
}
