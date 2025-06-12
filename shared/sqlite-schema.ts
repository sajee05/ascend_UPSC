import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User authentication (not required for MVP but included for extensibility)
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Subject Categories - Main subjects
export const subjects = sqliteTable("subjects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Topics - Sub-categories of subjects
export const topics = sqliteTable("topics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const topicsRelations = relations(topics, ({ one }) => ({
  subject: one(subjects, {
    fields: [topics.subjectId],
    references: [subjects.id],
  }),
}));

// Test definition
export const tests = sqliteTable("tests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  difficulty: text("difficulty"), // 'easy', 'medium', 'hard'
  timeLimit: integer("time_limit"), // in minutes
  totalQuestions: integer("total_questions"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const testsRelations = relations(tests, ({ many }) => ({
  questions: many(questions),
  attempts: many(attempts),
}));

// Test questions
export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  testId: integer("test_id").notNull().references(() => tests.id),
  questionNumber: integer("question_number").notNull().default(0), // Added question number
  questionText: text("question_text").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctAnswer: text("correct_answer").notNull(), // 'A', 'B', 'C', or 'D'
  explanation: text("explanation"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const questionsRelations = relations(questions, ({ one, many }) => ({
  test: one(tests, {
    fields: [questions.testId],
    references: [tests.id],
  }),
  questionSubjects: many(questionSubjects),
  questionTopics: many(questionTopics),
  tags: many(tags),
  userAnswers: many(userAnswers),
  flashcards: many(flashcards),
}));

// Question-Subject junction table
export const questionSubjects = sqliteTable("question_subjects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  questionId: integer("question_id").notNull().references(() => questions.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
});

// Question-Topic junction table
export const questionTopics = sqliteTable("question_topics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  questionId: integer("question_id").notNull().references(() => questions.id),
  topicId: integer("topic_id").notNull().references(() => topics.id),
});

export const questionSubjectsRelations = relations(questionSubjects, ({ one }) => ({
  question: one(questions, {
    fields: [questionSubjects.questionId],
    references: [questions.id],
  }),
  subject: one(subjects, {
    fields: [questionSubjects.subjectId],
    references: [subjects.id],
  }),
}));

export const questionTopicsRelations = relations(questionTopics, ({ one }) => ({
  question: one(questions, {
    fields: [questionTopics.questionId],
    references: [questions.id],
  }),
  topic: one(topics, {
    fields: [questionTopics.topicId],
    references: [topics.id],
  }),
}));

// Tags for questions (both user-added and AI-generated)
export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  questionId: integer("question_id").notNull().references(() => questions.id),
  tagName: text("tag_name").notNull(),
  isAIGenerated: integer("is_ai_generated", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const tagsRelations = relations(tags, ({ one }) => ({
  question: one(questions, {
    fields: [tags.questionId],
    references: [questions.id],
  }),
}));

// Quiz attempts by users
export const attempts = sqliteTable("attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  testId: integer("test_id").notNull().references(() => tests.id),
  attemptNumber: integer("attempt_number").notNull(),
  startTime: text("start_time").notNull().$defaultFn(() => new Date().toISOString()),
  endTime: text("end_time"),
  totalTimeSeconds: integer("total_time_seconds"),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  score: real("score"),
  correctCount: integer("correct_count"),
  incorrectCount: integer("incorrect_count"),
  leftCount: integer("left_count"),
});

export const attemptsRelations = relations(attempts, ({ one, many }) => ({
  test: one(tests, {
    fields: [attempts.testId],
    references: [tests.id],
  }),
  userAnswers: many(userAnswers),
}));

// User answers for quiz attempts
export const userAnswers = sqliteTable("user_answers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  attemptId: integer("attempt_id").notNull().references(() => attempts.id),
  questionId: integer("question_id").notNull().references(() => questions.id),
  selectedOption: text("selected_option"), // 'A', 'B', 'C', 'D', or null if left unanswered
  isCorrect: integer("is_correct", { mode: "boolean" }),
  isLeft: integer("is_left", { mode: "boolean" }),
  answerTime: integer("answer_time"), // in seconds
  knowledgeFlag: integer("knowledge_flag", { mode: "boolean" }).default(false),
  techniqueFlag: integer("technique_flag", { mode: "boolean" }).default(false),
  guessworkFlag: integer("guesswork_flag", { mode: "boolean" }).default(false),
  confidence: integer("confidence"), // 1-5 rating
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const userAnswersRelations = relations(userAnswers, ({ one, many }) => ({ // Added 'many'
  attempt: one(attempts, {
    fields: [userAnswers.attemptId],
    references: [attempts.id],
  }),
  question: one(questions, {
    fields: [userAnswers.questionId],
    references: [questions.id],
  }),
  notes: many(questionNotes), // Add this relation
}));

// Flashcards generated from incorrect answers
export const flashcards = sqliteTable("flashcards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  questionId: integer("question_id").notNull().references(() => questions.id),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  lastReviewedAt: text("last_reviewed_at"),
  nextReviewAt: text("next_review_at"),
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(1), // in days
  reviewCount: integer("review_count").notNull().default(0),
  difficultyRating: integer("difficulty_rating"), // 1-5 rating
  notes: text("notes"),
});

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  question: one(questions, {
    fields: [flashcards.questionId],
    references: [questions.id],
  }),
}));

// Add this new table definition
export const questionNotes = sqliteTable("question_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userAnswerId: integer("user_answer_id").notNull().references(() => userAnswers.id, { onDelete: 'cascade' }), // Link to the specific answer instance
  noteText: text("note_text").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()), // Track edits
});

