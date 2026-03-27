import { z } from "zod";

export const memberRoleSchema = z.enum(["DEV", "QA", "-"]);

export type MemberRole = z.infer<typeof memberRoleSchema>;

export const projectMemberSchema = z.object({
  id: z.number(),
  displayName: z.string(),
  projectKey: z.string(),
  role: memberRoleSchema,
});

export type ProjectMember = z.infer<typeof projectMemberSchema>;

export const updateMemberRoleSchema = z.object({
  role: memberRoleSchema,
});

export type UpdateMemberRole = z.infer<typeof updateMemberRoleSchema>;
