export type SprintState = "active" | "closed" | "future";

export type Sprint = {
  id: string;
  name: string;
  state: SprintState;
  startDate: Date | null;
  endDate: Date | null;
  boardId: string;
  projectKey: string;
};
