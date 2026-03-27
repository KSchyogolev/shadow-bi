import { Elysia } from "elysia";
import { sprintRepo } from "../infrastructure/repositories/sprint.repo";
import { issueRepo } from "../infrastructure/repositories/issue.repo";
import { computeSprintStats, computeBurndown } from "../application/compute-sprint-stats";

export const sprintsRoute = new Elysia({ prefix: "/api/sprints" })
  .get("/", async ({ query }) => {
    const projectKey = (query as Record<string, string | undefined>).projectKey;
    const data = projectKey
      ? await sprintRepo.findByProjectKey(projectKey)
      : await sprintRepo.findAll();
    return { data, total: data.length, page: 1, limit: data.length };
  })
  .get("/:id", async ({ params, set }) => {
    const sprint = await sprintRepo.findById(params.id);
    if (!sprint) {
      set.status = 404;
      return { error: "Sprint not found" };
    }
    const sprintIssues = await issueRepo.findBySprintId(params.id);
    return { ...sprint, issues: sprintIssues };
  })
  .get("/:id/burndown", async ({ params, set }) => {
    const sprint = await sprintRepo.findById(params.id);
    if (!sprint) {
      set.status = 404;
      return { error: "Sprint not found" };
    }

    if (!sprint.startDate || !sprint.endDate) {
      return [];
    }

    const sprintIssues = await issueRepo.findBySprintId(params.id);
    return computeBurndown(sprintIssues, {
      startMs: sprint.startDate.getTime(),
      endMs: sprint.endDate.getTime(),
      state: sprint.state,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
    });
  })
  .get("/:id/stats", async ({ params, set }) => {
    const sprint = await sprintRepo.findById(params.id);
    if (!sprint) {
      set.status = 404;
      return { error: "Sprint not found" };
    }

    const sprintIssues = await issueRepo.findBySprintId(params.id);
    return computeSprintStats(
      sprintIssues,
      sprint.startDate?.getTime() ?? 0,
      sprint.endDate?.getTime() ?? Date.now(),
    );
  })
