PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_scheduled_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text,
	`instruction` text NOT NULL,
	`schedule` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_scheduled_tasks`("id", "session_id", "instruction", "schedule", "created_at", "updated_at") SELECT "id", "session_id", "instruction", "schedule", "created_at", "updated_at" FROM `scheduled_tasks`;--> statement-breakpoint
DROP TABLE `scheduled_tasks`;--> statement-breakpoint
ALTER TABLE `__new_scheduled_tasks` RENAME TO `scheduled_tasks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;