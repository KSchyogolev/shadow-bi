import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => api.projects.list(),
  });
}

export function useJiraProjects() {
  return useQuery({
    queryKey: ["projects", "jira"],
    queryFn: () => api.projects.listFromJira(),
  });
}
