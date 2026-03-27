import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { Phase, Status } from "@jira-board/shared";

export function useStatuses(projectKey: string | undefined) {
  return useQuery({
    queryKey: ["statuses", projectKey],
    queryFn: () => api.statuses.list(projectKey!),
    enabled: !!projectKey,
  });
}

export function useUpdateStatusPhase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, phase }: { id: number; phase: Phase }) =>
      api.statuses.updatePhase(id, phase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
    },
  });
}

export function useUpdateStatusInCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, inCycle }: { id: number; inCycle: boolean }) =>
      api.statuses.updateInCycle(id, inCycle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
      queryClient.invalidateQueries({ queryKey: ["metrics", "time-in-status"] });
    },
  });
}

export function useReorderStatuses(projectKey: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: number[]) => api.statuses.reorder(orderedIds),
    onMutate: (orderedIds) => {
      queryClient.cancelQueries({ queryKey: ["statuses", projectKey] });
      const previous = queryClient.getQueryData<Status[]>(["statuses", projectKey]);

      if (previous) {
        const byId = new Map(previous.map((s) => [s.id, s]));
        queryClient.setQueryData<Status[]>(
          ["statuses", projectKey],
          orderedIds.map((id, i) => {
            const s = byId.get(id)!;
            return { ...s, order: i };
          }),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["statuses", projectKey], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses", projectKey] });
      queryClient.invalidateQueries({ queryKey: ["metrics", "time-in-status"] });
    },
  });
}
