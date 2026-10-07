CREATE TABLE "education_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"degree" text NOT NULL,
	"school" text NOT NULL,
	"period" text NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"degree_en" text,
	"description_en" text
);
--> statement-breakpoint
CREATE TABLE "experiences" (
	"id" text PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"company" text NOT NULL,
	"period" text NOT NULL,
	"stack" jsonb NOT NULL,
	"bullets" jsonb NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"role_en" text,
	"bullets_en" jsonb
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_info" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"taglines" jsonb NOT NULL,
	"bio" text NOT NULL,
	"location" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"github" text NOT NULL,
	"linkedin" text NOT NULL,
	"cv_url" text DEFAULT '' NOT NULL,
	"profile_photo" text NOT NULL,
	"available" boolean NOT NULL,
	"stats" jsonb NOT NULL,
	"title_en" text,
	"taglines_en" jsonb,
	"bio_en" text,
	"location_en" text,
	"stats_en" jsonb
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"stack" jsonb NOT NULL,
	"type" text NOT NULL,
	"year" text NOT NULL,
	"live_url" text,
	"github_url" text,
	"highlights" jsonb NOT NULL,
	"featured" boolean NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"title_en" text,
	"description_en" text,
	"highlights_en" jsonb
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY NOT NULL,
	"last_updated" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"level" text,
	"position" integer DEFAULT 0 NOT NULL
);
