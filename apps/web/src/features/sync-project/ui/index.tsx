import { useJiraProjects, useProjects } from "@/entities/project";
import { formatDateTime, formatRelative } from "@/shared/lib/format";
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    StatusRow,
} from "@/shared/ui";
import { Combobox } from "@/shared/ui/combobox";
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Loader2,
    RefreshCw,
} from "lucide-react";
import { useSyncProject } from "../api";

interface ProjectSyncCardProps {
  selectedKey: string;
  onProjectChange: (key: string, name: string) => void;
}

export function ProjectSyncCard({
  selectedKey,
  onProjectChange,
}: ProjectSyncCardProps) {
  const { data: jiraProjects, isLoading: loadingJira } = useJiraProjects();
  const { data: dbProjects } = useProjects();
  const syncMutation = useSyncProject();

  const selectedDbProject = dbProjects?.find((p) => p.key === selectedKey);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Sync</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Select project
          </label>
          <Combobox
            options={
              jiraProjects?.map((p) => ({
                value: p.key,
                label: `${p.name} (${p.key})`,
              })) ?? []
            }
            value={selectedKey}
            onValueChange={(key) => {
              syncMutation.reset();
              const project = jiraProjects?.find((p) => p.key === key);
              if (project) onProjectChange(project.key, project.name);
            }}
            placeholder={loadingJira ? "Loading projects…" : "Choose a project"}
            searchPlaceholder="Search projects…"
            emptyText="No projects found."
            disabled={loadingJira || syncMutation.isPending}
          />
        </div>

        {selectedKey && selectedDbProject?.lastSync && (
          <StatusRow icon={Clock} variant="muted">
            Last synced{" "}
            <span className="font-medium text-foreground">
              {formatRelative(selectedDbProject.lastSync)}
            </span>
            {" · "}
            {formatDateTime(selectedDbProject.lastSync)}
          </StatusRow>
        )}

        {selectedKey &&
          !selectedDbProject?.lastSync &&
          !syncMutation.isPending && (
            <StatusRow icon={Clock} variant="muted">
              This project has never been synced
            </StatusRow>
          )}

        {syncMutation.isPending && (
          <StatusRow icon={Loader2} variant="loading">
            <div>
              <p className="text-sm font-medium text-foreground">
                Syncing project…
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Fetching issues, sprints and metadata from Jira
              </p>
            </div>
          </StatusRow>
        )}

        {selectedKey && (
          <Button
            onClick={() => syncMutation.mutate(selectedKey)}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RefreshCw />
            )}
            {syncMutation.isPending ? "Syncing…" : "Sync Project"}
          </Button>
        )}

        {syncMutation.isSuccess && (
          <StatusRow icon={CheckCircle2} variant="success">
            Synced {syncMutation.data.issues} issues successfully
          </StatusRow>
        )}

        {syncMutation.isError && (
          <StatusRow icon={AlertCircle} variant="error">
            Failed to sync. Please try again.
          </StatusRow>
        )}
      </CardContent>
    </Card>
  );
}
