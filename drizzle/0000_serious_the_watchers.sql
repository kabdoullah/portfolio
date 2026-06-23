CREATE TABLE `education_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`degree` text NOT NULL,
	`school` text NOT NULL,
	`period` text NOT NULL,
	`description` text,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `experiences` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`company` text NOT NULL,
	`period` text NOT NULL,
	`stack` text NOT NULL,
	`bullets` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `personal_info` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`title` text NOT NULL,
	`taglines` text NOT NULL,
	`bio` text NOT NULL,
	`location` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`github` text NOT NULL,
	`linkedin` text NOT NULL,
	`profile_photo` text NOT NULL,
	`available` integer NOT NULL,
	`stats` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`stack` text NOT NULL,
	`type` text NOT NULL,
	`year` text NOT NULL,
	`live_url` text,
	`github_url` text,
	`highlights` text NOT NULL,
	`featured` integer NOT NULL,
	`order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`last_updated` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`level` text,
	`position` integer DEFAULT 0 NOT NULL
);
