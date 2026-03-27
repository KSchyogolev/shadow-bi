import type { FlowPhase } from "./flow.types";

export const STATUS_FLOW_MAP: Record<string, FlowPhase> = {
  "Open": "Queue",
  "Blocked": "Queue",
  "In Progress": "Active",
  "Need Rework": "Rework",
  "Review and Build": "Active",
  "Ready For Test": "Queue",
  "Testing": "Active",
  "Ready To Merge": "Queue",
  "Ready to RC": "Queue",
  "In RC": "Active",
  "Done": "Done",
  "Canceled": "Done",
};
