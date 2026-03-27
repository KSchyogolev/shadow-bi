import { api } from "@/shared/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useSyncProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (key: string) => api.sync.project(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
