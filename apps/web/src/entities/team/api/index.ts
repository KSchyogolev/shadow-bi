import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";

type Params = Record<string, string | undefined>;

export function useTeamPerformance(params: Params, enabled = true) {
  return useQuery({
    queryKey: ["team", "performance", params],
    queryFn: () => api.team.performance(params),
    enabled,
  });
}

export function useAssigneeTrend(params: Params, enabled = true) {
  return useQuery({
    queryKey: ["team", "trend", params],
    queryFn: () => api.team.trend(params),
    enabled,
  });
}

export function useAssigneeSprintMetrics(params: Params, enabled = true) {
  return useQuery({
    queryKey: ["team", "sprint-metrics", params],
    queryFn: () => api.team.sprintMetrics(params),
    enabled,
  });
}