// Add relations for the new table
export const questionNotesRelations = relations(questionNotes, ({ one }) => ({
  userAnswer: one(userAnswers, {
    fields: [questionNotes.userAnswerId],
    references: [userAnswers.id],
  }),
}));

// Application Configuration Table
export const applicationConfiguration = sqliteTable("application_configuration", {
  id: integer("id").primaryKey({ autoIncrement: true }), // To ensure only one row of settings
  theme: text("theme").default("light"),
  primaryColor: text("primary_color").default("blue"),
  animations: integer("animations", { mode: "boolean" }).default(true),
  aiEnabled: integer("ai_enabled", { mode: "boolean" }).default(true),
  aiApiKey: text("ai_api_key").default(""),
  aiModel: text("ai_model").default("gemini-2.0-flash"),
  subjectTaggingAiModel: text("subject_tagging_ai_model").default("gemini-1.5-flash"),
  subjectTaggingPrompt: text("subject_tagging_prompt"), // Default handled in app logic
  analyticsPrompt: text("analytics_prompt"), // Default handled in app logic
  explanationPrompt: text("explanation_prompt"), // Default handled in app logic
  studyPlanPrompt: text("study_plan_prompt"), // Default handled in app logic
  learningPatternPrompt: text("learning_pattern_prompt"), // Default handled in app logic
  parsingPromptTitle: text("parsing_prompt_title"), // Default handled in app logic
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Schema insert types
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
});
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

export const insertTopicSchema = createInsertSchema(topics).omit({
  id: true,
  createdAt: true,
});
export type InsertTopic = z.infer<typeof insertTopicSchema>;

export const insertTestSchema = createInsertSchema(tests).omit({
  id: true,
  createdAt: true,
  isActive: true,
});
export type InsertTest = z.infer<typeof insertTestSchema>;

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
  isActive: true,
});
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
});
export type InsertTag = z.infer<typeof insertTagSchema>;

export const insertAttemptSchema = createInsertSchema(attempts).omit({
  id: true,
  startTime: true,
  endTime: true,
  completed: true,
  score: true,
  correctCount: true,
  incorrectCount: true,
  leftCount: true,
});
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;

export const insertUserAnswerSchema = createInsertSchema(userAnswers).omit({
  id: true,
  createdAt: true,
});
export type InsertUserAnswer = z.infer<typeof insertUserAnswerSchema>;

export const insertFlashcardSchema = createInsertSchema(flashcards).omit({
  id: true,
  createdAt: true,
  lastReviewedAt: true,
  easeFactor: true,
  interval: true,
  reviewCount: true,
  difficultyRating: true,
  notes: true,
});
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;

// Add insert/select types for the new table
export const insertQuestionNoteSchema = createInsertSchema(questionNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true, // Omit updatedAt on insert
});
export type InsertQuestionNote = z.infer<typeof insertQuestionNoteSchema>;

export const insertApplicationConfigurationSchema = createInsertSchema(applicationConfiguration).omit({
  id: true,
  // updatedAt is managed by $defaultFn on insert, and manually on update.
  // No need to omit here if we want to allow it in the insert type for flexibility,
  // but the prompt asked to omit it.
  // Let's keep it omitted as per original instruction for the insert type.
  // It will be set by $defaultFn or by the update logic.
});
export type InsertApplicationConfiguration = typeof applicationConfiguration.$inferInsert; // Using $inferInsert as per instructions

// Type exports for select operations
export type User = typeof users.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type Test = typeof tests.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type QuestionSubject = typeof questionSubjects.$inferSelect;
export type QuestionTopic = typeof questionTopics.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type UserAnswer = typeof userAnswers.$inferSelect;
export type Flashcard = typeof flashcards.$inferSelect;
export type QuestionNote = typeof questionNotes.$inferSelect; // Add this line
export type ApplicationConfiguration = typeof applicationConfiguration.$inferSelect;

// Extended types for related data
export type QuestionWithTags = Question & {
  tags: Tag[];
  subjects?: Subject[];
  topics?: Topic[];
};

export type TestWithStats = Test & {
  questionCount: number;
  attemptCount: number;
  subjects?: string[];
};

export type AttemptWithTest = Attempt & {
  test: Test;
};

export type SubjectStats = {
  subjectId: number;
  name: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  leftCount: number;
  percentage: number;
};
// Define the new TagStats type (based on calculated data in sqlite-storage)
export type TagStats = {
  tag: string;
  attempts: number;
  correct: number;
  incorrect: number;
  left: number;
  accuracy: number;
  avgTime: number;
  score: number;
  highConfidencePercent: number;
  mediumConfidencePercent: number;
  lowConfidencePercent: number;
  knowledgePercent: number;
  techniquePercent: number;
  guessworkPercent: number;
};


export type TestAnalytics = {
  attempt: Attempt;
  test: Test;
  questions: QuestionWithTags[];
  userAnswers: UserAnswer[];
  tagStats: TagStats[]; // Changed from subjectStats
  timePerQuestion: number; // in seconds
  correctPercentage: number;
  incorrectPercentage: number;
  leftPercentage: number;
};

// Potentially update related types if needed (e.g., if fetching notes with answers)
export type UserAnswerWithDetails = UserAnswer & {
  question: QuestionWithTags;
  attempt: AttemptWithTest;
  notes?: QuestionNote[]; // Include notes
};

// Type definition for heatmap data point
export type HeatmapData = {
  date: string; // YYYY-MM-DD
  count: number;
  testNames: string[];
};