import { Elysia, t } from "elysia";
import {
  getAssigneePerformance,
  getAssigneeTrend,
  getAssigneeSprintMetrics,
} from "../application/get-team-metrics";

const teamQuery = t.Object({
  projectKey: t.String(),
  sprintId: t.Optional(t.String()),
  assignee: t.Optional(t.String()),
  dateFrom: t.Optional(t.String()),
  dateTo: t.Optional(t.String()),
  issueType: t.Optional(t.String()),
  priority: t.Optional(t.String()),
  labels: t.Optional(t.String()),
});

export const teamRoute = new Elysia({ prefix: "/api/team" })
  .get("/performance", ({ query }) => getAssigneePerformance(query), {
    query: teamQuery,
  })
  .get("/trend", ({ query }) => getAssigneeTrend(query), {
    query: teamQuery,
  })
  .get("/sprint-metrics", ({ query }) => getAssigneeSprintMetrics(query), {
    query: teamQuery,
  });
