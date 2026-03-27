ALTER TABLE "statuses" RENAME COLUMN "track_time_in_status" TO "in_cycle";
ALTER TABLE "issues" ADD COLUMN "cycle_time_min" integer DEFAULT 0;
