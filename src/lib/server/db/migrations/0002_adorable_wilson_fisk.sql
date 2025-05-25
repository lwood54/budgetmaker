-- Delete existing budgets since they can't have a userId
DELETE FROM budgets;

-- Drop the existing table
DROP TABLE budgets;

-- Recreate with the new schema
CREATE TABLE `budgets` (
	`uuid` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`uuid`) ON DELETE CASCADE
);