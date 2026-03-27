import type {
  JiraConfig,
  JiraSearchResponse,
  JiraBoardsResponse,
  JiraSprintsResponse,
  JiraSprint,
  JiraBoard,
  JiraProject,
  JiraIssueWithChangelog,
  JiraField,
  JiraIssueTypeWithStatuses,
} from "./jira.types";
import { FLOW_FIELD_MAPPING, type FlowFieldMapping } from "./jira.flow-fields";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

const BASE_ISSUE_FIELDS = [
  "summary",
  "status",
  "priority",
  "issuetype",
  "assignee",
  "reporter",
  "project",
  "labels",
  "created",
  "updated",
  "resolutiondate",
  "customfield_10020",
  "statuscategorychangedate",
];

export function buildIssueFields(mapping?: FlowFieldMapping): string[] {
  const m = mapping ?? FLOW_FIELD_MAPPING;

  const extra = Object.values(m).filter(
    (id): id is string => typeof id === "string" && id.length > 0,
  );

  const baseSet = new Set(BASE_ISSUE_FIELDS);
  const unique = extra.filter((id) => !baseSet.has(id));

  return [...BASE_ISSUE_FIELDS, ...unique];
}

export class JiraClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  private static readonly ISSUE_FIELDS = buildIssueFields();

  constructor(private config: JiraConfig) {
    this.baseUrl = config.host.replace(/\/$/, "");
    this.headers = {
      Authorization: `Basic ${btoa(`${config.email}:${config.token}`)}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  async searchIssues(
    jql: string,
    nextPageToken?: string,
    maxResults = 100,
  ): Promise<JiraSearchResponse> {
    const body: Record<string, unknown> = {
      jql,
      maxResults,
      fields: JiraClient.ISSUE_FIELDS,
      expand: "changelog",
    };
    if (nextPageToken) {
      body.nextPageToken = nextPageToken;
    }

    return this.requestPost<JiraSearchResponse>(
      "/rest/api/3/search/jql",
      body,
    );
  }

  async getAllIssues(jql: string): Promise<JiraIssueWithChangelog[]> {
    const all: JiraIssueWithChangelog[] = [];
    let nextPageToken: string | undefined;

    while (true) {
      const response = await this.searchIssues(jql, nextPageToken);
      all.push(...(response.issues as JiraIssueWithChangelog[]));
      console.log(`  fetched ${all.length} issues...`);

      if (response.isLast || !response.nextPageToken) break;
      nextPageToken = response.nextPageToken;
    }

    return all;
  }

  async getBoards(): Promise<JiraBoard[]> {
    const all: JiraBoard[] = [];
    let startAt = 0;

    while (true) {
      const params = new URLSearchParams({
        startAt: String(startAt),
        maxResults: "50",
      });
      const response = await this.request<JiraBoardsResponse>(
        `/rest/agile/1.0/board?${params.toString()}`,
      );
      all.push(...response.values);

      if (response.isLast) break;
      startAt += response.maxResults;
    }

    return all;
  }

  async getBoardsForProject(projectKey: string): Promise<JiraBoard[]> {
    const params = new URLSearchParams({
      projectKeyOrId: projectKey,
      maxResults: "10",
    });
    const response = await this.request<JiraBoardsResponse>(
      `/rest/agile/1.0/board?${params.toString()}`,
    );
    return response.values;
  }

  async getSprints(boardId: string): Promise<JiraSprint[]> {
    const all: JiraSprint[] = [];
    let startAt = 0;

    while (true) {
      const params = new URLSearchParams({
        startAt: String(startAt),
        maxResults: "50",
      });
      const response = await this.request<JiraSprintsResponse>(
        `/rest/agile/1.0/board/${boardId}/sprint?${params.toString()}`,
      );
      all.push(...response.values);

      if (response.isLast) break;
      startAt += response.maxResults;
    }

    return all;
  }

  async getProjects(): Promise<JiraProject[]> {
    return this.request<JiraProject[]>(`/rest/api/3/project`);
  }

  async getFields(): Promise<JiraField[]> {
    return this.request<JiraField[]>(`/rest/api/3/field`);
  }

  async getProjectStatuses(projectKey: string): Promise<string[]> {
    const data = await this.request<JiraIssueTypeWithStatuses[]>(
      `/rest/api/3/project/${projectKey}/statuses`,
    );
    const names = new Set<string>();
    for (const issueType of data) {
      for (const status of issueType.statuses) {
        names.add(status.name);
      }
    }
    return [...names];
  }

  private async request<T>(path: string): Promise<T> {
    return this.fetchWithRetry<T>(path, "GET");
  }

  private async requestPost<T>(path: string, body: unknown): Promise<T> {
    return this.fetchWithRetry<T>(path, "POST", body);
  }

  private async fetchWithRetry<T>(
    path: string,
    method: string,
    body?: unknown,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: this.headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const delay = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : BASE_DELAY_MS * Math.pow(2, attempt);
          await this.sleep(delay);
          continue;
        }

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`JIRA API error ${response.status}: ${text}`);
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error as Error;

        if (attempt < MAX_RETRIES - 1) {
          await this.sleep(BASE_DELAY_MS * Math.pow(2, attempt));
        }
      }
    }

    throw lastError ?? new Error("JIRA request failed after retries");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function createJiraClient(): JiraClient {
  const host = process.env.JIRA_HOST;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  if (!host || !email || !token) {
    throw new Error(
      "Missing JIRA configuration: JIRA_HOST, JIRA_EMAIL, JIRA_API_TOKEN",
    );
  }

  return new JiraClient({ host, email, token });
}
