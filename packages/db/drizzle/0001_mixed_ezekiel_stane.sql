ALTER TABLE "user_preferences" ADD COLUMN "last_activity_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "current_streak" integer DEFAULT 0 NOT NULL;