CREATE TABLE "execution_results" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"test_id" text,
	"passed" text NOT NULL,
	"stdout" text,
	"stderr" text,
	"execution_time_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_tests" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"test_name" text NOT NULL,
	"test_code" text NOT NULL,
	"test_type" text NOT NULL,
	"expected_behavior" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "execution_results" ADD CONSTRAINT "execution_results_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_results" ADD CONSTRAINT "execution_results_test_id_task_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."task_tests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_tests" ADD CONSTRAINT "task_tests_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "execution_results_submission_id_idx" ON "execution_results" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "execution_results_test_id_idx" ON "execution_results" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "task_tests_task_id_idx" ON "task_tests" USING btree ("task_id");