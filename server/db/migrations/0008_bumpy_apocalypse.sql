CREATE TABLE `creative_styles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`reference_image_path` text,
	`position` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `creative_styles_name_unique` ON `creative_styles` (`name`);--> statement-breakpoint
ALTER TABLE `studio_concepts` ADD `creative_style_id` integer REFERENCES creative_styles(id);--> statement-breakpoint
ALTER TABLE `studio_concepts` ADD `creative_style_name` text;