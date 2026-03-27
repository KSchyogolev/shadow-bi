import type { FlowPhase } from "../flow/flow.types";

export type Issue = {
  id: string;
  key: string;
  summary: string;
  status: string;
  priority: string;
  type: string;
  assignee: string | null;
  reporter: string;
  projectKey: string;
  sprintIds: string[];
  storyPoints: number | null;
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;

  flowPhase: FlowPhase | null;
  actualStart: Date | null;
  actualEnd: Date | null;
  lastEnteredActive: Date | null;
  lastEnteredQueue: Date | null;
  activeTimeMin: number;
  queueTimeMin: number;
  reworkCount: number;
  reworkWaitMin: number;
  cycleTimeMin: number;
};
