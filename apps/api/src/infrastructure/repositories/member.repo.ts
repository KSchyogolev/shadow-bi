import { eq, and, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { projectMembers } from "../db/schema";
import type { ProjectMember, MemberRole } from "../../domain/member/member.entity";

type MemberRow = typeof projectMembers.$inferSelect;

function toDomain(row: MemberRow): ProjectMember {
  return {
    id: row.id,
    displayName: row.displayName,
    projectKey: row.projectKey,
    role: row.role as MemberRole,
  };
}

export const memberRepo = {
  async findByProject(projectKey: string): Promise<ProjectMember[]> {
    const rows = await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.projectKey, projectKey))
      .orderBy(projectMembers.displayName);
    return rows.map(toDomain);
  },

  async upsertMany(
    items: { displayName: string; projectKey: string }[],
  ): Promise<number> {
    if (items.length === 0) return 0;

    await db
      .insert(projectMembers)
      .values(items)
      .onConflictDoNothing({
        target: [projectMembers.displayName, projectMembers.projectKey],
      });

    return items.length;
  },

  async updateRole(id: number, role: MemberRole): Promise<ProjectMember | null> {
    const rows = await db
      .update(projectMembers)
      .set({ role })
      .where(eq(projectMembers.id, id))
      .returning();

    return rows[0] ? toDomain(rows[0]) : null;
  },

  async getActiveMembers(projectKey: string): Promise<Set<string>> {
    const rows = await db
      .select({ displayName: projectMembers.displayName })
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectKey, projectKey),
          inArray(projectMembers.role, ["DEV", "QA"]),
        ),
      );

    return new Set(rows.map((r) => r.displayName));
  },

  async hasAnyMembers(projectKey: string): Promise<boolean> {
    const rows = await db
      .select({ id: projectMembers.id })
      .from(projectMembers)
      .where(eq(projectMembers.projectKey, projectKey))
      .limit(1);

    return rows.length > 0;
  },
};
