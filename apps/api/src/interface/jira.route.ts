import { Elysia, t } from "elysia";
import { createJiraClient } from "../infrastructure/jira/jira.client";
import { FLOW_FIELD_MAPPING } from "../infrastructure/jira/jira.flow-fields";

export const jiraRoute = new Elysia({ prefix: "/api/jira" })
  .get("/host", () => {
    const host = process.env.JIRA_HOST?.replace(/\/$/, "");
    if (!host) return { host: null };
    return { host };
  })
  .get(
    "/fields",
    async ({ query, set }) => {
      const jira = createJiraClient();

      try {
        const allFields = await jira.getFields();

        const search = query.search?.toLowerCase();
        const fields = search
          ? allFields.filter(
              (f) =>
                f.name.toLowerCase().includes(search) ||
                f.id.toLowerCase().includes(search),
            )
          : allFields.filter((f) => f.custom);

        return {
          currentMapping: FLOW_FIELD_MAPPING,
          total: fields.length,
          fields: fields.map((f) => ({
            id: f.id,
            name: f.name,
            custom: f.custom,
            schema: f.schema,
          })),
        };
      } catch (err) {
        set.status = 500;
        return { error: err instanceof Error ? err.message : "Failed to fetch fields" };
      }
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
      }),
    },
  );
