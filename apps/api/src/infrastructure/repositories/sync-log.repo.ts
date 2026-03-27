import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { syncLog } from "../db/schema";

type SyncLogRow = typeof syncLog.$inferSelect;

export type SyncLogEntry = {
  id: number;
  startedAt: Date;
  finishedAt: Date | null;
  status: "running" | "success" | "error";
  issuesSynced: number;
  error: string | null;
};

function toDomain(row: SyncLogRow): SyncLogEntry {
  return {
    id: row.id,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    status: row.status as SyncLogEntry["status"],
    issuesSynced: row.issuesSynced ?? 0,
    error: row.error,
  };
}

export const syncLogRepo = {
  async create(): Promise<SyncLogEntry> {
    const rows = await db
      .insert(syncLog)
      .values({
        startedAt: new Date(),
        status: "running",
      })
      .returning();

    return toDomain(rows[0]!);
  },

  async markSuccess(id: number, issuesSynced: number): Promise<void> {
    await db
      .update(syncLog)
      .set({
        finishedAt: new Date(),
        status: "success",
        issuesSynced,
      })
      .where(eq(syncLog.id, id));
  },

  async markError(id: number, error: string): Promise<void> {
    await db
      .update(syncLog)
      .set({
        finishedAt: new Date(),
        status: "error",
        error,
      })
      .where(eq(syncLog.id, id));
  },

  async getLatest(): Promise<SyncLogEntry | null> {
    const rows = await db
      .select()
      .from(syncLog)
      .orderBy(desc(syncLog.startedAt))
      .limit(1);

    return rows[0] ? toDomain(rows[0]) : null;
  },

  async isRunning(): Promise<boolean> {
    const latest = await this.getLatest();
    return latest?.status === "running";
  },
};
