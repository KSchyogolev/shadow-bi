import { Elysia } from "elysia";
import { projectRepo } from "../infrastructure/repositories/project.repo";
import { createJiraClient } from "../infrastructure/jira/jira.client";

export const projectsRoute = new Elysia({ prefix: "/api/projects" })
  .get("/", async () => {
    return projectRepo.findAll();
  })
  .get("/jira", async () => {
    const jira = createJiraClient();
    const projects = await jira.getProjects();
    return projects.map((p) => ({
      id: p.id,
      key: p.key,
      name: p.name,
      lead: p.lead?.displayName ?? null,
    }));
  });
