import { useState } from "react";
import { useProjects, useProjectStore } from "@/entities/project";
import { ProjectSyncCard } from "@/features/sync-project";
import { StatusPhaseMappingCard } from "@/features/map-status-phase";
import { TeamMappingCard } from "@/features/map-member-role";
import { PageHeader } from "@/shared/ui";

export function SettingsPanel() {
  const { selectedProject, setSelectedProject } = useProjectStore();
  const [selectedKey, setSelectedKey] = useState(selectedProject?.key ?? "");

  const { data: dbProjects } = useProjects();
  const selectedDbProject = dbProjects?.find((p) => p.key === selectedKey);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage project data synchronization"
      />
      <div className="max-w-xl">
        <ProjectSyncCard
          selectedKey={selectedKey}
          onProjectChange={(key, name) => {
            setSelectedKey(key);
            setSelectedProject({ key, name });
          }}
        />
      </div>
      {selectedKey && selectedDbProject?.lastSync && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <StatusPhaseMappingCard projectKey={selectedKey} />
          <TeamMappingCard projectKey={selectedKey} />
        </div>
      )}
    </div>
  );
}
