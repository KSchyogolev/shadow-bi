export type FlowPhase = "Queue" | "Active" | "Done" | "Rework";

export type StatusTransition = {
  issueKey: string;
  fromStatus: string | null;
  toStatus: string;
  changedAt: Date;
  author: string | null;
};

export type FlowFields = {
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
