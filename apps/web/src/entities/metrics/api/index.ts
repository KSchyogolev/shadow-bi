import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";

type Params = Record<string, string | undefined>;

export function useCycleTime(params: Params, enabled = true) {
  return useQuery({
    queryKey: ["metrics", "cycle-time", params],
    queryFn: () => api.metrics.cycleTime(params),
    enabled,
  });
}

export function useCycleTimeBySprint(params: Params, enabled = true) {
  return useQuery({
    queryKey: ["metrics", "cycle-time-by-sprint", params],
    queryFn: () => api.metrics.cycleTimeBySprint(params),
    enabled,
  });
}

export function useLeadTime(params: Params, enabled = true) {
  return useQuery({
    queryKey: ["metrics", "lead-time", params],
    queryFn: () => api.metrics.leadTime(params),
    enabled,
  });
}

export function useTimeInStatus(params: Params, enabled = true) {
  return useQuery({
    queryKey: ["metrics", "time-in-status", params],
    queryFn: () => api.metrics.timeInStatus(params),
    enabled,
  });
}

export function useThroughput(params: Params, enabled = true) {
  return useQuery({
    queryKey: ["metrics", "throughput", params],
    queryFn: () => api.metrics.throughput(params),
    enabled,
  });
}

export function useRework(params: Params, enabled = true) {
  return useQuery({
    queryKey: ["metrics", "rework", params],
    queryFn: () => api.metrics.rework(params),
    enabled,
  });
}

export function useFlowEfficiency(params: Params, enabled = true) {
  return useQuery({
    queryKey: ["metrics", "flow-efficiency", params],
    queryFn: () => api.metrics.flowEfficiency(params),
    enabled,
  });
}

export function useHoursPerSp(params: Params, enabled = true) {
  return useQuery({
    queryKey: ["metrics", "hours-per-sp", params],
    queryFn: () => api.metrics.hoursPerSp(params),
    enabled,
  });
}
