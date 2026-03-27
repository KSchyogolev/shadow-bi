import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useProjectStore } from "@/entities/project";

export type FiltersState = {
  sprintIds: string[];
  dateFrom: string;
  dateTo: string;
  assignees: string[];
  issueTypes: string[];
  priorities: string[];
  labels: string[];
};

type FiltersActions = {
  setSprintIds: (ids: string[]) => void;
  setDateRange: (from: string, to: string) => void;
  setAssignees: (assignees: string[]) => void;
  setIssueTypes: (types: string[]) => void;
  setPriorities: (priorities: string[]) => void;
  setLabels: (labels: string[]) => void;
  resetFilters: () => void;
};

const initialState: FiltersState = {
  sprintIds: [],
  dateFrom: "",
  dateTo: "",
  assignees: [],
  issueTypes: [],
  priorities: [],
  labels: [],
};

export const useFiltersStore = create<FiltersState & FiltersActions>()(
  persist(
    (set) => ({
      ...initialState,
      setSprintIds: (sprintIds) => set({ sprintIds }),
      setDateRange: (dateFrom, dateTo) => set({ dateFrom, dateTo }),
      setAssignees: (assignees) => set({ assignees }),
      setIssueTypes: (issueTypes) => set({ issueTypes }),
      setPriorities: (priorities) => set({ priorities }),
      setLabels: (labels) => set({ labels }),
      resetFilters: () => set(initialState),
    }),
    { name: "jira-bi:filters" },
  ),
);

export function buildMetricsParams(
  projectKey: string,
  filters: FiltersState,
): Record<string, string | undefined> {
  return {
    projectKey: projectKey || undefined,
    sprintId: filters.sprintIds.length ? filters.sprintIds.join(",") : undefined,
    assignee: filters.assignees.length ? filters.assignees.join(",") : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    issueType: filters.issueTypes.length ? filters.issueTypes.join(",") : undefined,
    priority: filters.priorities.length ? filters.priorities.join(",") : undefined,
    labels: filters.labels.length ? filters.labels.join(",") : undefined,
  };
}

export function buildIssueQueryParams(
  filters: FiltersState,
): Record<string, string | undefined> {
  return {
    sprint: filters.sprintIds.length
      ? filters.sprintIds.join(",")
      : undefined,
    assignee: filters.assignees.length
      ? filters.assignees.join(",")
      : undefined,
    type: filters.issueTypes.length
      ? filters.issueTypes.join(",")
      : undefined,
    priority: filters.priorities.length
      ? filters.priorities.join(",")
      : undefined,
    labels: filters.labels.length ? filters.labels.join(",") : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  };
}

export function useMetricsParams() {
  const projectKey = useProjectStore((s) => s.selectedProject?.key ?? "");
  const filters = useFiltersStore();

  return {
    params: buildMetricsParams(projectKey, filters),
    hasProject: !!projectKey,
  };
}

export function buildSprintChartParams(
  projectKey: string,
  filters: FiltersState,
): Record<string, string | undefined> {
  return {
    projectKey: projectKey || undefined,
    assignee: filters.assignees.length ? filters.assignees.join(",") : undefined,
    issueType: filters.issueTypes.length ? filters.issueTypes.join(",") : undefined,
    priority: filters.priorities.length ? filters.priorities.join(",") : undefined,
    labels: filters.labels.length ? filters.labels.join(",") : undefined,
  };
}

export function useSprintChartParams() {
  const projectKey = useProjectStore((s) => s.selectedProject?.key ?? "");
  const filters = useFiltersStore();

  return {
    params: buildSprintChartParams(projectKey, filters),
    hasProject: !!projectKey,
  };
}
