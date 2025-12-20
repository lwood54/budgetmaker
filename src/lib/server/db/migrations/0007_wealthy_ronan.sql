CREATE TABLE `group_items` (
	`uuid` text PRIMARY KEY NOT NULL,
	`interval_id` text NOT NULL,
	`section_name` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`amount` integer NOT NULL,
	`is_paydown` integer DEFAULT false,
	`is_recurring` integer DEFAULT false,
	`initial_balance` integer,
	`interest_rate` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`interval_id`) REFERENCES `intervals`(`uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `interval_balances` (
	`uuid` text PRIMARY KEY NOT NULL,
	`interval_id` text NOT NULL,
	`group_item_id` text NOT NULL,
	`balance` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`interval_id`) REFERENCES `intervals`(`uuid`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`group_item_id`) REFERENCES `group_items`(`uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `interval_balances_interval_id_group_item_id_unique` ON `interval_balances` (`interval_id`,`group_item_id`);--> statement-breakpoint
CREATE TABLE `intervals` (
	`uuid` text PRIMARY KEY NOT NULL,
	`section_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projections` (
	`uuid` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`paydown_strategy` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sections` (
	`uuid` text PRIMARY KEY NOT NULL,
	`projection_id` text NOT NULL,
	`title` text NOT NULL,
	`order` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`projection_id`) REFERENCES `projections`(`uuid`) ON UPDATE no action ON DELETE cascade
);
