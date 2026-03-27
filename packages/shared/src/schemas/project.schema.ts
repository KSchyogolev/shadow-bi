import { z } from "zod";

export const projectSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  lead: z.string().nullable(),
  lastSync: z.string().datetime().nullable(),
});

export type Project = z.infer<typeof projectSchema>;

export const jiraProjectSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  lead: z.string().nullable(),
});

export type JiraProject = z.infer<typeof jiraProjectSchema>;
