import { create } from "zustand";
import { persist } from "zustand/middleware";

type SelectedProject = {
  key: string;
  name: string;
};

type ProjectStore = {
  selectedProject: SelectedProject | null;
  setSelectedProject: (project: SelectedProject | null) => void;
};

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      selectedProject: null,
      setSelectedProject: (project) => set({ selectedProject: project }),
    }),
    { name: "jira-bi:selected-project" },
  ),
);
