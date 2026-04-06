PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_assets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`original_file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`hash` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`brand_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_assets`("id", "name", "original_file_name", "file_path", "mime_type", "file_size", "hash", "description", "tags", "brand_id", "created_at", "updated_at") SELECT "id", "name", "original_file_name", "file_path", "mime_type", "file_size", "hash", "description", "tags", "brand_id", "created_at", "updated_at" FROM `assets`;--> statement-breakpoint
DROP TABLE `assets`;--> statement-breakpoint
ALTER TABLE `__new_assets` RENAME TO `assets`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `assets_hash_unique` ON `assets` (`hash`);--> statement-breakpoint
ALTER TABLE `brands` ADD `default_style_guide_id` integer;