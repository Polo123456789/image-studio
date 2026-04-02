CREATE TABLE `studio_concept_formats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`concept_id` integer NOT NULL,
	`ratio` text NOT NULL,
	`is_preview_source` integer DEFAULT false NOT NULL,
	`prompt_draft` text NOT NULL,
	`active_variant_key` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`concept_id`) REFERENCES `studio_concepts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `studio_concept_formats_concept_id_ratio_unique` ON `studio_concept_formats` (`concept_id`,`ratio`);--> statement-breakpoint
CREATE TABLE `studio_concepts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`concept_key` text NOT NULL,
	`title` text NOT NULL,
	`subtitle` text NOT NULL,
	`rationale` text NOT NULL,
	`selected_ratio` text NOT NULL,
	`approved_at` integer,
	`position` integer NOT NULL,
	`discarded_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `studio_projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `studio_concepts_project_id_concept_key_unique` ON `studio_concepts` (`project_id`,`concept_key`);--> statement-breakpoint
CREATE TABLE `studio_projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`project_name` text NOT NULL,
	`brief` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `studio_projects_slug_unique` ON `studio_projects` (`slug`);--> statement-breakpoint
CREATE TABLE `studio_variants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`format_id` integer NOT NULL,
	`variant_key` text NOT NULL,
	`label` text NOT NULL,
	`mode` text NOT NULL,
	`prompt` text NOT NULL,
	`image_url` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`format_id`) REFERENCES `studio_concept_formats`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `studio_variants_format_id_variant_key_unique` ON `studio_variants` (`format_id`,`variant_key`);