CREATE TABLE `paydown_debts` (
	`uuid` text PRIMARY KEY NOT NULL,
	`scenario_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`interest_rate` integer NOT NULL,
	`monthly_payment` integer NOT NULL,
	`priority` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`scenario_id`) REFERENCES `paydown_scenarios`(`uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `paydown_incomes` (
	`uuid` text PRIMARY KEY NOT NULL,
	`scenario_id` text NOT NULL,
	`title` text NOT NULL,
	`amount` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`scenario_id`) REFERENCES `paydown_scenarios`(`uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `paydown_recurring_expenses` (
	`uuid` text PRIMARY KEY NOT NULL,
	`scenario_id` text NOT NULL,
	`title` text NOT NULL,
	`amount` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`scenario_id`) REFERENCES `paydown_scenarios`(`uuid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `paydown_saved_plans` (
	`uuid` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`scenario_id` text,
	`plan_start_date` text NOT NULL,
	`years_to_plan` integer NOT NULL,
	`additional_snowball` integer NOT NULL,
	`payment_plan` text NOT NULL,
	`manually_edited_payments` text NOT NULL,
	`manually_edited_incomes` text NOT NULL,
	`manually_edited_recurring_expenses` text NOT NULL,
	`debts` text NOT NULL,
	`incomes` text NOT NULL,
	`recurring_expenses` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`uuid`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`scenario_id`) REFERENCES `paydown_scenarios`(`uuid`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `paydown_scenarios` (
	`uuid` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`is_active` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`uuid`) ON UPDATE no action ON DELETE cascade
);
