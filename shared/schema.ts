import { pgTable, text, serial, integer, boolean, date, timestamp, real, primaryKey, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User authentication (not required for MVP but included for extensibility)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Subject Categories - Main subjects
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    nameIdx: index("subject_name_idx").on(table.name),
  };
});

// Topics - Sub-categories of subjects
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    subjectTopicUnique: unique().on(table.subjectId, table.name),
    nameIdx: index("topic_name_idx").on(table.name),
  };
});

export const subjectsRelations = relations(subjects, ({ many }) => ({
  topics: many(topics),
  questions: many(questionSubjects),
  tests: many(testSubjects),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [topics.subjectId],
    references: [subjects.id],
  }),
  questions: many(questionTopics),
}));

// Tests uploaded by the user
export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  questionCount: integer("question_count").notNull(),
  difficultyLevel: text("difficulty_level"),
  estimatedTimeMinutes: integer("estimated_time_minutes"),
  isActive: boolean("is_active").default(true),
}, (table) => {
  return {
    titleIdx: index("test_title_idx").on(table.title),
  };
});

// Link between tests and subjects (many-to-many)
export const testSubjects = pgTable("test_subjects", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull().references(() => tests.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
}, (table) => {
  return {
    testSubjectUnique: unique().on(table.testId, table.subjectId),
  };
});

export const testsRelations = relations(tests, ({ many }) => ({
  questions: many(questions),
  attempts: many(attempts),
  subjects: many(testSubjects),
}));

export const testSubjectsRelations = relations(testSubjects, ({ one }) => ({
  test: one(tests, {
    fields: [testSubjects.testId],
    references: [tests.id],
  }),
  subject: one(subjects, {
    fields: [testSubjects.subjectId],
    references: [subjects.id],
  }),
}));

export const insertTestSchema = createInsertSchema(tests).omit({
  id: true,
  uploadedAt: true,
  isActive: true,
});

// Questions parsed from tests
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull().references(() => tests.id),
  questionNumber: integer("question_number").notNull(),
  questionText: text("question_text").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(), 
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctAnswer: text("correct_answer").notNull(), // A, B, C, or D
  correctAnswerText: text("correct_answer_text").notNull(),
  explanation: text("explanation"),
  difficultyLevel: text("difficulty_level"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    testIdIdx: index("question_test_id_idx").on(table.testId),
  };
});

// Link between questions and subjects (many-to-many)
export const questionSubjects = pgTable("question_subjects", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => questions.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  isAIGenerated: boolean("is_ai_generated").default(false),
}, (table) => {
  return {
    questionSubjectUnique: unique().on(table.questionId, table.subjectId),
  };
});

// Link between questions and topics (many-to-many)
export const questionTopics = pgTable("question_topics", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => questions.id),
  topicId: integer("topic_id").notNull().references(() => topics.id),
  isAIGenerated: boolean("is_ai_generated").default(false),
}, (table) => {
  return {
    questionTopicUnique: unique().on(table.questionId, table.topicId),
  };
});

export const questionsRelations = relations(questions, ({ one, many }) => ({
  test: one(tests, {
    fields: [questions.testId],
    references: [tests.id],
  }),
  tags: many(tags),
  userAnswers: many(userAnswers),
  flashcards: many(flashcards),
  subjects: many(questionSubjects),
  topics: many(questionTopics),
}));

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

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
  isActive: true,
});

// Tags for questions (both user-added and AI-generated)
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => questions.id),
  tagName: text("tag_name").notNull(),
  isAIGenerated: boolean("is_ai_generated").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    questionIdIdx: index("tag_question_id_idx").on(table.questionId),
    tagNameIdx: index("tag_name_idx").on(table.tagName),
  };
});

export const tagsRelations = relations(tags, ({ one }) => ({
  question: one(questions, {
    fields: [tags.questionId],
    references: [questions.id],
  }),
}));

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
});

// Quiz attempts by users
export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull().references(() => tests.id),
  attemptNumber: integer("attempt_number").notNull(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  totalTimeSeconds: integer("total_time_seconds"),
  completed: boolean("completed").notNull().default(false),
  score: real("score"),
  correctCount: integer("correct_count"),
  incorrectCount: integer("incorrect_count"),
  leftCount: integer("left_count"),
}, (table) => {
  return {
    testIdIdx: index("attempt_test_id_idx").on(table.testId),
  };
});

export const attemptsRelations = relations(attempts, ({ one, many }) => ({
  test: one(tests, {
    fields: [attempts.testId],
    references: [tests.id],
  }),
  userAnswers: many(userAnswers),
}));

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

// User answers for each question in an attempt
export const userAnswers = pgTable("user_answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => attempts.id),
  questionId: integer("question_id").notNull().references(() => questions.id),
  selectedOption: text("selected_option"), // A, B, C, D or null if left
  isCorrect: boolean("is_correct").default(false),
  isLeft: boolean("is_left").default(false),
  answerTimeSeconds: integer("answer_time_seconds"),
  knowledgeFlag: boolean("knowledge_flag"),
  techniqueFlag: boolean("technique_flag"),
  guessworkFlag: boolean("guesswork_flag"),
  confidenceLevel: text("confidence_level"), // 'high', 'mid', 'low'
  attemptNumber: integer("attempt_number").default(1), // Number of times user has seen this question
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => {
  return {
    attemptIdIdx: index("user_answer_attempt_id_idx").on(table.attemptId),
    questionIdIdx: index("user_answer_question_id_idx").on(table.questionId),
  };
});

