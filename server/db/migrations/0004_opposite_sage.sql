DROP INDEX `style_guides_brand_id_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `style_guides_name_brand_unique` ON `style_guides` (`name`,`brand_id`);