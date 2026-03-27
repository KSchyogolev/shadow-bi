import { db } from "../infrastructure/db/client";
import { issues, issueStatusHistory, sprints } from "../infrastructure/db/schema";
import { eq, and, gte, lte, inArray, isNotNull, sql } from "drizzle-orm";
import { median, percentile, roundTo } from "../domain/metrics/stats";
import { statusRepo } from "../infrastructure/repositories/status.repo";
import { memberRepo } from "../infrastructure/repositories/member.repo";

const naturalCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

import {
  VISIBLE_SPRINTS,
  type MetricsFilters,
  type CycleTimePoint,
  type CycleTimeBySprintPoint,
  type LeadTimePoint,
  type TimeInStatusPoint,
  type ThroughputPoint,
  type ReworkPoint,
  type FlowEfficiencyPoint,
  type HoursPerSpPoint,
} from "@jira-board/shared";

export function buildMetricsWhere(filters: MetricsFilters) {
  const conditions = [eq(issues.projectKey, filters.projectKey)];

  if (filters.sprintId) {
    const sprintFilter = filters.sprintId.split(",").map((s) => s.trim());
    conditions.push(
      sql`${issues.sprintIds} && ARRAY[${sql.join(sprintFilter.map((id) => sql`${id}`), sql`, `)}]::text[]`,
    );
  }
  if (filters.assignee) {
    conditions.push(
      inArray(issues.assignee, filters.assignee.split(",").map((s) => s.trim())),
    );
  }
  if (filters.dateFrom) {
    conditions.push(gte(issues.createdAt, new Date(filters.dateFrom)));
  }
  if (filters.dateTo) {
    conditions.push(lte(issues.createdAt, new Date(filters.dateTo)));
  }
  if (filters.issueType) {
    conditions.push(
      inArray(issues.type, filters.issueType.split(",").map((s) => s.trim())),
    );
  }
  if (filters.priority) {
    conditions.push(
      inArray(
        issues.priority,
        filters.priority.split(",").map((s) => s.trim()),
      ),
    );
  }
  if (filters.labels) {
    conditions.push(
      sql`${issues.labels} && ARRAY[${filters.labels}]::text[]`,
    );
  }

  return and(...conditions);
}

export async function buildTeamFilteredWhere(filters: MetricsFilters) {
  const base = buildMetricsWhere(filters);
  const activeMembers = await memberRepo.getActiveMembers(filters.projectKey);

  if (activeMembers.size === 0) return base;

  return and(base, inArray(issues.assignee, [...activeMembers]));
}


export async function getCycleTimeDistribution(
  filters: MetricsFilters,
): Promise<CycleTimePoint[]> {
  const where = await buildTeamFilteredWhere(filters);

  const rows = await db
    .select({
      key: issues.key,
      cycleTimeMin: issues.cycleTimeMin,
    })
    .from(issues)
    .where(and(where, sql`${issues.cycleTimeMin} > 0`));

  return rows
    .map((r) => ({
      issueKey: r.key,
      cycleTimeHours: roundTo((r.cycleTimeMin ?? 0) / 60),
    }))
    .sort((a, b) => b.cycleTimeHours - a.cycleTimeHours);
}

export async function getCycleTimeBySprint(
  filters: MetricsFilters,
): Promise<CycleTimeBySprintPoint[]> {
  const where = await buildTeamFilteredWhere(filters);

  const rows = await db
    .select({
      sprintIds: issues.sprintIds,
      cycleTimeMin: issues.cycleTimeMin,
    })
    .from(issues)
    .where(
      and(
        where,
        sql`${issues.cycleTimeMin} > 0`,
        sql`cardinality(${issues.sprintIds}) > 0`,
      ),
    );

  if (rows.length === 0) return [];

  const allSprintIds = [...new Set(rows.flatMap((r) => r.sprintIds ?? []))];
  const sprintNameMap = new Map<string, string>();

  if (allSprintIds.length > 0) {
    const sprintRows = await db
      .select({ id: sprints.id, name: sprints.name })
      .from(sprints)
      .where(inArray(sprints.id, allSprintIds));
    for (const s of sprintRows) {
      sprintNameMap.set(s.id, s.name);
    }
  }

  const bySprint = new Map<string, number[]>();
  for (const row of rows) {
    const hours = (row.cycleTimeMin ?? 0) / 60;
    for (const sid of row.sprintIds ?? []) {
      const name = sprintNameMap.get(sid) ?? sid;
      const arr = bySprint.get(name) ?? [];
      arr.push(hours);
      bySprint.set(name, arr);
    }
  }

  return Array.from(bySprint.entries())
    .map(([sprint, hours]) => ({
      sprint,
      medianHours: roundTo(median(hours)),
      p85Hours: roundTo(percentile(hours, 85)),
      avgHours: roundTo(hours.reduce((s, h) => s + h, 0) / hours.length),
      count: hours.length,
    }))
    .sort((a, b) => naturalCollator.compare(a.sprint, b.sprint))
    .slice(-VISIBLE_SPRINTS);
}

