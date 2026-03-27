import { Elysia, t } from "elysia";
import { createJiraClient } from "../infrastructure/jira/jira.client";
import { syncProject } from "../application/sync-issues";
import { recalculateProjectMetrics } from "../application/recalculate-metrics";

export const syncRoute = new Elysia({ prefix: "/api/sync" })
  .post(
    "/project/:key",
    async ({ params, set }) => {
      const jira = createJiraClient();

      try {
        const result = await syncProject(jira, params.key);
        return { issues: result.issues, transitions: result.transitions };
      } catch (err) {
        console.error(`Project sync failed for ${params.key}:`, err);
        set.status = 500;
        return { error: err instanceof Error ? err.message : "Sync failed" };
      }
    },
    {
      params: t.Object({ key: t.String() }),
    },
  )
  .post(
    "/project/:key/recalculate",
    async ({ params, set }) => {
      try {
        const result = await recalculateProjectMetrics(params.key);
        return { updated: result.updated };
      } catch (err) {
        console.error(`Recalculate failed for ${params.key}:`, err);
        set.status = 500;
        return {
          error: err instanceof Error ? err.message : "Recalculation failed",
        };
      }
    },
    {
      params: t.Object({ key: t.String() }),
    },
  );
