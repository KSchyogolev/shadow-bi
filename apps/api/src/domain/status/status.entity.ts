import type { FlowPhase } from "../flow/flow.types";

export type StatusMapping = {
  id: number;
  name: string;
  projectKey: string;
  phase: FlowPhase;
  inCycle: boolean;
  order: number;
};
