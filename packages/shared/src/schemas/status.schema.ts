import { z } from "zod";

export const phaseSchema = z.enum(["Queue", "Active", "Done", "Rework"]);

export type Phase = z.infer<typeof phaseSchema>;

export const statusSchema = z.object({
  id: z.number(),
  name: z.string(),
  projectKey: z.string(),
  phase: phaseSchema,
  inCycle: z.boolean(),
  order: z.number(),
});

export type Status = z.infer<typeof statusSchema>;

export const updateStatusPhaseSchema = z.object({
  phase: phaseSchema,
});

export type UpdateStatusPhase = z.infer<typeof updateStatusPhaseSchema>;

export const updateStatusInCycleSchema = z.object({
  inCycle: z.boolean(),
});

export type UpdateStatusInCycle = z.infer<typeof updateStatusInCycleSchema>;

export const reorderStatusesSchema = z.object({
  orderedIds: z.array(z.number()),
});

export type ReorderStatuses = z.infer<typeof reorderStatusesSchema>;
