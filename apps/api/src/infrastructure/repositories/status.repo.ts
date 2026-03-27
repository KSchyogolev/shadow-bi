import { eq, and, sql } from "drizzle-orm";
import { db } from "../db/client";
import { statuses } from "../db/schema";
import type { StatusMapping } from "../../domain/status/status.entity";
import type { FlowPhase } from "../../domain/flow/flow.types";

type StatusRow = typeof statuses.$inferSelect;

function toDomain(row: StatusRow): StatusMapping {
  return {
    id: row.id,
    name: row.name,
    projectKey: row.projectKey,
    phase: row.phase as FlowPhase,
    inCycle: row.inCycle,
    order: row.order,
  };
}

export const statusRepo = {
  async findByProject(projectKey: string): Promise<StatusMapping[]> {
    const rows = await db
      .select()
      .from(statuses)
      .where(eq(statuses.projectKey, projectKey))
      .orderBy(statuses.order, statuses.name);
    return rows.map(toDomain);
  },

  async upsertMany(
    items: { name: string; projectKey: string; phase: FlowPhase }[],
  ): Promise<number> {
    if (items.length === 0) return 0;

    await db
      .insert(statuses)
      .values(items)
      .onConflictDoNothing({
        target: [statuses.name, statuses.projectKey],
      });

    return items.length;
  },

  async updatePhase(id: number, phase: FlowPhase): Promise<StatusMapping | null> {
    const rows = await db
      .update(statuses)
      .set({ phase })
      .where(eq(statuses.id, id))
      .returning();

    return rows[0] ? toDomain(rows[0]) : null;
  },

  async updateInCycle(id: number, inCycle: boolean): Promise<StatusMapping | null> {
    const rows = await db
      .update(statuses)
      .set({ inCycle })
      .where(eq(statuses.id, id))
      .returning();

    return rows[0] ? toDomain(rows[0]) : null;
  },

  async getInCycleStatusOrder(projectKey: string): Promise<Map<string, number>> {
    const rows = await db
      .select({ name: statuses.name, order: statuses.order })
      .from(statuses)
      .where(and(eq(statuses.projectKey, projectKey), eq(statuses.inCycle, true)))
      .orderBy(statuses.order);

    return new Map(rows.map((r) => [r.name, r.order]));
  },

  async getInCycleSet(projectKey: string): Promise<Set<string>> {
    const rows = await db
      .select({ name: statuses.name })
      .from(statuses)
      .where(and(eq(statuses.projectKey, projectKey), eq(statuses.inCycle, true)));

    return new Set(rows.map((r) => r.name));
  },

  async reorder(orderedIds: number[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(statuses)
          .set({ order: i })
          .where(eq(statuses.id, orderedIds[i]!));
      }
    });
  },

  async getPhaseMap(projectKey: string): Promise<Record<string, FlowPhase>> {
    const rows = await db
      .select({ name: statuses.name, phase: statuses.phase })
      .from(statuses)
      .where(eq(statuses.projectKey, projectKey));

    const map: Record<string, FlowPhase> = {};
    for (const row of rows) {
      map[row.name] = row.phase as FlowPhase;
    }
    return map;
  },
};
