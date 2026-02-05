CREATE TABLE "user_task_hints" (
	"user_id" text NOT NULL,
	"task_id" text NOT NULL,
	"hint_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_task_hints_user_id_task_id_unique" UNIQUE("user_id","task_id")
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "reflection_questions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "reflection_responses" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "user_task_hints" ADD CONSTRAINT "user_task_hints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_task_hints" ADD CONSTRAINT "user_task_hints_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_task_hints_user_id_idx" ON "user_task_hints" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_task_hints_task_id_idx" ON "user_task_hints" USING btree ("task_id");