import type { JiraClient } from "../infrastructure/jira/jira.client";
import {
  mapJiraIssue,
  mapJiraSprint,
  mapJiraProject,
} from "../infrastructure/jira/jira.mapper";
import { parseChangelog } from "../infrastructure/jira/jira.changelog";
import { issueRepo } from "../infrastructure/repositories/issue.repo";
import { sprintRepo } from "../infrastructure/repositories/sprint.repo";
import { projectRepo } from "../infrastructure/repositories/project.repo";
import { syncLogRepo } from "../infrastructure/repositories/sync-log.repo";
import { statusHistoryRepo } from "../infrastructure/repositories/status-history.repo";
import { statusRepo } from "../infrastructure/repositories/status.repo";
import { memberRepo } from "../infrastructure/repositories/member.repo";
import { STATUS_FLOW_MAP } from "../domain/flow/flow.constants";
import type { FlowPhase } from "../domain/flow/flow.types";

export async function syncProject(jira: JiraClient, projectKey: string) {
  if (await syncLogRepo.isRunning()) {
    throw new Error("Sync is already running");
  }

  const log = await syncLogRepo.create();

  try {
    const jiraProjects = await jira.getProjects();
    const project = jiraProjects.find((p) => p.key === projectKey);
    if (project) {
      await projectRepo.upsertMany([mapJiraProject(project)]);
    }

    try {
      const statusNames = await jira.getProjectStatuses(projectKey);
      const statusItems = statusNames.map((name) => ({
        name,
        projectKey,
        phase: (STATUS_FLOW_MAP[name] ?? "Active") as FlowPhase,
      }));
      await statusRepo.upsertMany(statusItems);
      console.log(`Synced ${statusItems.length} statuses for ${projectKey}`);
    } catch {
      console.log(`Could not fetch statuses for ${projectKey}, skipping`);
    }

    try {
      const boards = await jira.getBoardsForProject(projectKey);
      if (boards.length > 0) {
        const boardId = String(boards[0]!.id);
        const boardSprints = await jira.getSprints(boardId);
        const sprints = boardSprints.map((s) => mapJiraSprint(s, boardId, projectKey));
        await sprintRepo.upsertMany(sprints);
        console.log(`Synced ${sprints.length} sprints for ${projectKey}`);
      }
    } catch {
      console.log(`No sprints found for project ${projectKey}, skipping`);
    }

    const jiraIssues = await jira.getAllIssues(
      `project = ${projectKey} ORDER BY updated DESC`,
    );

    const issues = jiraIssues.map((raw) => mapJiraIssue(raw));
    await issueRepo.upsertMany(issues);
    console.log(`Synced ${issues.length} issues for ${projectKey}`);

    const uniqueAssignees = new Set<string>();
    for (const issue of issues) {
      if (issue.assignee) uniqueAssignees.add(issue.assignee);
    }
    if (uniqueAssignees.size > 0) {
      const memberItems = [...uniqueAssignees].map((name) => ({
        displayName: name,
        projectKey,
      }));
      await memberRepo.upsertMany(memberItems);
      console.log(`Synced ${memberItems.length} team members for ${projectKey}`);
    }

    let transitionCount = 0;
    for (const raw of jiraIssues) {
      if (!raw.changelog) continue;
      const transitions = parseChangelog(raw.key, raw.changelog);
      if (transitions.length > 0) {
        await statusHistoryRepo.replaceForIssue(raw.key, transitions);
        transitionCount += transitions.length;
      }
    }
    console.log(`Synced ${transitionCount} status transitions for ${projectKey}`);

    await projectRepo.updateLastSync(projectKey);
    await syncLogRepo.markSuccess(log.id, issues.length);

    return { issues: issues.length, transitions: transitionCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await syncLogRepo.markError(log.id, message);
    throw error;
  }
}
