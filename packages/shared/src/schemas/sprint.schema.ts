import { z } from "zod";

export const sprintStateSchema = z.enum(["active", "closed", "future"]);

export const sprintSchema = z.object({
  id: z.string(),
  name: z.string(),
  state: sprintStateSchema,
  startDate: z.coerce.date().nullable(),
  endDate: z.coerce.date().nullable(),
  boardId: z.string(),
  projectKey: z.string(),
});

export type Sprint = z.infer<typeof sprintSchema>;

export const burndownPointSchema = z.object({
  date: z.string(),
  remaining: z.number(),
  ideal: z.number(),
});

export type BurndownPoint = z.infer<typeof burndownPointSchema>;

export const sprintStatsSchema = z.object({
  committedSp: z.number(),
  newSp: z.number(),
  carryOverSp: z.number(),
  addedSp: z.number(),
  completedSp: z.number(),
  remainingSp: z.number(),
  totalTasks: z.number(),
  doneTasks: z.number(),
});

export type SprintStats = z.infer<typeof sprintStatsSchema>;