export async function getLeadTimeDistribution(
  filters: MetricsFilters,
): Promise<LeadTimePoint[]> {
  const where = await buildTeamFilteredWhere(filters);

  const rows = await db
    .select({
      key: issues.key,
      createdAt: issues.createdAt,
      resolvedAt: issues.resolvedAt,
    })
    .from(issues)
    .where(and(where, isNotNull(issues.resolvedAt)));

  return rows
    .map((r) => ({
      issueKey: r.key,
      leadTimeHours: roundTo(
        (r.resolvedAt!.getTime() - r.createdAt.getTime()) / 3600000,
      ),
    }))
    .sort((a, b) => b.leadTimeHours - a.leadTimeHours);
}

export async function getTimeInStatus(
  filters: MetricsFilters,
): Promise<TimeInStatusPoint[]> {
  const where = await buildTeamFilteredWhere(filters);

  const issueKeys = await db
    .select({ key: issues.key })
    .from(issues)
    .where(where);
  const keys = issueKeys.map((r) => r.key);
  if (keys.length === 0) return [];

  const trackedOrder = await statusRepo.getInCycleStatusOrder(filters.projectKey);

  const history = await db
    .select()
    .from(issueStatusHistory)
    .where(inArray(issueStatusHistory.issueKey, keys))
    .orderBy(issueStatusHistory.issueKey, issueStatusHistory.changedAt);

  const durations = new Map<string, number[]>();

  let prev: (typeof history)[0] | null = null;
  for (const row of history) {
    if (prev && prev.issueKey === row.issueKey) {
      const status = prev.toStatus;
      if (trackedOrder.has(status)) {
        const mins = Math.round(
          (row.changedAt.getTime() - prev.changedAt.getTime()) / 60000,
        );
        const arr = durations.get(status) ?? [];
        arr.push(mins);
        durations.set(status, arr);
      }
    }
    prev = row;
  }

  return Array.from(durations.entries())
    .map(([status, mins]) => ({
      status,
      avgMinutes: roundTo(mins.reduce((s, m) => s + m, 0) / mins.length),
      medianMinutes: roundTo(median(mins)),
      p90Minutes: roundTo(percentile(mins, 90)),
    }))
    .sort((a, b) => (trackedOrder.get(a.status) ?? 0) - (trackedOrder.get(b.status) ?? 0));
}

export async function getThroughput(
  filters: MetricsFilters,
): Promise<ThroughputPoint[]> {
  const where = await buildTeamFilteredWhere(filters);

  const resolved = await db
    .select({
      sprintIds: issues.sprintIds,
      storyPoints: issues.storyPoints,
    })
    .from(issues)
    .where(
      and(where, eq(issues.flowPhase, "Done"), sql`cardinality(${issues.sprintIds}) > 0`),
    );

  if (resolved.length === 0) return [];

  const allSprintIds = [
    ...new Set(resolved.flatMap((r) => r.sprintIds ?? [])),
  ];
  const sprintNameMap = new Map<string, string>();

  if (allSprintIds.length > 0) {
    const sprintRows = await db
      .select({ id: sprints.id, name: sprints.name })
      .from(sprints)
      .where(inArray(sprints.id, allSprintIds));
    for (const s of sprintRows) {
      sprintNameMap.set(s.id, s.name);
    }
  }

  const byPeriod = new Map<string, { issues: number; sp: number }>();
  for (const row of resolved) {
    for (const sid of row.sprintIds ?? []) {
      const period = sprintNameMap.get(sid) ?? sid;
      const entry = byPeriod.get(period) ?? { issues: 0, sp: 0 };
      entry.issues++;
      entry.sp += row.storyPoints ?? 0;
      byPeriod.set(period, entry);
    }
  }

  return Array.from(byPeriod.entries())
    .map(([period, data]) => ({
      period,
      issuesCompleted: data.issues,
      spCompleted: data.sp,
    }))
    .sort((a, b) => naturalCollator.compare(a.period, b.period))
    .slice(-VISIBLE_SPRINTS);
}

