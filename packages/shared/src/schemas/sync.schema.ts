import { z } from "zod";

export const syncStatusSchema = z.object({
  id: z.number(),
  startedAt: z.coerce.date(),
  finishedAt: z.coerce.date().nullable(),
  status: z.enum(["running", "success", "error"]),
  issuesSynced: z.number(),
  error: z.string().nullable(),
});

export type SyncStatus = z.infer<typeof syncStatusSchema>;
