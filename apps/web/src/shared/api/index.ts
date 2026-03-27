import { http } from "./client";
import type {
  Issue,
  IssueFilters,
  StatusTransition,
  Sprint,
  BurndownPoint,
  SprintStats,
  Project,
  JiraProject,
  DashboardSummary,
  VelocityPoint,
  CycleTime,
  CycleTimePoint,
  CycleTimeBySprintPoint,
  LeadTimePoint,
  TimeInStatusPoint,
  ThroughputPoint,
  ReworkPoint,
  FlowEfficiencyPoint,
  HoursPerSpPoint,
  AssigneePerformance,
  AssigneeTrendPoint,
  AssigneeSprintMetric,
  Status,
  Phase,
  ProjectMember,
  MemberRole,
} from "@jira-board/shared";

export { ApiError } from "./client";

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

type Params = Record<string, string | number | boolean | undefined>;

export const api = {
  issues: {
    list: (filters?: Partial<IssueFilters>) =>
      http.get<PaginatedResponse<Issue>>("/issues", filters as Params),

    getByKey: (key: string) => http.get<Issue>(`/issues/${key}`),

    transitions: (key: string) =>
      http.get<StatusTransition[]>(`/issues/${key}/transitions`),

    stats: () => http.get<DashboardSummary>("/issues/stats"),
  },

  sprints: {
    list: (params?: { projectKey?: string }) =>
      http.get<PaginatedResponse<Sprint>>("/sprints", params),

    getById: (id: string) =>
      http.get<Sprint & { issues: Issue[] }>(`/sprints/${id}`),

    burndown: (id: string) =>
      http.get<BurndownPoint[]>(`/sprints/${id}/burndown`),

    stats: (id: string) =>
      http.get<SprintStats>(`/sprints/${id}/stats`),
  },

  projects: {
    list: () => http.get<Project[]>("/projects"),
    listFromJira: () => http.get<JiraProject[]>("/projects/jira"),
  },

  dashboard: {
    summary: (params?: {
      project?: string;
      dateFrom?: string;
      dateTo?: string;
    }) => http.get<DashboardSummary>("/dashboard/summary", params),

    velocity: (params?: Params) =>
      http.get<VelocityPoint[]>("/dashboard/velocity", params),

    cycleTime: (params?: { project?: string }) =>
      http.get<CycleTime>("/dashboard/cycle-time", params),
  },

  metrics: {
    cycleTime: (params: Params) =>
      http.get<CycleTimePoint[]>("/metrics/cycle-time", params),

    cycleTimeBySprint: (params: Params) =>
      http.get<CycleTimeBySprintPoint[]>(
        "/metrics/cycle-time-by-sprint",
        params,
      ),

    leadTime: (params: Params) =>
      http.get<LeadTimePoint[]>("/metrics/lead-time", params),

    timeInStatus: (params: Params) =>
      http.get<TimeInStatusPoint[]>("/metrics/time-in-status", params),

    throughput: (params: Params) =>
      http.get<ThroughputPoint[]>("/metrics/throughput", params),

    rework: (params: Params) =>
      http.get<ReworkPoint[]>("/metrics/rework", params),

    flowEfficiency: (params: Params) =>
      http.get<FlowEfficiencyPoint[]>("/metrics/flow-efficiency", params),

    hoursPerSp: (params: Params) =>
      http.get<HoursPerSpPoint[]>("/metrics/hours-per-sp", params),
  },

  team: {
    performance: (params: Params) =>
      http.get<AssigneePerformance[]>("/team/performance", params),

    trend: (params: Params) =>
      http.get<AssigneeTrendPoint[]>("/team/trend", params),

    sprintMetrics: (params: Params) =>
      http.get<AssigneeSprintMetric[]>("/team/sprint-metrics", params),
  },

  sync: {
    project: (key: string) =>
      http.post<{ issues: number }>(`/sync/project/${key}`),
    recalculate: (key: string) =>
      http.post<{ updated: number }>(`/sync/project/${key}/recalculate`),
  },

  members: {
    list: (project: string) =>
      http.get<ProjectMember[]>("/members", { project }),

    updateRole: (id: number, role: MemberRole) =>
      http.patch<ProjectMember>(`/members/${id}`, { role }),
  },

  jira: {
    host: () => http.get<{ host: string | null }>("/jira/host"),
  },

  statuses: {
    list: (project: string) =>
      http.get<Status[]>("/statuses", { project }),

    updatePhase: (id: number, phase: Phase) =>
      http.patch<Status>(`/statuses/${id}`, { phase }),

    updateInCycle: (id: number, inCycle: boolean) =>
      http.patch<Status>(`/statuses/${id}/track`, { inCycle }),

    reorder: (orderedIds: number[]) =>
      http.put<{ ok: boolean }>("/statuses/reorder", { orderedIds }),
  },
};
