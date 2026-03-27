import { db } from "../infrastructure/db/client";
import { issues, sprints } from "../infrastructure/db/schema";
import { isNotNull, and, eq, desc, sql, inArray } from "drizzle-orm";
import { buildTeamFilteredWhere } from "./get-flow-metrics";
import { roundTo } from "../domain/metrics/stats";
import { VISIBLE_SPRINTS, type MetricsFilters, type AssigneePerformance, type AssigneeTrendPoint, type AssigneeSprintMetric } from "@jira-board/shared";

interface SprintRange {
  id: string;
  name: string;
  start: Date;
  end: Date;
}

async function loadSprintRanges(
  ids: string[],
): Promise<Map<string, SprintRange>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({
      id: sprints.id,
      name: sprints.name,
      startDate: sprints.startDate,
      endDate: sprints.endDate,
    })
    .from(sprints)
    .where(inArray(sprints.id, ids));

  const map = new Map<string, SprintRange>();
  for (const r of rows) {
    if (r.startDate && r.endDate) {
      map.set(r.id, { id: r.id, name: r.name, start: r.startDate, end: r.endDate });
    }
  }
  return map;
}

function findCompletionSprintId(
  resolvedAt: Date,
  sprintIds: string[],
  ranges: Map<string, SprintRange>,
): string | null {
  for (const sid of sprintIds) {
    const r = ranges.get(sid);
    if (r && resolvedAt >= r.start && resolvedAt <= r.end) return sid;
  }
  for (let i = sprintIds.length - 1; i >= 0; i--) {
    const sid = sprintIds[i];
    if (sid && ranges.has(sid)) return sid;
  }
  return sprintIds[sprintIds.length - 1] ?? null;
}

export async function getAssigneePerformance(filters: MetricsFilters): Promise<AssigneePerformance[]> {
  const baseWhere = await buildTeamFilteredWhere(filters);
  const resolvedWhere = and(baseWhere, isNotNull(issues.assignee), isNotNull(issues.resolvedAt));
  const allAssignedWhere = and(baseWhere, isNotNull(issues.assignee));

  const [rows, allRows] = await Promise.all([
    db
      .select({
        assignee: issues.assignee,
        storyPoints: issues.storyPoints,
        sprintIds: issues.sprintIds,
        createdAt: issues.createdAt,
        resolvedAt: issues.resolvedAt,
        cycleTimeMin: issues.cycleTimeMin,
        activeTimeMin: issues.activeTimeMin,
        queueTimeMin: issues.queueTimeMin,
        reworkCount: issues.reworkCount,
      })
      .from(issues)
      .where(resolvedWhere),
    db
      .select({
        assignee: issues.assignee,
        storyPoints: issues.storyPoints,
      })
      .from(issues)
      .where(allAssignedWhere),
  ]);

  const allSprintIds = [...new Set(rows.flatMap((r) => r.sprintIds ?? []))];
  const sprintRanges = await loadSprintRanges(allSprintIds);

  const filterSprintIds = filters.sprintId
    ? new Set(filters.sprintId.split(",").map((s) => s.trim()))
    : null;

  const filteredRows = filterSprintIds
    ? rows.filter((row) => {
        if (!row.resolvedAt || !row.sprintIds) return false;
        const cid = findCompletionSprintId(row.resolvedAt, row.sprintIds, sprintRanges);
        return cid !== null && filterSprintIds.has(cid);
      })
    : rows;

  const committedByAssignee = new Map<string, number>();
  for (const row of allRows) {
    if (!row.assignee) continue;
    committedByAssignee.set(
      row.assignee,
      (committedByAssignee.get(row.assignee) ?? 0) + (row.storyPoints ?? 0),
    );
  }

  const grouped = new Map<string, (typeof filteredRows)[number][]>();
  for (const row of filteredRows) {
    if (!row.assignee) continue;
    const arr = grouped.get(row.assignee) ?? [];
    arr.push(row);
    grouped.set(row.assignee, arr);
  }

  const result: AssigneePerformance[] = [];

  for (const [assignee, list] of grouped) {
    const issuesCompleted = list.length;
    const spCompleted = list.reduce((sum, r) => sum + (r.storyPoints ?? 0), 0);

    const spBySprint = new Map<string, number>();
    for (const r of list) {
      if (r.sprintIds && r.resolvedAt) {
        const sid = findCompletionSprintId(r.resolvedAt, r.sprintIds, sprintRanges);
        if (sid) {
          spBySprint.set(sid, (spBySprint.get(sid) ?? 0) + (r.storyPoints ?? 0));
        }
      }
    }
    let sprintCount = 0;
    for (const sp of spBySprint.values()) {
      if (sp > 0) sprintCount++;
    }
    const avgSpPerSprint = sprintCount > 0
      ? roundTo(spCompleted / sprintCount, 1)
      : 0;

    const cycleTimesHours: number[] = [];
    for (const r of list) {
      const ct = r.cycleTimeMin ?? 0;
      if (ct > 0) {
        cycleTimesHours.push(ct / 60);
      }
    }
    const avgCycleTimeHours = cycleTimesHours.length > 0
      ? roundTo(cycleTimesHours.reduce((s, v) => s + v, 0) / cycleTimesHours.length, 1)
      : 0;

    const leadTimesHours = list
      .filter((r) => r.resolvedAt)
      .map((r) => (r.resolvedAt!.getTime() - r.createdAt.getTime()) / 3_600_000);
    const avgLeadTimeHours = leadTimesHours.length > 0
      ? roundTo(leadTimesHours.reduce((s, v) => s + v, 0) / leadTimesHours.length, 1)
      : 0;

    const reworkIssues = list.filter((r) => (r.reworkCount ?? 0) > 0).length;
    const reworkRate = roundTo(reworkIssues / issuesCompleted, 2);

    const activeRatios: number[] = [];
    for (const r of list) {
      const active = r.activeTimeMin ?? 0;
      const queue = r.queueTimeMin ?? 0;
      const total = active + queue;
      if (total > 0) {
        activeRatios.push(active / total);
      }
    }
    const activeRatio = activeRatios.length > 0
      ? roundTo(activeRatios.reduce((s, v) => s + v, 0) / activeRatios.length, 2)
      : 0;

    const spIssues = list.filter((r) => (r.storyPoints ?? 0) > 0);
    let avgHoursPerSP = 0;
    if (spIssues.length > 0) {
      const totalActiveMin = spIssues.reduce((s, r) => s + (r.activeTimeMin ?? 0), 0);
      const totalSP = spIssues.reduce((s, r) => s + (r.storyPoints ?? 0), 0);
      if (totalSP > 0) {
        avgHoursPerSP = roundTo(totalActiveMin / 60 / totalSP, 1);
      }
    }

    const spCommitted = committedByAssignee.get(assignee) ?? 0;

    result.push({
      assignee,
      issuesCompleted,
      spCompleted,
      spCommitted,
      avgSpPerSprint,
      sprintCount,
      avgCycleTimeHours,
      avgLeadTimeHours,
      reworkRate,
      activeRatio,
      avgHoursPerSP,
    });
  }

  return result.sort((a, b) => b.spCompleted - a.spCompleted);
}

