import type { Issue } from "../../domain/issue/issue.entity";
import type { Sprint } from "../../domain/sprint/sprint.entity";
import type { Project } from "../../domain/project/project.entity";
import type { JiraIssueFields, JiraSprint, JiraProject, JiraIssueWithChangelog } from "./jira.types";
import { FLOW_FIELD_MAPPING } from "./jira.flow-fields";

export function mapJiraIssue(raw: JiraIssueWithChangelog): Issue {
  const { fields } = raw;

  const rawSprints = fields.customfield_10020 ?? (fields.sprint ? [fields.sprint] : []);

  return {
    id: raw.id,
    key: raw.key,
    summary: fields.summary,
    status: fields.status.name,
    priority: fields.priority?.name ?? "None",
    type: fields.issuetype.name,
    assignee: fields.assignee?.displayName ?? null,
    reporter: fields.reporter?.displayName ?? "Unknown",
    projectKey: fields.project.key,
    sprintIds: rawSprints.map((s) => String(s.id)),
    storyPoints: extractStoryPoints(fields),
    labels: fields.labels ?? [],
    createdAt: new Date(fields.created),
    updatedAt: new Date(fields.updated),
    resolvedAt: resolveDate(fields),
    flowPhase: null,
    actualStart: null,
    actualEnd: null,
    lastEnteredActive: null,
    lastEnteredQueue: null,
    activeTimeMin: 0,
    queueTimeMin: 0,
    reworkCount: 0,
    reworkWaitMin: 0,
    cycleTimeMin: 0,
  };
}

function extractStoryPoints(fields: JiraIssueFields): number | null {
  const fieldId = FLOW_FIELD_MAPPING.storyPoints;
  if (!fieldId) return null;
  const raw = (fields as unknown as Record<string, unknown>)[fieldId];
  if (raw == null) return null;
  if (typeof raw === "number") return raw;
  const num = Number(raw);
  return isNaN(num) ? null : num;
}

const DONE_STATUSES = ["Done", "Closed", "Resolved", "Cancelled"];

function resolveDate(fields: JiraIssueFields): Date | null {
  if (fields.resolutiondate) return new Date(fields.resolutiondate);
  if (
    fields.statuscategorychangedate &&
    DONE_STATUSES.includes(fields.status.name)
  ) {
    return new Date(fields.statuscategorychangedate);
  }
  return null;
}

export function mapJiraSprint(raw: JiraSprint, boardId: string, projectKey: string): Sprint {
  return {
    id: String(raw.id),
    name: raw.name,
    state: normalizeSprintState(raw.state),
    startDate: raw.startDate ? new Date(raw.startDate) : null,
    endDate: raw.endDate ? new Date(raw.endDate) : null,
    boardId,
    projectKey,
  };
}

function normalizeSprintState(state: string): Sprint["state"] {
  const normalized = state.toLowerCase();
  if (normalized === "active") return "active";
  if (normalized === "closed") return "closed";
  return "future";
}

export function mapJiraProject(raw: JiraProject): Project {
  return {
    id: raw.id,
    key: raw.key,
    name: raw.name,
    lead: raw.lead?.displayName ?? null,
    lastSync: null,
  };
}
