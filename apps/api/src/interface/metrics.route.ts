import { Elysia, t } from "elysia";
import {
  getCycleTimeDistribution,
  getCycleTimeBySprint,
  getLeadTimeDistribution,
  getTimeInStatus,
  getThroughput,
  getReworkMetrics,
  getFlowEfficiency,
  getHoursPerSP,
} from "../application/get-flow-metrics";

const metricsQuery = t.Object({
  projectKey: t.String(),
  sprintId: t.Optional(t.String()),
  assignee: t.Optional(t.String()),
  dateFrom: t.Optional(t.String()),
  dateTo: t.Optional(t.String()),
  issueType: t.Optional(t.String()),
  priority: t.Optional(t.String()),
  labels: t.Optional(t.String()),
});

export const metricsRoute = new Elysia({ prefix: "/api/metrics" })
  .get("/cycle-time", ({ query }) => getCycleTimeDistribution(query), {
    query: metricsQuery,
  })
  .get(
    "/cycle-time-by-sprint",
    ({ query }) => getCycleTimeBySprint(query),
    { query: metricsQuery },
  )
  .get("/lead-time", ({ query }) => getLeadTimeDistribution(query), {
    query: metricsQuery,
  })
  .get("/time-in-status", ({ query }) => getTimeInStatus(query), {
    query: metricsQuery,
  })
  .get("/throughput", ({ query }) => getThroughput(query), {
    query: metricsQuery,
  })
  .get("/rework", ({ query }) => getReworkMetrics(query), {
    query: metricsQuery,
  })
  .get("/flow-efficiency", ({ query }) => getFlowEfficiency(query), {
    query: metricsQuery,
  })
  .get("/hours-per-sp", ({ query }) => getHoursPerSP(query), {
    query: metricsQuery,
  });
