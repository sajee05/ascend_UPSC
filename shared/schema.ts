import { pgTable, text, serial, integer, boolean, date, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User authentication (not required for MVP but included for extensibility)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Tests uploaded by the user
export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  title: text("title").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  questionCount: integer("question_count").notNull(),
});

export const insertTestSchema = createInsertSchema(tests).omit({
  id: true,
  uploadedAt: true,
});

// Questions parsed from tests
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(),
  questionNumber: integer("question_number").notNull(),
  questionText: text("question_text").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(), 
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctAnswer: text("correct_answer").notNull(), // A, B, C, or D
  correctAnswerText: text("correct_answer_text").notNull(),
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

// Tags for questions (both user-added and AI-generated)
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  tagName: text("tag_name").notNull(),
  isAIGenerated: boolean("is_ai_generated").notNull().default(false),
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
});

// Quiz attempts by users
export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(),
  attemptNumber: integer("attempt_number").notNull(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  totalTimeSeconds: integer("total_time_seconds"),
  completed: boolean("completed").notNull().default(false),
});

export const insertAttemptSchema = createInsertSchema(attempts).omit({
  id: true,
  startTime: true,
  endTime: true,
  completed: true,
});

// User answers for each question in an attempt
export const userAnswers = pgTable("user_answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull(),
  questionId: integer("question_id").notNull(),
  selectedOption: text("selected_option"), // A, B, C, D or null if left
  isCorrect: boolean("is_correct").default(false),
  isLeft: boolean("is_left").default(false),
  answerTimeSeconds: integer("answer_time_seconds"),
  knowledgeFlag: boolean("knowledge_flag"),
  techniqueFlag: boolean("technique_flag"),
  guessworkFlag: boolean("guesswork_flag"),
  confidenceLevel: text("confidence_level"), // 'high', 'mid', 'low'
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertUserAnswerSchema = createInsertSchema(userAnswers).omit({
  id: true,
  timestamp: true,
});

// Flashcards generated from incorrect answers
export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastReviewedAt: timestamp("last_reviewed_at"),
  nextReviewAt: timestamp("next_review_at"),
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(1), // in days
  reviewCount: integer("review_count").notNull().default(0),
});

export const insertFlashcardSchema = createInsertSchema(flashcards).omit({
  id: true,
  createdAt: true,
  lastReviewedAt: true,
  easeFactor: true,
  interval: true,
  reviewCount: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Test = typeof tests.$inferSelect;
export type InsertTest = z.infer<typeof insertTestSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;

export type Attempt = typeof attempts.$inferSelect;
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;

export type UserAnswer = typeof userAnswers.$inferSelect;
export type InsertUserAnswer = z.infer<typeof insertUserAnswerSchema>;

export type Flashcard = typeof flashcards.$inferSelect;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;

// Special types for frontend usage
export type QuestionWithTags = Question & {
  tags: Tag[];
};

export type TestWithStats = Test & {
  attempts: number;
  lastAttemptDate: string | null;
  bestScore: number | null;
};

export type SubjectStats = {
  subject: string;
  attempts: number;
  correct: number;
  incorrect: number;
  left: number;
  score: number;
  accuracy: number;
  personalBest: number;
  avgTimeSeconds: number;
  confidenceHigh: number;
  confidenceMid: number;
  confidenceLow: number;
  knowledgeYes: number;
  techniqueYes: number;
  guessworkYes: number;
};

export type TestAnalytics = {
  testId: number;
  attemptId: number;
  title: string;
  date: string;
  totalTimeSeconds: number;
  overallStats: SubjectStats;
  subjectStats: SubjectStats[];
};
