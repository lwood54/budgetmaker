CREATE TABLE `budgets` (
	`uuid` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`uuid`) ON UPDATE no action ON DELETE cascade
);
