export type JiraConfig = {
  host: string;
  email: string;
  token: string;
};

export type JiraIssueFields = {
  summary: string;
  status: { name: string };
  priority: { name: string } | null;
  issuetype: { name: string };
  assignee: { displayName: string } | null;
  reporter: { displayName: string } | null;
  project: { key: string };
  labels: string[];
  created: string;
  updated: string;
  resolutiondate: string | null;
  statuscategorychangedate: string | null;
  customfield_10016: number | null; // story points
  sprint: JiraSprintField | null;
  customfield_10020: JiraSprintField[] | null;
  [key: `customfield_${string}`]: unknown;
};

export type JiraSprintField = {
  id: number;
  name: string;
  state: string;
  boardId?: number;
};

export type JiraIssue = {
  id: string;
  key: string;
  fields: JiraIssueFields;
};

export type JiraSearchResponse = {
  issues: JiraIssue[];
  nextPageToken?: string;
  isLast?: boolean;
};

export type JiraSprint = {
  id: number;
  name: string;
  state: string;
  startDate: string | null;
  endDate: string | null;
};

export type JiraBoard = {
  id: number;
  name: string;
  type: string;
};

export type JiraBoardsResponse = {
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: JiraBoard[];
};

export type JiraSprintsResponse = {
  maxResults: number;
  startAt: number;
  isLast: boolean;
  values: JiraSprint[];
};

export type JiraProject = {
  id: string;
  key: string;
  name: string;
  lead?: { displayName: string };
};

export type JiraChangelogItem = {
  field: string;
  fromString: string | null;
  toString: string;
};

export type JiraChangelogHistory = {
  id: string;
  created: string;
  author: { displayName: string };
  items: JiraChangelogItem[];
};

export type JiraChangelog = {
  histories: JiraChangelogHistory[];
};

export type JiraIssueWithChangelog = JiraIssue & {
  changelog?: JiraChangelog;
};

export type JiraField = {
  id: string;
  name: string;
  custom: boolean;
  schema?: { type: string; custom?: string };
};

export type JiraStatusCategory = {
  id: number;
  key: string;
  name: string;
};

export type JiraStatus = {
  id: string;
  name: string;
  statusCategory: JiraStatusCategory;
};

export type JiraIssueTypeWithStatuses = {
  id: string;
  name: string;
  statuses: JiraStatus[];
};
