import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";

export function useSprints(projectKey?: string) {
  return useQuery({
    queryKey: ["sprints", projectKey],
    queryFn: () => api.sprints.list(projectKey ? { projectKey } : undefined),
    enabled: !!projectKey,
  });
}

export function useSprint(id: string) {
  return useQuery({
    queryKey: ["sprint", id],
    queryFn: () => api.sprints.getById(id),
    enabled: !!id,
  });
}

export function useSprintBurndown(id: string) {
  return useQuery({
    queryKey: ["sprint", id, "burndown"],
    queryFn: () => api.sprints.burndown(id),
    enabled: !!id,
  });
}

export function useSprintStats(id: string) {
  return useQuery({
    queryKey: ["sprint", id, "stats"],
    queryFn: () => api.sprints.stats(id),
    enabled: !!id,
  });
}

type Params = Record<string, string | number | boolean | undefined>;

export function useVelocity(params: Params, enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "velocity", params],
    queryFn: () => api.dashboard.velocity(params),
    enabled,
  });
}
