export type MemberRole = "DEV" | "QA" | "-";

export type ProjectMember = {
  id: number;
  displayName: string;
  projectKey: string;
  role: MemberRole;
};
