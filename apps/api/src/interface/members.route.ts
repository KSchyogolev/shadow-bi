import { Elysia, t } from "elysia";
import { memberRepo } from "../infrastructure/repositories/member.repo";
import type { MemberRole } from "../domain/member/member.entity";

const roleValues = ["DEV", "QA", "-"] as const;

export const membersRoute = new Elysia({ prefix: "/api/members" })
  .get(
    "/",
    async ({ query }) => {
      return memberRepo.findByProject(query.project);
    },
    {
      query: t.Object({ project: t.String() }),
    },
  )
  .patch(
    "/:id",
    async ({ params, body, set }) => {
      const updated = await memberRepo.updateRole(
        Number(params.id),
        body.role as MemberRole,
      );
      if (!updated) {
        set.status = 404;
        return { error: "Member not found" };
      }
      return updated;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ role: t.Union(roleValues.map((v) => t.Literal(v))) }),
    },
  );
