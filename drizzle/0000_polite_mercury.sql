CREATE TYPE "public"."task_status" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."task_type" AS ENUM('GENERATE_SCRIPT', 'GENERATE_SCENES', 'GENERATE_VOICEOVER', 'GENERATE_IMAGES', 'GENERATE_CAPTIONS', 'STITCH_VIDEO');--> statement-breakpoint
CREATE TYPE "public"."video_status" AS ENUM('PENDING', 'GENERATING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"idToken" text,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scene" (
	"id" text PRIMARY KEY NOT NULL,
	"sceneIndex" integer NOT NULL,
	"imagePrompt" text,
	"imageUrl" text,
	"videoId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "series" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"theme" text,
	"voiceId" text,
	"captionStyle" jsonb,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"token" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "task_type" NOT NULL,
	"status" "task_status" DEFAULT 'PENDING' NOT NULL,
	"error" text,
	"startedAt" timestamp,
	"completedAt" timestamp,
	"videoId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video" (
	"id" text PRIMARY KEY NOT NULL,
	"theme" text NOT NULL,
	"status" "video_status" DEFAULT 'PENDING' NOT NULL,
	"title" text,
	"script" text,
	"voiceOverUrl" text,
	"videoUrl" text,
	"captions" jsonb,
	"userId" text NOT NULL,
	"seriesId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene" ADD CONSTRAINT "scene_videoId_video_id_fk" FOREIGN KEY ("videoId") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "series" ADD CONSTRAINT "series_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_videoId_video_id_fk" FOREIGN KEY ("videoId") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video" ADD CONSTRAINT "video_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video" ADD CONSTRAINT "video_seriesId_series_id_fk" FOREIGN KEY ("seriesId") REFERENCES "public"."series"("id") ON DELETE set null ON UPDATE no action;