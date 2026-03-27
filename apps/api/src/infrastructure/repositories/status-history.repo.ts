import { eq, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { issueStatusHistory, issues } from "../db/schema";
import type { StatusTransition } from "../../domain/flow/flow.types";

type HistoryRow = typeof issueStatusHistory.$inferSelect;

function toTransition(r: HistoryRow): StatusTransition {
  return {
    issueKey: r.issueKey,
    fromStatus: r.fromStatus,
    toStatus: r.toStatus,
    changedAt: r.changedAt,
    author: r.author,
  };
}

export const statusHistoryRepo = {
  async upsertMany(transitions: StatusTransition[]): Promise<number> {
    if (transitions.length === 0) return 0;

    const BATCH_SIZE = 200;
    for (let i = 0; i < transitions.length; i += BATCH_SIZE) {
      const batch = transitions.slice(i, i + BATCH_SIZE);
      await db
        .insert(issueStatusHistory)
        .values(
          batch.map((t) => ({
            issueKey: t.issueKey,
            fromStatus: t.fromStatus,
            toStatus: t.toStatus,
            changedAt: t.changedAt,
            author: t.author,
          })),
        )
        .onConflictDoNothing();
    }

    return transitions.length;
  },

  async deleteByIssueKey(issueKey: string): Promise<void> {
    await db
      .delete(issueStatusHistory)
      .where(eq(issueStatusHistory.issueKey, issueKey));
  },

  async replaceForIssue(issueKey: string, transitions: StatusTransition[]): Promise<number> {
    await this.deleteByIssueKey(issueKey);
    return this.upsertMany(transitions);
  },

  async findByIssueKey(issueKey: string): Promise<StatusTransition[]> {
    const rows = await db
      .select()
      .from(issueStatusHistory)
      .where(eq(issueStatusHistory.issueKey, issueKey))
      .orderBy(issueStatusHistory.changedAt);

    return rows.map(toTransition);
  },

  async findByProject(projectKey: string): Promise<StatusTransition[]> {
    const issueKeys = await db
      .select({ key: issues.key })
      .from(issues)
      .where(eq(issues.projectKey, projectKey));

    const keys = issueKeys.map((r) => r.key);
    if (keys.length === 0) return [];

    const BATCH = 500;
    const allRows: StatusTransition[] = [];

    for (let i = 0; i < keys.length; i += BATCH) {
      const batch = keys.slice(i, i + BATCH);
      const rows = await db
        .select()
        .from(issueStatusHistory)
        .where(inArray(issueStatusHistory.issueKey, batch))
        .orderBy(issueStatusHistory.issueKey, issueStatusHistory.changedAt);

      allRows.push(...rows.map(toTransition));
    }

    return allRows;
  },
};
