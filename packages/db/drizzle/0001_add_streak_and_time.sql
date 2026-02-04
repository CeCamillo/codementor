-- Add streak and time tracking fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "total_minutes_learned" integer DEFAULT 0 NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "current_streak" integer DEFAULT 0 NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "longest_streak" integer DEFAULT 0 NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_active_date" timestamp with time zone;