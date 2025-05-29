CREATE TABLE `budget_items` (
	`amount` integer NOT NULL,
	`budget_id` text NOT NULL,
	`category_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`purchase_date` text NOT NULL,
	`uuid` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`uuid`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`budget_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`name` text NOT NULL,
	`limit` integer NOT NULL,
	`uuid` text PRIMARY KEY NOT NULL,
	FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`uuid`) ON UPDATE no action ON DELETE cascade
);
