ALTER TABLE "issues" ADD COLUMN "sprint_ids" text[] DEFAULT '{}';
--> statement-breakpoint
UPDATE "issues" SET "sprint_ids" = ARRAY["sprint_id"] WHERE "sprint_id" IS NOT NULL;
--> statement-breakpoint
UPDATE "issues" SET "sprint_ids" = '{}' WHERE "sprint_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "issues" DROP COLUMN "sprint_id";
