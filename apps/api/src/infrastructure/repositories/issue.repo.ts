import { eq, and, gte, lte, inArray, asc, desc, sql, count } from "drizzle-orm";
import { db } from "../db/client";
import { issues } from "../db/schema";
import type { Issue } from "../../domain/issue/issue.entity";
import type {
  IssueFilters,
  PaginatedResult,
} from "../../domain/issue/issue.types";
import type { FlowPhase, FlowFields } from "../../domain/flow/flow.types";

type IssueRow = typeof issues.$inferSelect;

function toDomain(row: IssueRow): Issue {
  return {
    id: row.id,
    key: row.key,
    summary: row.summary,
    status: row.status,
    priority: row.priority ?? "None",
    type: row.type,
    assignee: row.assignee,
    reporter: row.reporter ?? "Unknown",
    projectKey: row.projectKey,
    sprintIds: row.sprintIds ?? [],
    storyPoints: row.storyPoints,
    labels: row.labels ?? [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    resolvedAt: row.resolvedAt,
    flowPhase: (row.flowPhase as FlowPhase) ?? null,
    actualStart: row.actualStart,
    actualEnd: row.actualEnd,
    lastEnteredActive: row.lastEnteredActive,
    lastEnteredQueue: row.lastEnteredQueue,
    activeTimeMin: row.activeTimeMin ?? 0,
    queueTimeMin: row.queueTimeMin ?? 0,
    reworkCount: row.reworkCount ?? 0,
    reworkWaitMin: row.reworkWaitMin ?? 0,
    cycleTimeMin: row.cycleTimeMin ?? 0,
  };
}

function buildWhereConditions(filters: IssueFilters) {
  const conditions = [];

  if (filters.status) {
    const statuses = filters.status.split(",").map((s) => s.trim());
    conditions.push(inArray(issues.status, statuses));
  }
  if (filters.priority) {
    const priorities = filters.priority.split(",").map((s) => s.trim());
    conditions.push(inArray(issues.priority, priorities));
  }
  if (filters.type) {
    const types = filters.type.split(",").map((s) => s.trim());
    conditions.push(inArray(issues.type, types));
  }
  if (filters.assignee) {
    const assignees = filters.assignee.split(",").map((s) => s.trim());
    conditions.push(inArray(issues.assignee, assignees));
  }
  if (filters.sprint) {
    const sprintFilter = filters.sprint.split(",").map((s) => s.trim());
    conditions.push(
      sql`${issues.sprintIds} && ARRAY[${sql.join(sprintFilter.map((id) => sql`${id}`), sql`, `)}]::text[]`,
    );
  }
  if (filters.project) {
    conditions.push(eq(issues.projectKey, filters.project));
  }
  if (filters.labels) {
    conditions.push(sql`${issues.labels} && ARRAY[${filters.labels}]::text[]`);
  }
  if (filters.dateFrom) {
    conditions.push(gte(issues.createdAt, new Date(filters.dateFrom)));
  }
  if (filters.dateTo) {
    conditions.push(lte(issues.createdAt, new Date(filters.dateTo)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

const sortColumns = {
  createdAt: issues.createdAt,
  updatedAt: issues.updatedAt,
  priority: issues.priority,
  status: issues.status,
} as const;

export const issueRepo = {
  async findFiltered(filters: IssueFilters): Promise<PaginatedResult<Issue>> {
    const where = buildWhereConditions(filters);
    const offset = (filters.page - 1) * filters.limit;
    const sortCol = sortColumns[filters.sort];
    const orderFn = filters.order === "asc" ? asc : desc;

    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(issues)
        .where(where)
        .orderBy(orderFn(sortCol))
        .limit(filters.limit)
        .offset(offset),
      db.select({ count: count() }).from(issues).where(where),
    ]);

    return {
      data: rows.map(toDomain),
      total: totalResult[0]?.count ?? 0,
      page: filters.page,
      limit: filters.limit,
    };
  },

  async findByKey(key: string): Promise<Issue | null> {
    const rows = await db
      .select()
      .from(issues)
      .where(eq(issues.key, key))
      .limit(1);

    return rows[0] ? toDomain(rows[0]) : null;
  },

  async findBySprintId(sprintId: string): Promise<Issue[]> {
    const rows = await db
      .select()
      .from(issues)
      .where(sql`${sprintId} = ANY(${issues.sprintIds})`);

    return rows.map(toDomain);
  },

  async upsertMany(data: Issue[]): Promise<number> {
    if (data.length === 0) return 0;

    const BATCH_SIZE = 100;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      await db
        .insert(issues)
        .values(
          batch.map((issue) => ({
            id: issue.id,
            key: issue.key,
            summary: issue.summary,
            status: issue.status,
            priority: issue.priority,
            type: issue.type,
            assignee: issue.assignee,
            reporter: issue.reporter,
            projectKey: issue.projectKey,
            sprintIds: issue.sprintIds,
            storyPoints: issue.storyPoints,
            labels: issue.labels,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt,
            resolvedAt: issue.resolvedAt,
            flowPhase: issue.flowPhase,
            actualStart: issue.actualStart,
            actualEnd: issue.actualEnd,
            lastEnteredActive: issue.lastEnteredActive,
            lastEnteredQueue: issue.lastEnteredQueue,
            activeTimeMin: issue.activeTimeMin,
            queueTimeMin: issue.queueTimeMin,
            reworkCount: issue.reworkCount,
            reworkWaitMin: issue.reworkWaitMin,
          })),
        )
        .onConflictDoUpdate({
          target: issues.id,
          set: {
            key: sql`excluded.key`,
            summary: sql`excluded.summary`,
            status: sql`excluded.status`,
            priority: sql`excluded.priority`,
            type: sql`excluded.type`,
            assignee: sql`excluded.assignee`,
            reporter: sql`excluded.reporter`,
            projectKey: sql`excluded.project_key`,
            sprintIds: sql`excluded.sprint_ids`,
            storyPoints: sql`excluded.story_points`,
            labels: sql`excluded.labels`,
            createdAt: sql`excluded.created_at`,
            updatedAt: sql`excluded.updated_at`,
            resolvedAt: sql`excluded.resolved_at`,
          },
        });
    }

    return data.length;
  },

  async countAll(): Promise<number> {
    const result = await db.select({ count: count() }).from(issues);
    return result[0]?.count ?? 0;
  },

  async countByStatus(): Promise<{ status: string; count: number }[]> {
    const rows = await db
      .select({
        status: issues.status,
        count: count(),
      })
      .from(issues)
      .groupBy(issues.status);

    return rows;
  },

  async countByPriority(): Promise<{ priority: string; count: number }[]> {
    const rows = await db
      .select({
        priority: issues.priority,
        count: count(),
      })
      .from(issues)
      .groupBy(issues.priority);

    return rows.map((r) => ({
      priority: r.priority ?? "None",
      count: r.count,
    }));
  },

  async findKeysByProject(projectKey: string): Promise<string[]> {
    const rows = await db
      .select({ key: issues.key })
      .from(issues)
      .where(eq(issues.projectKey, projectKey));
    return rows.map((r) => r.key);
  },

  async updateFlowFields(
    key: string,
    fields: FlowFields,
  ): Promise<void> {
    await db
      .update(issues)
      .set({
        flowPhase: fields.flowPhase,
        actualStart: fields.actualStart,
        actualEnd: fields.actualEnd,
        lastEnteredActive: fields.lastEnteredActive,
        lastEnteredQueue: fields.lastEnteredQueue,
        activeTimeMin: fields.activeTimeMin,
        queueTimeMin: fields.queueTimeMin,
        reworkCount: fields.reworkCount,
        reworkWaitMin: fields.reworkWaitMin,
        cycleTimeMin: fields.cycleTimeMin,
      })
      .where(eq(issues.key, key));
  },
};
