import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { IssueFilters } from "@jira-board/shared";

export function useIssues(filters: Partial<IssueFilters> = {}) {
  return useQuery({
    queryKey: ["issues", filters],
    queryFn: () => api.issues.list(filters),
  });
}

export function useIssue(key: string) {
  return useQuery({
    queryKey: ["issue", key],
    queryFn: () => api.issues.getByKey(key),
    enabled: !!key,
  });
}

export function useIssueTransitions(key: string) {
  return useQuery({
    queryKey: ["issue", key, "transitions"],
    queryFn: () => api.issues.transitions(key),
    enabled: !!key,
  });
}
