import type { MemberRole } from "@jira-board/shared";

const ROLE_COLORS: Record<MemberRole, string> = {
  DEV: "bg-blue-500",
  QA: "bg-emerald-500",
  "-": "bg-zinc-400",
};

const ROLE_LABELS: Record<MemberRole, string> = {
  DEV: "DEV",
  QA: "QA",
  "-": "None",
};

export function roleColor(role: MemberRole): string {
  return ROLE_COLORS[role];
}

export function roleLabel(role: MemberRole): string {
  return ROLE_LABELS[role];
}

export const ROLES: MemberRole[] = ["DEV", "QA", "-"];