export const userAnswersRelations = relations(userAnswers, ({ one }) => ({
  attempt: one(attempts, {
    fields: [userAnswers.attemptId],
    references: [attempts.id],
  }),
  question: one(questions, {
    fields: [userAnswers.questionId],
    references: [questions.id],
  }),
}));

export const insertUserAnswerSchema = createInsertSchema(userAnswers).omit({
  id: true,
  timestamp: true,
});

// Flashcards generated from incorrect answers
export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => questions.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastReviewedAt: timestamp("last_reviewed_at"),
  nextReviewAt: timestamp("next_review_at"),
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(1), // in days
  reviewCount: integer("review_count").notNull().default(0),
  difficultyRating: integer("difficulty_rating"), // 1-5 rating
  notes: text("notes"),
}, (table) => {
  return {
    questionIdIdx: index("flashcard_question_id_idx").on(table.questionId),
  };
});

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  question: one(questions, {
    fields: [flashcards.questionId],
    references: [questions.id],
  }),
}));

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

// Type exports
export type User = typeof users.$inferSelect;
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
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

// Additional type definitions
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = {
  name: string;
  description?: string | null;
  sortOrder?: number;
};

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = {
  subjectId: number;
  name: string;
  description?: string | null;
  sortOrder?: number;
};

export type QuestionSubject = typeof questionSubjects.$inferSelect;
export type InsertQuestionSubject = {
  questionId: number;
  subjectId: number;
  isAIGenerated?: boolean;
};

export type QuestionTopic = typeof questionTopics.$inferSelect;
export type InsertQuestionTopic = {
  questionId: number;
  topicId: number;
  isAIGenerated?: boolean;
};

export type TestSubject = typeof testSubjects.$inferSelect;
export type InsertTestSubject = {
  testId: number;
  subjectId: number;
};

// Special types for frontend usage
export type QuestionWithTags = Question & {
  tags: Tag[];
  subjects?: Subject[];
  topics?: Topic[];
};

export type TestWithStats = Test & {
  attempts: number;
  lastAttemptDate: string | null;
  bestScore: number | null;
  subjects?: Subject[];
  questionCount?: number;
};

export type SubjectStats = {
  subject: string | Subject; // Can be either a string or a Subject object
  subjectId?: number; // Subject ID if available
  name?: string; // Subject name (used for direct display)
  attempts: number;
  correct: number;
  incorrect: number;
  left: number;
  score: number;
  accuracy: number;
  personalBest: number;
  avgTimeSeconds: number;
  
  // Knowledge categorization metrics
  confidenceHigh: number;
  confidenceMid: number;
  confidenceLow: number;
  knowledgeYes: number; // KNOWLEDGE category
  techniqueYes: number; // PRESENCE OF MIND category
  guessworkYes: number; // TUKKEBAAZI category
  knowledgeNo?: number; // KNOWLEDGE incorrect
  techniqueNo?: number; // PRESENCE OF MIND incorrect
  guessworkNo?: number; // TUKKEBAAZI incorrect
  
  // Attempt breakdown
  firstAttemptCorrect: number;  // Correct on first attempt
  secondAttemptCorrect: number; // Correct on second attempt
  thirdPlusAttemptCorrect: number; // Correct on third or later attempts
  attemptDistribution: {[key: number]: number}; // Map of attempt number to count
  
  // For trending analysis
  dataPoints?: {
    date: string;
    accuracy: number;
    score: number;
    attemptId: number;
  }[];
  
  // Topic breakdown within subject
  topicBreakdown?: {
    topicName: string;
    accuracy: number;
    questionCount: number;
  }[];
  
  // Total questions across all metrics
  totalQuestions?: number;
};

export type TopicPerformance = {
  topicId: number;
  topicName: string;
  subjectId: number;
  subjectName: string;
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
  leftCount: number;
  totalCount: number;
  avgTimeSeconds: number;
};

export type TopicAnalytics = {
  id: number;
  name: string;
  subjectId: number;
  subjectName: string;
  totalQuestions: number;
  accuracy: number;
  trend: { date: string; accuracy: number; score: number }[];
  weakAreas: string[];
  strongAreas: string[];
};

export type SubjectAnalytics = {
  id: number;
  name: string;
  totalQuestions: number;
  accuracy: number;
  topicBreakdown: TopicPerformance[];
  trend: { date: string; accuracy: number; score: number }[];
};

// Type for detailed stats of a single question within an attempt
export type AttemptQuestionStat = {
  questionId: number;
  questionNumber: number;
  status: 'correct' | 'incorrect' | 'unanswered'; // Derived from UserAnswer
  tags: string[]; // Fetched from tags table
  meta?: { // From UserAnswer
    knowledge?: 'yes' | 'no' | null; // Mapped from boolean flags
    technique?: 'yes' | 'no' | null; // Mapped from boolean flags
    guess?: 'yes' | 'no' | null; // Mapped from boolean flags
    confidence?: 'high' | 'mid' | 'low' | null; // Direct from confidenceLevel
  };
};

export type TestAnalytics = {
  testId: number;
  attemptId: number;
  title: string;
  date: string; // Consider using Date type or ISO string
  totalTimeSeconds: number;
  overallStats: SubjectStats;
  subjectStats: SubjectStats[];
  attemptQuestionStats: AttemptQuestionStat[]; // Added detailed stats
};