export async function getAssigneeTrend(filters: MetricsFilters): Promise<AssigneeTrendPoint[]> {
  const baseWhere = await buildTeamFilteredWhere(filters);
  const where = and(baseWhere, isNotNull(issues.resolvedAt), isNotNull(issues.assignee));

  const [rows, sprintRows] = await Promise.all([
    db
      .select({
        assignee: issues.assignee,
        sprintIds: issues.sprintIds,
        resolvedAt: issues.resolvedAt,
        cycleTimeMin: issues.cycleTimeMin,
      })
      .from(issues)
      .where(where),
    db.select({ id: sprints.id, name: sprints.name }).from(sprints),
  ]);

  const sprintNameMap = new Map(sprintRows.map((s) => [s.id, s.name]));
  const allSprintIds = [...new Set(rows.flatMap((r) => r.sprintIds ?? []))];
  const sprintRanges = await loadSprintRanges(allSprintIds);

  const grouped = new Map<string, (typeof rows)[number][]>();
  for (const row of rows) {
    if (!row.assignee || !row.resolvedAt) continue;
    if (!row.sprintIds || row.sprintIds.length === 0) continue;
    const sid = findCompletionSprintId(row.resolvedAt, row.sprintIds, sprintRanges);
    if (!sid || !sprintNameMap.has(sid)) continue;
    const period = sprintNameMap.get(sid)!;
    const key = `${row.assignee}::${period}`;
    const arr = grouped.get(key) ?? [];
    arr.push(row);
    grouped.set(key, arr);
  }

  const result: AssigneeTrendPoint[] = [];

  for (const [key, list] of grouped) {
    const [assignee, period] = key.split("::");

    const cycleTimesHours: number[] = [];
    for (const r of list) {
      const ct = r.cycleTimeMin ?? 0;
      if (ct > 0) {
        cycleTimesHours.push(ct / 60);
      }
    }
    const avgCycleTime = cycleTimesHours.length > 0
      ? roundTo(cycleTimesHours.reduce((s, v) => s + v, 0) / cycleTimesHours.length, 1)
      : 0;

    result.push({ assignee: assignee!, period: period!, throughput: list.length, avgCycleTime });
  }

  return result.sort((a, b) =>
    a.assignee.localeCompare(b.assignee) ||
    a.period.localeCompare(b.period, undefined, { numeric: true }),
  );
}

