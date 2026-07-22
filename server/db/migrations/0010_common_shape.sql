ALTER TABLE `studio_variants` ADD `thumbnail_url` text;--> statement-breakpoint
ALTER TABLE `studio_variants` ADD `image_mime_type` text;--> statement-breakpoint
ALTER TABLE `studio_variants` ADD `image_file_size` integer;--> statement-breakpoint
ALTER TABLE `studio_variants` ADD `image_width` integer;--> statement-breakpoint
ALTER TABLE `studio_variants` ADD `image_height` integer;--> statement-breakpoint
ALTER TABLE `studio_variants` ADD `image_hash` text;--> statement-breakpoint
CREATE INDEX `studio_variants_image_hash_index` ON `studio_variants` (`image_hash`);