CREATE TABLE "avatars" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"prompt" text NOT NULL,
	"image_url" text NOT NULL,
	"thumbnail_url" text,
	"style_id" text,
	"style_name" text,
	"dimensions" text NOT NULL,
	"quality" text NOT NULL,
	"job_id" text NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"enhanced_prompt" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "avatars_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
ALTER TABLE "avatars" ADD CONSTRAINT "avatars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;