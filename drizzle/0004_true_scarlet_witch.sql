CREATE TABLE `follows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`follower_id` integer NOT NULL,
	`following_id` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`following_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `follower_following_idx` ON `follows` (`follower_id`,`following_id`);--> statement-breakpoint
ALTER TABLE `users` ADD `teaching_experience` text;--> statement-breakpoint
ALTER TABLE `users` ADD `skills` text;--> statement-breakpoint
ALTER TABLE `users` ADD `teaching_subjects` text;