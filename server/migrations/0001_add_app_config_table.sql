CREATE TABLE `application_configuration` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `theme` text DEFAULT 'light',
  `primary_color` text DEFAULT 'blue',
  `animations` integer DEFAULT 1, -- true (SQLite stores boolean as 0 or 1)
  `ai_enabled` integer DEFAULT 1,   -- true (SQLite stores boolean as 0 or 1)
  `ai_api_key` text DEFAULT '',
  `ai_model` text DEFAULT 'gemini-2.0-flash',
  `subject_tagging_ai_model` text DEFAULT 'gemini-1.5-flash',
  `subject_tagging_prompt` text,
  `analytics_prompt` text,
  `explanation_prompt` text,
  `study_plan_prompt` text,
  `learning_pattern_prompt` text,
  `parsing_prompt_title` text,
  `updated_at` text NOT NULL -- The $defaultFn in the Drizzle schema handles default value on insert/update
);