export async function getAssigneeSprintMetrics(
  filters: MetricsFilters,
): Promise<AssigneeSprintMetric[]> {
  const lastSprints = await db
    .select({
      id: sprints.id,
      name: sprints.name,
      startDate: sprints.startDate,
      endDate: sprints.endDate,
    })
    .from(sprints)
    .where(
      and(
        eq(sprints.projectKey, filters.projectKey),
        eq(sprints.state, "closed"),
      ),
    )
    .orderBy(desc(sprints.startDate))
    .limit(VISIBLE_SPRINTS);

  if (lastSprints.length === 0) return [];

  const sprintIds = lastSprints.map((s) => s.id);
  const sprintNameMap = new Map(lastSprints.map((s) => [s.id, s.name]));
  const sprintRanges = new Map<string, SprintRange>();
  for (const s of lastSprints) {
    if (s.startDate && s.endDate) {
      sprintRanges.set(s.id, { id: s.id, name: s.name, start: s.startDate, end: s.endDate });
    }
  }

  const baseWhere = await buildTeamFilteredWhere({
    ...filters,
    sprintId: undefined,
    dateFrom: undefined,
    dateTo: undefined,
  });

  const rows = await db
    .select({
      assignee: issues.assignee,
      sprintIds: issues.sprintIds,
      storyPoints: issues.storyPoints,
      cycleTimeMin: issues.cycleTimeMin,
      reworkCount: issues.reworkCount,
      resolvedAt: issues.resolvedAt,
    })
    .from(issues)
    .where(
      and(
        baseWhere,
        isNotNull(issues.assignee),
        isNotNull(issues.resolvedAt),
        sql`${issues.sprintIds} && ${sql`ARRAY[${sql.join(
          sprintIds.map((id) => sql`${id}`),
          sql`,`,
        )}]`}`,
      ),
    );

  const allIssueSprintIds = [...new Set(rows.flatMap((r) => r.sprintIds ?? []))];
  const fullRanges = await loadSprintRanges(allIssueSprintIds);
  for (const [id, range] of sprintRanges) fullRanges.set(id, range);

  type GroupKey = string;
  const grouped = new Map<GroupKey, (typeof rows)[number][]>();

  for (const row of rows) {
    if (!row.assignee || !row.sprintIds || !row.resolvedAt) continue;
    const sid = findCompletionSprintId(row.resolvedAt, row.sprintIds, fullRanges);
    if (!sid || !sprintNameMap.has(sid)) continue;
    const key = `${row.assignee}::${sid}`;
    const arr = grouped.get(key) ?? [];
    arr.push(row);
    grouped.set(key, arr);
  }

  const result: AssigneeSprintMetric[] = [];

  for (const [key, list] of grouped) {
    const [assignee, sprintId] = key.split("::");
    const sprintName = sprintNameMap.get(sprintId!) ?? sprintId!;

    const velocity = list.reduce((s, r) => s + (r.storyPoints ?? 0), 0);

    const cycleTimes: number[] = [];
    for (const r of list) {
      const ct = r.cycleTimeMin ?? 0;
      if (ct > 0) cycleTimes.push(ct / 60);
    }
    const avgCycleTimeHours =
      cycleTimes.length > 0
        ? roundTo(
            cycleTimes.reduce((s, v) => s + v, 0) / cycleTimes.length,
            1,
          )
        : 0;

    const reworkIssues = list.filter((r) => (r.reworkCount ?? 0) > 0).length;
    const reworkRate = list.length > 0 ? roundTo(reworkIssues / list.length, 2) : 0;

    result.push({
      assignee: assignee!,
      sprint: sprintName,
      velocity,
      avgCycleTimeHours,
      reworkRate,
    });
  }

  const sprintOrder = lastSprints.map((s) => s.name).reverse();
  return result.sort(
    (a, b) =>
      a.assignee.localeCompare(b.assignee) ||
      sprintOrder.indexOf(a.sprint) - sprintOrder.indexOf(b.sprint),
  );
}
