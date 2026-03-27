import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api";
import type { MemberRole } from "@jira-board/shared";

export function useMembers(projectKey: string | undefined) {
  return useQuery({
    queryKey: ["members", projectKey],
    queryFn: () => api.members.list(projectKey!),
    enabled: !!projectKey,
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: MemberRole }) =>
      api.members.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}
