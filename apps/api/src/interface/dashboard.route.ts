import { Elysia, t } from "elysia";
import {
  getDashboardSummary,
  getVelocity,
  getCycleTime,
} from "../application/get-dashboard-stats";

export const dashboardRoute = new Elysia({ prefix: "/api/dashboard" })
  .get(
    "/summary",
    async ({ query }) => {
      return getDashboardSummary({
        project: query.project,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
      });
    },
    {
      query: t.Object({
        project: t.Optional(t.String()),
        dateFrom: t.Optional(t.String()),
        dateTo: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/velocity",
    async ({ query }) => {
      return getVelocity({
        project: query.projectKey || query.project,
        assignee: query.assignee,
        issueType: query.issueType,
        priority: query.priority,
        labels: query.labels,
      });
    },
    {
      query: t.Object({
        project: t.Optional(t.String()),
        projectKey: t.Optional(t.String()),
        assignee: t.Optional(t.String()),
        issueType: t.Optional(t.String()),
        priority: t.Optional(t.String()),
        labels: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/cycle-time",
    async ({ query }) => {
      return getCycleTime({ project: query.project });
    },
    {
      query: t.Object({
        project: t.Optional(t.String()),
      }),
    },
  );