export async function getReworkMetrics(
  filters: MetricsFilters,
): Promise<ReworkPoint[]> {
  const where = await buildTeamFilteredWhere(filters);

  const rows = await db
    .select({
      key: issues.key,
      reworkCount: issues.reworkCount,
      reworkWaitMin: issues.reworkWaitMin,
    })
    .from(issues)
    .where(and(where, sql`${issues.reworkCount} > 0`));

  return rows
    .map((r) => ({
      issueKey: r.key,
      reworkCount: r.reworkCount ?? 0,
      reworkWaitMin: r.reworkWaitMin ?? 0,
    }))
    .sort((a, b) => b.reworkCount - a.reworkCount);
}

export async function getFlowEfficiency(
  filters: MetricsFilters,
): Promise<FlowEfficiencyPoint[]> {
  const where = await buildTeamFilteredWhere(filters);

  const rows = await db
    .select({
      key: issues.key,
      activeTimeMin: issues.activeTimeMin,
      queueTimeMin: issues.queueTimeMin,
    })
    .from(issues)
    .where(
      and(
        where,
        sql`(${issues.activeTimeMin} > 0 OR ${issues.queueTimeMin} > 0)`,
      ),
    );

  return rows
    .map((r) => {
      const activeMin = r.activeTimeMin ?? 0;
      const queueMin = r.queueTimeMin ?? 0;
      return {
        issueKey: r.key,
        activeMin,
        queueMin,
        ratio: roundTo(activeMin / (activeMin + queueMin), 2),
      };
    })
    .sort((a, b) => a.ratio - b.ratio);
}

export async function getHoursPerSP(
  filters: MetricsFilters,
): Promise<HoursPerSpPoint[]> {
  const where = await buildTeamFilteredWhere(filters);

  const rows = await db
    .select({
      sprintIds: issues.sprintIds,
      assignee: issues.assignee,
      activeTimeMin: issues.activeTimeMin,
      storyPoints: issues.storyPoints,
    })
    .from(issues)
    .where(
      and(
        where,
        isNotNull(issues.storyPoints),
        sql`${issues.storyPoints} > 0`,
        sql`${issues.activeTimeMin} > 0`,
      ),
    );

  if (rows.length === 0) return [];

  const allSprintIds = [
    ...new Set(rows.flatMap((r) => r.sprintIds ?? []).filter(Boolean)),
  ];
  const sprintNameMap = new Map<string, string>();

  if (allSprintIds.length > 0) {
    const sprintRows = await db
      .select({ id: sprints.id, name: sprints.name })
      .from(sprints)
      .where(inArray(sprints.id, allSprintIds));
    for (const s of sprintRows) {
      sprintNameMap.set(s.id, s.name);
    }
  }

  const groups = new Map<
    string,
    { totalMin: number; totalSP: number; sprint: string | null; assignee: string | null }
  >();

  for (const row of rows) {
    const assignee = row.assignee ?? null;
    const sids = row.sprintIds?.length ? row.sprintIds : [null];

    for (const sid of sids) {
      const sprint = sid ? (sprintNameMap.get(sid) ?? sid) : null;
      const groupKey = `${sprint ?? "__none__"}::${assignee ?? "__none__"}`;

      const entry = groups.get(groupKey) ?? {
        totalMin: 0,
        totalSP: 0,
        sprint,
        assignee,
      };
      entry.totalMin += row.activeTimeMin ?? 0;
      entry.totalSP += row.storyPoints ?? 0;
      groups.set(groupKey, entry);
    }
  }

  return Array.from(groups.values())
    .filter((g) => g.totalSP > 0)
    .map((g) => ({
      sprint: g.sprint,
      assignee: g.assignee,
      avgHoursPerSP: roundTo(g.totalMin / 60 / g.totalSP),
    }))
    .sort((a, b) =>
      naturalCollator.compare(a.sprint ?? "", b.sprint ?? ""),
    );
}
