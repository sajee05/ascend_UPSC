CREATE TABLE `application_configuration` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`theme` text DEFAULT 'light',
	`primary_color` text DEFAULT 'blue',
	`animations` integer DEFAULT true,
	`ai_enabled` integer DEFAULT true,
	`ai_api_key` text DEFAULT '',
	`ai_model` text DEFAULT 'gemini-2.0-flash',
	`subject_tagging_ai_model` text DEFAULT 'gemini-1.5-flash',
	`subject_tagging_prompt` text,
	`analytics_prompt` text,
	`explanation_prompt` text,
	`study_plan_prompt` text,
	`learning_pattern_prompt` text,
	`parsing_prompt_title` text,
	`updated_at` text NOT NULL
);
