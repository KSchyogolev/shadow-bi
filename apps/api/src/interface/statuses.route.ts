import { Elysia, t } from "elysia";
import { statusRepo } from "../infrastructure/repositories/status.repo";
import type { FlowPhase } from "../domain/flow/flow.types";

const phaseValues = ["Queue", "Active", "Done", "Rework"] as const;

export const statusesRoute = new Elysia({ prefix: "/api/statuses" })
  .get(
    "/",
    async ({ query }) => {
      return statusRepo.findByProject(query.project);
    },
    {
      query: t.Object({ project: t.String() }),
    },
  )
  .patch(
    "/:id",
    async ({ params, body, set }) => {
      const updated = await statusRepo.updatePhase(
        Number(params.id),
        body.phase as FlowPhase,
      );
      if (!updated) {
        set.status = 404;
        return { error: "Status not found" };
      }
      return updated;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ phase: t.Union(phaseValues.map((v) => t.Literal(v))) }),
    },
  )
  .patch(
    "/:id/track",
    async ({ params, body, set }) => {
      const updated = await statusRepo.updateInCycle(
        Number(params.id),
        body.inCycle,
      );
      if (!updated) {
        set.status = 404;
        return { error: "Status not found" };
      }
      return updated;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ inCycle: t.Boolean() }),
    },
  )
  .put(
    "/reorder",
    async ({ body }) => {
      await statusRepo.reorder(body.orderedIds);
      return { ok: true };
    },
    {
      body: t.Object({ orderedIds: t.Array(t.Number()) }),
    },
  );
