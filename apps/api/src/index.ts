import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { syncRoute } from "./interface/sync.route";
import { issuesRoute } from "./interface/issues.route";
import { sprintsRoute } from "./interface/sprints.route";
import { projectsRoute } from "./interface/projects.route";
import { dashboardRoute } from "./interface/dashboard.route";
import { metricsRoute } from "./interface/metrics.route";
import { teamRoute } from "./interface/team.route";
import { jiraRoute } from "./interface/jira.route";
import { statusesRoute } from "./interface/statuses.route";
import { membersRoute } from "./interface/members.route";

const app = new Elysia()
  .use(cors())
  .onError(({ error, set }) => {
    console.error(error);

    if ("status" in error && typeof error.status === "number") {
      set.status = error.status;
      return { error: error.message };
    }

    set.status = 500;
    return { error: "Internal server error" };
  })
  .get("/health", () => ({ status: "ok" }))
  .use(syncRoute)
  .use(issuesRoute)
  .use(sprintsRoute)
  .use(projectsRoute)
  .use(dashboardRoute)
  .use(metricsRoute)
  .use(teamRoute)
  .use(jiraRoute)
  .use(statusesRoute)
  .use(membersRoute)
  .listen(process.env.PORT ?? 3001);

console.log(`API server running at ${app.server?.url}`);

export type App = typeof app;
