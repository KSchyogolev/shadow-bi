import { eq, count } from "drizzle-orm";
import { db } from "../db/client";
import { projects } from "../db/schema";
import type { Project } from "../../domain/project/project.entity";
import { sql } from "drizzle-orm";

type ProjectRow = typeof projects.$inferSelect;

function toDomain(row: ProjectRow): Project {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    lead: row.lead,
    lastSync: row.lastSync,
  };
}

export const projectRepo = {
  async findAll(): Promise<Project[]> {
    const rows = await db.select().from(projects);
    return rows.map(toDomain);
  },

  async findByKey(key: string): Promise<Project | null> {
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.key, key))
      .limit(1);

    return rows[0] ? toDomain(rows[0]) : null;
  },

  async upsertMany(data: Project[]): Promise<number> {
    if (data.length === 0) return 0;

    await db
      .insert(projects)
      .values(
        data.map((project) => ({
          id: project.id,
          key: project.key,
          name: project.name,
          lead: project.lead,
        })),
      )
      .onConflictDoUpdate({
        target: projects.id,
        set: {
          key: sql`excluded.key`,
          name: sql`excluded.name`,
          lead: sql`excluded.lead`,
        },
      });

    return data.length;
  },

  async updateLastSync(key: string): Promise<void> {
    await db
      .update(projects)
      .set({ lastSync: new Date() })
      .where(eq(projects.key, key));
  },

  async count(): Promise<number> {
    const result = await db.select({ count: count() }).from(projects);
    return result[0]?.count ?? 0;
  },
};
