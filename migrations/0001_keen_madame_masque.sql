CREATE TABLE `question_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_answer_id` integer NOT NULL,
	`note_text` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_answer_id`) REFERENCES `user_answers`(`id`) ON UPDATE no action ON DELETE cascade
);
