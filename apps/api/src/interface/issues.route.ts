import { Elysia, t } from "elysia";
import {
  getFilteredIssues,
  getIssueByKey,
  getIssueTransitions,
  getIssueStats,
} from "../application/get-filtered-issues";

export const issuesRoute = new Elysia({ prefix: "/api/issues" })
  .get("/stats", async () => {
    return getIssueStats();
  })
  .get(
    "/",
    async ({ query }) => {
      const filters = {
        status: query.status,
        priority: query.priority,
        type: query.type,
        assignee: query.assignee,
        sprint: query.sprint,
        project: query.project,
        labels: query.labels,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        page: query.page ? Number(query.page) : 1,
        limit: query.limit ? Number(query.limit) : 50,
        sort: (query.sort ?? "createdAt") as
          | "createdAt"
          | "updatedAt"
          | "priority"
          | "status",
        order: (query.order ?? "desc") as "asc" | "desc",
      };

      return getFilteredIssues(filters);
    },
    {
      query: t.Object({
        status: t.Optional(t.String()),
        priority: t.Optional(t.String()),
        type: t.Optional(t.String()),
        assignee: t.Optional(t.String()),
        sprint: t.Optional(t.String()),
        project: t.Optional(t.String()),
        labels: t.Optional(t.String()),
        dateFrom: t.Optional(t.String()),
        dateTo: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sort: t.Optional(t.String()),
        order: t.Optional(t.String()),
      }),
    },
  )
  .get("/:key", async ({ params, set }) => {
    const issue = await getIssueByKey(params.key);
    if (!issue) {
      set.status = 404;
      return { error: "Issue not found" };
    }
    return issue;
  })
  .get("/:key/transitions", async ({ params, set }) => {
    const issue = await getIssueByKey(params.key);
    if (!issue) {
      set.status = 404;
      return { error: "Issue not found" };
    }
    return getIssueTransitions(params.key);
  });
