import { eq, count, asc } from "drizzle-orm";
import { db } from "../db/client";
import { sprints } from "../db/schema";
import type { Sprint } from "../../domain/sprint/sprint.entity";
import { sql } from "drizzle-orm";

type SprintRow = typeof sprints.$inferSelect;

function toDomain(row: SprintRow): Sprint {
  return {
    id: row.id,
    name: row.name,
    state: row.state as Sprint["state"],
    startDate: row.startDate,
    endDate: row.endDate,
    boardId: row.boardId,
    projectKey: row.projectKey,
  };
}

export const sprintRepo = {
  async findAll(): Promise<Sprint[]> {
    const rows = await db
      .select()
      .from(sprints)
      .orderBy(asc(sprints.startDate));
    return rows.map(toDomain);
  },

  async findByProjectKey(projectKey: string): Promise<Sprint[]> {
    const rows = await db
      .select()
      .from(sprints)
      .where(eq(sprints.projectKey, projectKey))
      .orderBy(asc(sprints.startDate));
    return rows.map(toDomain);
  },

  async findById(id: string): Promise<Sprint | null> {
    const rows = await db
      .select()
      .from(sprints)
      .where(eq(sprints.id, id))
      .limit(1);

    return rows[0] ? toDomain(rows[0]) : null;
  },

  async upsertMany(data: Sprint[]): Promise<number> {
    if (data.length === 0) return 0;

    await db
      .insert(sprints)
      .values(
        data.map((sprint) => ({
          id: sprint.id,
          name: sprint.name,
          state: sprint.state,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          boardId: sprint.boardId,
          projectKey: sprint.projectKey,
        })),
      )
      .onConflictDoUpdate({
        target: sprints.id,
        set: {
          name: sql`excluded.name`,
          state: sql`excluded.state`,
          startDate: sql`excluded.start_date`,
          endDate: sql`excluded.end_date`,
          boardId: sql`excluded.board_id`,
          projectKey: sql`excluded.project_key`,
        },
      });

    return data.length;
  },

  async count(): Promise<number> {
    const result = await db.select({ count: count() }).from(sprints);
    return result[0]?.count ?? 0;
  },
};
