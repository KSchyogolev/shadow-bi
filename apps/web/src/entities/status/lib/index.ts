import type { Phase } from "@jira-board/shared";

const PHASE_COLORS: Record<Phase, string> = {
  Queue: "bg-amber-500",
  Active: "bg-blue-500",
  Done: "bg-emerald-500",
  Rework: "bg-rose-500",
};

export function phaseColor(phase: Phase): string {
  return PHASE_COLORS[phase];
}

export const PHASES: Phase[] = ["Queue", "Active", "Done", "Rework"];
