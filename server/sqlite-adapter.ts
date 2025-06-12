import { IStorage } from "./storage";
import { SqliteStorage } from "./sqlite-storage";
import * as pgSchema from "../shared/schema";
import * as sqliteSchema from "../shared/sqlite-schema"; // Keep this
import { HeatmapData, ApplicationConfiguration, InsertApplicationConfiguration } from "../shared/sqlite-schema"; // Add HeatmapData import
import { logger } from "./logger";

/**
 * Adapter class to convert between PostgreSQL and SQLite schemas
 * This allows us to use the SQLite database with the existing code that expects PostgreSQL
 */
export class SqliteAdapter implements IStorage {
  private sqliteStorage: SqliteStorage;

  constructor() {
    this.sqliteStorage = new SqliteStorage();
    logger('Initialized SQLite adapter', 'adapter');
  }

  // Helper functions to convert between schemas
  private convertPgTestToSqliteTest(pgTest: pgSchema.InsertTest): sqliteSchema.InsertTest {
    return {
      name: pgTest.title || "",
      description: pgTest.description || null,
      difficulty: pgTest.difficultyLevel || null,
      timeLimit: pgTest.estimatedTimeMinutes || null,
      totalQuestions: pgTest.questionCount || 0,
    };
  }

  private convertSqliteTestToPgTest(sqliteTest: sqliteSchema.Test): pgSchema.Test {
    return {
      id: sqliteTest.id,
      filename: sqliteTest.name, // Use name as filename
      title: sqliteTest.name,
      description: sqliteTest.description,
      uploadedAt: new Date(sqliteTest.createdAt),
      questionCount: sqliteTest.totalQuestions || 0,
      difficultyLevel: sqliteTest.difficulty || null,
      estimatedTimeMinutes: sqliteTest.timeLimit || null,
      isActive: sqliteTest.isActive,
    };
  }

  private convertSqliteTestStatsToPgTestStats(sqliteTest: sqliteSchema.TestWithStats): pgSchema.TestWithStats {
    return {
      id: sqliteTest.id,
      filename: sqliteTest.name, // Use name as filename
      title: sqliteTest.name,
      description: sqliteTest.description,
      uploadedAt: new Date(sqliteTest.createdAt),
      questionCount: sqliteTest.questionCount,
      difficultyLevel: sqliteTest.difficulty || null,
      estimatedTimeMinutes: sqliteTest.timeLimit || null,
      isActive: sqliteTest.isActive,
      attempts: sqliteTest.attemptCount, // Changed from attemptCount to attempts
      // Assuming pgSchema.TestWithStats expects simple stats, not full subject objects
      // Provide placeholder values for lastAttemptDate and bestScore as they are in MemStorage version
      lastAttemptDate: null,
      bestScore: null,
      // subjects property might not be directly on TestWithStats in pgSchema, removing for now
      // If needed, it should likely be string[] based on sqliteTest.subjects
      // subjects: sqliteTest.subjects || [],
    };
  }

  private convertPgQuestionToSqliteQuestion(pgQuestion: pgSchema.InsertQuestion): sqliteSchema.InsertQuestion {
    return {
      testId: pgQuestion.testId,
      questionNumber: pgQuestion.questionNumber ?? 0, // Add questionNumber (defaulting to 0 if not provided)
      questionText: pgQuestion.questionText,
      optionA: pgQuestion.optionA,
      optionB: pgQuestion.optionB,
      optionC: pgQuestion.optionC,
      optionD: pgQuestion.optionD,
      correctAnswer: pgQuestion.correctAnswer,
      explanation: pgQuestion.correctAnswerText || null, // Store correctAnswerText as explanation
    };
  }

  private convertSqliteQuestionToPgQuestion(sqliteQuestion: sqliteSchema.Question): pgSchema.Question {
    return {
      id: sqliteQuestion.id,
      testId: sqliteQuestion.testId,
      questionNumber: sqliteQuestion.questionNumber, // Pass the actual number
      questionText: sqliteQuestion.questionText,
      optionA: sqliteQuestion.optionA,
      optionB: sqliteQuestion.optionB,
      optionC: sqliteQuestion.optionC,
      optionD: sqliteQuestion.optionD,
      correctAnswer: sqliteQuestion.correctAnswer,
      correctAnswerText: sqliteQuestion.explanation || sqliteQuestion.correctAnswer,
      difficultyLevel: null, // Default
      isActive: sqliteQuestion.isActive,
      createdAt: new Date(sqliteQuestion.createdAt),
    };
  }

  private convertSqliteQuestionWithTagsToPgQuestionWithTags(sqliteQuestion: sqliteSchema.QuestionWithTags): pgSchema.QuestionWithTags {
    const pgQuestion = this.convertSqliteQuestionToPgQuestion(sqliteQuestion);
    
    // Convert tags
    const tags = sqliteQuestion.tags.map(tag => ({
      id: tag.id,
      questionId: tag.questionId,
      tagName: tag.tagName,
      isAIGenerated: tag.isAIGenerated,
      createdAt: new Date(tag.createdAt),
    }));
    
    // Convert subjects if present
    const subjects = sqliteQuestion.subjects?.map(subject => ({
      id: subject.id,
      name: subject.name,
      description: subject.description,
      sortOrder: subject.sortOrder || 0,
      isActive: subject.isActive,
      createdAt: new Date(subject.createdAt),
    })) || [];
    
    // Convert topics if present
    const topics = sqliteQuestion.topics?.map(topic => ({
      id: topic.id,
      subjectId: topic.subjectId,
      name: topic.name,
      description: topic.description,
      sortOrder: topic.sortOrder || 0,
      isActive: topic.isActive,
      createdAt: new Date(topic.createdAt),
    })) || [];
    
    return {
      ...pgQuestion,
      tags,
      subjects,
      topics,
    };
  }

  private convertPgTagToSqliteTag(pgTag: pgSchema.InsertTag): sqliteSchema.InsertTag {
    return {
      questionId: pgTag.questionId,
      tagName: pgTag.tagName,
      isAIGenerated: pgTag.isAIGenerated || false,
    };
  }

  private convertSqliteTagToPgTag(sqliteTag: sqliteSchema.Tag): pgSchema.Tag {
    return {
      id: sqliteTag.id,
      questionId: sqliteTag.questionId,
      tagName: sqliteTag.tagName,
      isAIGenerated: sqliteTag.isAIGenerated,
      createdAt: new Date(sqliteTag.createdAt),
    };
  }

  private convertPgAttemptToSqliteAttempt(pgAttempt: pgSchema.InsertAttempt): sqliteSchema.InsertAttempt {
    return {
      testId: pgAttempt.testId,
      attemptNumber: pgAttempt.attemptNumber,
      totalTimeSeconds: pgAttempt.totalTimeSeconds || null,
    };
  }

  private convertSqliteAttemptToPgAttempt(sqliteAttempt: sqliteSchema.Attempt): pgSchema.Attempt {
    return {
      id: sqliteAttempt.id,
      testId: sqliteAttempt.testId,
      attemptNumber: sqliteAttempt.attemptNumber,
      startTime: new Date(sqliteAttempt.startTime),
      endTime: sqliteAttempt.endTime ? new Date(sqliteAttempt.endTime) : null,
      totalTimeSeconds: sqliteAttempt.totalTimeSeconds,
      completed: sqliteAttempt.completed,
      score: sqliteAttempt.score,
      correctCount: sqliteAttempt.correctCount,
      incorrectCount: sqliteAttempt.incorrectCount,
      leftCount: sqliteAttempt.leftCount,
    };
  }

  private convertPgUserAnswerToSqliteUserAnswer(pgAnswer: pgSchema.InsertUserAnswer): sqliteSchema.InsertUserAnswer {
    return {
      questionId: pgAnswer.questionId,
      attemptId: pgAnswer.attemptId,
      selectedOption: pgAnswer.selectedOption,
      isCorrect: pgAnswer.isCorrect,
      isLeft: pgAnswer.isLeft,
      answerTime: pgAnswer.answerTimeSeconds || null,
      knowledgeFlag: false,
      techniqueFlag: false,
      guessworkFlag: false,
      confidence: null,
      notes: null,
    };
  }

  private convertSqliteUserAnswerToPgUserAnswer(sqliteAnswer: sqliteSchema.UserAnswer): pgSchema.UserAnswer {
    return {
      id: sqliteAnswer.id,
      questionId: sqliteAnswer.questionId,
      attemptId: sqliteAnswer.attemptId,
      selectedOption: sqliteAnswer.selectedOption,
      isCorrect: sqliteAnswer.isCorrect,
      isLeft: sqliteAnswer.isLeft,
      timestamp: new Date(sqliteAnswer.createdAt),
      attemptNumber: null, // pgSchema might expect a number here based on MemStorage fixes
      answerTimeSeconds: sqliteAnswer.answerTime,
      // Use boolean flags as defined in pgSchema (based on MemStorage fixes)
      knowledgeFlag: sqliteAnswer.knowledgeFlag,
      techniqueFlag: sqliteAnswer.techniqueFlag,
      guessworkFlag: sqliteAnswer.guessworkFlag,
      confidenceLevel: sqliteAnswer.confidence ? String(sqliteAnswer.confidence) : null,
      // notes: sqliteAnswer.notes, // Removed, does not exist on pgSchema.UserAnswer
    };
  }

  private convertPgFlashcardToSqliteFlashcard(pgFlashcard: pgSchema.InsertFlashcard): sqliteSchema.InsertFlashcard {
    return {
      questionId: pgFlashcard.questionId,
      nextReviewAt: pgFlashcard.nextReviewAt ? pgFlashcard.nextReviewAt.toISOString() : null,
    };
  }

  private convertSqliteFlashcardToPgFlashcard(sqliteFlashcard: sqliteSchema.Flashcard): pgSchema.Flashcard {
    return {
      id: sqliteFlashcard.id,
      questionId: sqliteFlashcard.questionId,
      createdAt: new Date(sqliteFlashcard.createdAt),
      lastReviewedAt: sqliteFlashcard.lastReviewedAt ? new Date(sqliteFlashcard.lastReviewedAt) : null,
      nextReviewAt: sqliteFlashcard.nextReviewAt ? new Date(sqliteFlashcard.nextReviewAt) : null,
      easeFactor: sqliteFlashcard.easeFactor,
      interval: sqliteFlashcard.interval,
      reviewCount: sqliteFlashcard.reviewCount,
      difficultyRating: sqliteFlashcard.difficultyRating,
      notes: sqliteFlashcard.notes,
    };
  }

  // Aligning with structure implied by MemStorage and IStorage
  // Renamed: Converts TagStats from SQLite to the SubjectStats structure expected by pgSchema
  private convertSqliteTagStatsToPgSubjectStats(sqliteStats: sqliteSchema.TagStats): pgSchema.SubjectStats {
    const correct = sqliteStats.correct; // Use correct property name from TagStats
    const incorrect = sqliteStats.incorrect; // Use correct property name from TagStats
    const left = sqliteStats.left; // Use correct property name from TagStats
    const totalAttempted = correct + incorrect;
    const accuracy = totalAttempted > 0 ? (correct / totalAttempted) * 100 : 0;
    const score = correct * 2 - incorrect * 0.66; // Assuming same scoring

    // Note: pgSchema.SubjectStats seems to expect 'subject' as string, not object
    return {
      subject: sqliteStats.tag, // Use tag field from TagStats as the subject name
      attempts: sqliteStats.attempts, // Use correct property name from TagStats
      correct: correct,
      incorrect: incorrect,
      left: left,
      score: score,
      accuracy: accuracy,
      personalBest: accuracy, // Placeholder, cannot calculate from sqliteStats alone
      avgTimeSeconds: 0, // Placeholder, not available in sqliteStats
      confidenceHigh: 0, // Placeholder
      confidenceMid: 0, // Placeholder
      confidenceLow: 0, // Placeholder
      knowledgeYes: 0, // Placeholder
      techniqueYes: 0, // Placeholder
      guessworkYes: 0, // Placeholder
      firstAttemptCorrect: 0, // Placeholder
      secondAttemptCorrect: 0, // Placeholder
      thirdPlusAttemptCorrect: 0, // Placeholder
      attemptDistribution: {}, // Placeholder
    };
  }

  private convertSqliteTestAnalyticsToPgTestAnalytics(sqliteAnalytics: sqliteSchema.TestAnalytics): pgSchema.TestAnalytics {
    const pgTest = this.convertSqliteTestToPgTest(sqliteAnalytics.test);
    const pgAttempt = this.convertSqliteAttemptToPgAttempt(sqliteAnalytics.attempt);
    
    // Convert questions
    const questions = sqliteAnalytics.questions.map(q => this.convertSqliteQuestionWithTagsToPgQuestionWithTags(q));
    
    // Convert user answers
    const userAnswers = sqliteAnalytics.userAnswers.map(a => this.convertSqliteUserAnswerToPgUserAnswer(a));
    
    // Convert subject stats
    // Convert tag stats using the renamed function
    const subjectStats = sqliteAnalytics.tagStats.map(s => this.convertSqliteTagStatsToPgSubjectStats(s));

    // Calculate overall stats for the attempt
    const overallCorrect = pgAttempt.correctCount ?? 0;
    const overallIncorrect = pgAttempt.incorrectCount ?? 0;
    const overallLeft = pgAttempt.leftCount ?? 0;
    const overallTotalAttempted = overallCorrect + overallIncorrect;
    const overallAccuracy = overallTotalAttempted > 0 ? (overallCorrect / overallTotalAttempted) * 100 : 0;
    const overallScore = pgAttempt.score ?? (overallCorrect * 2 - overallIncorrect * 0.66); // Use score if available, else calculate

    const overallStats: pgSchema.SubjectStats = {
        subject: 'OVERALL',
        attempts: overallCorrect + overallIncorrect + overallLeft, // Total questions answered/left in attempt
        correct: overallCorrect,
        incorrect: overallIncorrect,
        left: overallLeft,
        score: overallScore,
        accuracy: overallAccuracy,
        personalBest: overallAccuracy, // Placeholder
        avgTimeSeconds: sqliteAnalytics.timePerQuestion || 0, // Use timePerQuestion if available, else 0
        confidenceHigh: 0, // Placeholder
        confidenceMid: 0, // Placeholder
        confidenceLow: 0, // Placeholder
        knowledgeYes: 0, // Placeholder
        techniqueYes: 0, // Placeholder
        guessworkYes: 0, // Placeholder
        firstAttemptCorrect: 0, // Placeholder
        secondAttemptCorrect: 0, // Placeholder
        thirdPlusAttemptCorrect: 0, // Placeholder
        attemptDistribution: {}, // Placeholder
    };
    
    return {
      testId: pgTest.id,
      attemptId: pgAttempt.id,
      title: pgTest.title,
      date: pgAttempt.startTime.toISOString(),
      totalTimeSeconds: pgAttempt.totalTimeSeconds || 0,
      // questions, // Removed, not part of pgSchema.TestAnalytics
      // userAnswers, // Removed, not part of pgSchema.TestAnalytics
      subjectStats,
      // attempt: pgAttempt, // Removed, not part of pgSchema.TestAnalytics
      // test: pgTest, // Removed, not part of pgSchema.TestAnalytics
      // timePerQuestion: sqliteAnalytics.timePerQuestion, // Removed, not part of pgSchema.TestAnalytics
      // correctPercentage: sqliteAnalytics.correctPercentage, // Removed, not part of pgSchema.TestAnalytics
      // incorrectPercentage: sqliteAnalytics.incorrectPercentage, // Removed, not part of pgSchema.TestAnalytics
      // leftPercentage: sqliteAnalytics.leftPercentage, // Removed, not part of pgSchema.TestAnalytics
      // overallScore: pgAttempt.score || 0, // Removed, not part of pgSchema.TestAnalytics
      // strengths: [], // Removed, not part of pgSchema.TestAnalytics
      // weaknesses: [], // Removed, not part of pgSchema.TestAnalytics
      // questionAnalysis: [], // Removed, not part of pgSchema.TestAnalytics
      // tags: [], // Removed, not part of pgSchema.TestAnalytics
      // categoryPerformance: [], // Removed, not part of pgSchema.TestAnalytics
      // testSummary: "", // Removed, not part of pgSchema.TestAnalytics
      // AIInsights: [], // Removed, not part of pgSchema.TestAnalytics
      overallStats: overallStats, // Added missing property
      attemptQuestionStats: [], // Added missing property (placeholder)
    };
  }

  // IStorage implementation
  async createTest(test: pgSchema.InsertTest): Promise<pgSchema.Test> {
    const sqliteTest = this.convertPgTestToSqliteTest(test);
    const result = await this.sqliteStorage.createTest(sqliteTest);
    return this.convertSqliteTestToPgTest(result);
  }

  async getTest(id: number): Promise<pgSchema.Test | undefined> {
    const result = await this.sqliteStorage.getTest(id);
    if (!result) return undefined;
    return this.convertSqliteTestToPgTest(result);
  }

  async deleteTest(id: number): Promise<void> {
    await this.sqliteStorage.deleteTest(id);
  }

  async getAllTests(): Promise<pgSchema.TestWithStats[]> {
    const tests = await this.sqliteStorage.getAllTests();
    return tests.map(test => this.convertSqliteTestStatsToPgTestStats(test));
  }

  async addQuestionsToTest(questions: pgSchema.InsertQuestion[]): Promise<pgSchema.Question[]> {
    const sqliteQuestions = questions.map(q => this.convertPgQuestionToSqliteQuestion(q));
    const results = await this.sqliteStorage.addQuestionsToTest(sqliteQuestions);
    return results.map(q => this.convertSqliteQuestionToPgQuestion(q));
  }

  async getQuestion(id: number): Promise<pgSchema.QuestionWithTags | undefined> {
    const result = await this.sqliteStorage.getQuestion(id);
    if (!result) return undefined;
    return this.convertSqliteQuestionWithTagsToPgQuestionWithTags(result);
  }

  async getQuestionsByTest(testId: number): Promise<pgSchema.QuestionWithTags[]> {
    const questions = await this.sqliteStorage.getQuestionsByTest(testId);
    return questions.map(q => this.convertSqliteQuestionWithTagsToPgQuestionWithTags(q));
  }

  async getAllQuestions(): Promise<pgSchema.QuestionWithTags[]> {
    const questions = await this.sqliteStorage.getAllQuestions();
    return questions.map(q => this.convertSqliteQuestionWithTagsToPgQuestionWithTags(q));
  }

  async addTagsToQuestion(tags: pgSchema.InsertTag[]): Promise<pgSchema.Tag[]> {
    const sqliteTags = tags.map(t => this.convertPgTagToSqliteTag(t));
    const results = await this.sqliteStorage.addTagsToQuestion(sqliteTags);
    return results.map(t => this.convertSqliteTagToPgTag(t));
  }

  async deleteTag(id: number): Promise<void> {
    await this.sqliteStorage.deleteTag(id);
  }

  async getAllTags(): Promise<string[]> {
    return await this.sqliteStorage.getAllTags();
  }

  async createAttempt(attempt: pgSchema.InsertAttempt): Promise<pgSchema.Attempt> {
    const sqliteAttempt = this.convertPgAttemptToSqliteAttempt(attempt);
    const result = await this.sqliteStorage.createAttempt(sqliteAttempt);
    return this.convertSqliteAttemptToPgAttempt(result);
  }

  async getAttempt(id: number): Promise<pgSchema.Attempt | undefined> {
    const result = await this.sqliteStorage.getAttempt(id);
    if (!result) return undefined;
    return this.convertSqliteAttemptToPgAttempt(result);
  }

  async getAttemptsByTest(testId: number): Promise<pgSchema.Attempt[]> {
    const attempts = await this.sqliteStorage.getAttemptsByTest(testId);
    return attempts.map(a => this.convertSqliteAttemptToPgAttempt(a));
  }

  async updateAttempt(id: number, data: Partial<pgSchema.Attempt>): Promise<pgSchema.Attempt | undefined> {
    // Convert Partial<pgSchema.Attempt> to Partial<sqliteSchema.Attempt>
    const sqliteData: Partial<sqliteSchema.Attempt> = {};

    // Copy compatible fields, converting types as needed
    if (data.id !== undefined) sqliteData.id = data.id;
    if (data.testId !== undefined) sqliteData.testId = data.testId;
    if (data.attemptNumber !== undefined) sqliteData.attemptNumber = data.attemptNumber;
    if (data.startTime !== undefined) sqliteData.startTime = data.startTime.toISOString(); // Date -> string
    if (data.endTime !== undefined) sqliteData.endTime = data.endTime ? data.endTime.toISOString() : null; // Date|null -> string|null
    if (data.totalTimeSeconds !== undefined) sqliteData.totalTimeSeconds = data.totalTimeSeconds;
    if (data.completed !== undefined) sqliteData.completed = data.completed;
    if (data.score !== undefined) sqliteData.score = data.score;
    if (data.correctCount !== undefined) sqliteData.correctCount = data.correctCount;
    if (data.incorrectCount !== undefined) sqliteData.incorrectCount = data.incorrectCount;
    if (data.leftCount !== undefined) sqliteData.leftCount = data.leftCount;
    
    const result = await this.sqliteStorage.updateAttempt(id, sqliteData);
    if (!result) return undefined;
    
    return this.convertSqliteAttemptToPgAttempt(result);
  }

  async createUserAnswer(answer: pgSchema.InsertUserAnswer): Promise<pgSchema.UserAnswer> {
    const sqliteAnswer = this.convertPgUserAnswerToSqliteUserAnswer(answer);
    const result = await this.sqliteStorage.createUserAnswer(sqliteAnswer);
    return this.convertSqliteUserAnswerToPgUserAnswer(result);
  }

  async getUserAnswersByAttempt(attemptId: number): Promise<pgSchema.UserAnswer[]> {
    const answers = await this.sqliteStorage.getUserAnswersByAttempt(attemptId);
    return answers.map(a => this.convertSqliteUserAnswerToPgUserAnswer(a));
  }

  async updateUserAnswer(id: number, data: Partial<pgSchema.UserAnswer>): Promise<pgSchema.UserAnswer | undefined> {
    // Convert the data
    const sqliteData: Partial<sqliteSchema.UserAnswer> = {};
    
    // Copy compatible fields from Partial<pgSchema.UserAnswer> to Partial<sqliteSchema.UserAnswer>
    if (data.id !== undefined) sqliteData.id = data.id;
    if (data.questionId !== undefined) sqliteData.questionId = data.questionId;
    if (data.attemptId !== undefined) sqliteData.attemptId = data.attemptId;
    if (data.selectedOption !== undefined) sqliteData.selectedOption = data.selectedOption;
    if (data.isCorrect !== undefined) sqliteData.isCorrect = data.isCorrect;
    if (data.isLeft !== undefined) sqliteData.isLeft = data.isLeft;
    if (data.answerTimeSeconds !== undefined) sqliteData.answerTime = data.answerTimeSeconds;
    // Use boolean flags from pgSchema
    if (data.knowledgeFlag !== undefined) sqliteData.knowledgeFlag = data.knowledgeFlag ?? false;
    if (data.techniqueFlag !== undefined) sqliteData.techniqueFlag = data.techniqueFlag ?? false;
    if (data.guessworkFlag !== undefined) sqliteData.guessworkFlag = data.guessworkFlag ?? false;
    if (data.confidenceLevel !== undefined) {
      let confidenceInt: number | null = null;
      if (data.confidenceLevel === 'high') confidenceInt = 3;
      else if (data.confidenceLevel === 'mid') confidenceInt = 2;
      else if (data.confidenceLevel === 'low') confidenceInt = 1;
      sqliteData.confidence = confidenceInt;
    }
    // if (data.notes !== undefined) sqliteData.notes = data.notes; // Removed, notes does not exist on pgSchema.UserAnswer
    // timestamp and attemptNumber are usually not updated directly here
    logger(`[Adapter.updateUserAnswer] Received data for answer ${id}: ${JSON.stringify(data)}`, 'adapter');
    logger(`[Adapter.updateUserAnswer] Constructed sqliteData before storage call: ${JSON.stringify(sqliteData)}`, 'adapter');
    const result = await this.sqliteStorage.updateUserAnswer(id, sqliteData);
    if (!result) return undefined;
    
    return this.convertSqliteUserAnswerToPgUserAnswer(result);
  }

  async createFlashcard(flashcard: pgSchema.InsertFlashcard): Promise<pgSchema.Flashcard> {
    const sqliteFlashcard = this.convertPgFlashcardToSqliteFlashcard(flashcard);
    const result = await this.sqliteStorage.createFlashcard(sqliteFlashcard);
    return this.convertSqliteFlashcardToPgFlashcard(result);
  }

  async getAllFlashcards(): Promise<(pgSchema.Flashcard & { question: pgSchema.QuestionWithTags })[]> {
    const flashcards = await this.sqliteStorage.getAllFlashcards();
    
    return flashcards.map(f => {
      const pgFlashcard = this.convertSqliteFlashcardToPgFlashcard(f);
      const pgQuestion = this.convertSqliteQuestionWithTagsToPgQuestionWithTags(f.question);
      
      return {
        ...pgFlashcard,
        question: pgQuestion,
      };
    });
  }

  async updateFlashcard(id: number, data: Partial<pgSchema.Flashcard>): Promise<pgSchema.Flashcard | undefined> {
    // Convert Partial<pgSchema.Flashcard> to Partial<sqliteSchema.Flashcard>
    const sqliteData: Partial<sqliteSchema.Flashcard> = {};

    // Copy compatible fields, converting types as needed
    if (data.id !== undefined) sqliteData.id = data.id;
    if (data.questionId !== undefined) sqliteData.questionId = data.questionId;
    if (data.createdAt !== undefined) sqliteData.createdAt = data.createdAt.toISOString(); // Date -> string
    if (data.lastReviewedAt !== undefined) sqliteData.lastReviewedAt = data.lastReviewedAt ? data.lastReviewedAt.toISOString() : null; // Date|null -> string|null
    if (data.nextReviewAt !== undefined) sqliteData.nextReviewAt = data.nextReviewAt ? data.nextReviewAt.toISOString() : null; // Date|null -> string|null
    if (data.easeFactor !== undefined) sqliteData.easeFactor = data.easeFactor;
    if (data.interval !== undefined) sqliteData.interval = data.interval;
    if (data.reviewCount !== undefined) sqliteData.reviewCount = data.reviewCount;
    if (data.difficultyRating !== undefined) sqliteData.difficultyRating = data.difficultyRating;
    if (data.notes !== undefined) sqliteData.notes = data.notes;
    
    const result = await this.sqliteStorage.updateFlashcard(id, sqliteData);
    if (!result) return undefined;
    
    return this.convertSqliteFlashcardToPgFlashcard(result);
  }

  async getTestAnalytics(attemptId: number): Promise<pgSchema.TestAnalytics | undefined> {
    // SqliteStorage.getTestAnalytics now returns the correct frontend schema directly
    // No conversion needed here.
    const analytics = await this.sqliteStorage.getTestAnalytics(attemptId);
    return analytics;
  }

  async getOverallAnalytics(): Promise<{
    testCount: number;
    attemptCount: number;
    totalCorrect: number;
    totalIncorrect: number;
    totalLeft: number;
    avgTimeSeconds: number; // Added to match IStorage
    totalQuestions?: number; // Added to match IStorage
    accuracy?: number; // Added to match IStorage
    subjectStats: pgSchema.SubjectStats[];
    trendData: { date: string; accuracy: number; score: number }[];
  }> {
    const analytics = await this.sqliteStorage.getOverallAnalytics();
    
    // Calculate missing fields required by IStorage interface
    const totalQuestions = analytics.totalCorrect + analytics.totalIncorrect + analytics.totalLeft;
    const accuracy = totalQuestions > 0 ? (analytics.totalCorrect / (analytics.totalCorrect + analytics.totalIncorrect)) * 100 : 0; // Accuracy based on attempted
    const avgTimeSeconds = 0; // Placeholder - sqliteStorage doesn't provide this directly

    return {
      testCount: analytics.testCount,
      attemptCount: analytics.attemptCount,
      totalCorrect: analytics.totalCorrect,
      totalIncorrect: analytics.totalIncorrect,
      totalLeft: analytics.totalLeft,
      avgTimeSeconds: avgTimeSeconds, // Added
      totalQuestions: totalQuestions, // Added
      accuracy: accuracy, // Added
      // Convert tag stats using the renamed function
      subjectStats: analytics.tagStats.map(s => this.convertSqliteTagStatsToPgSubjectStats(s)),
      trendData: analytics.trendData,
    };
  }

  async getAnkiData(testId: number): Promise<{
    front: string;
    back: string;
    tags: string;
  }[]> {
    return await this.sqliteStorage.getAnkiData(testId);
  }

  // History
  async getHistory(filter?: string): Promise<pgSchema.TestAnalytics[]> {
    // SqliteStorage.getHistory returns the correct frontend schema directly
    const history = await this.sqliteStorage.getHistory(filter);
    return history;
  }

  // --- Wrongs Feature ---
  async getWrongAnswers(
    timeFilter?: string,
    tagFilter?: string,
    filterType?: 'Wrongs' | 'No knowledge' | 'Tukke' | 'Low confidence' | 'Medium confidence' // Add filterType
  ): Promise<sqliteSchema.UserAnswerWithDetails[]> {
    // Directly call SqliteStorage method, passing all arguments
    return await this.sqliteStorage.getWrongAnswers(timeFilter, tagFilter, filterType);
  }

  // --- Notes Feature ---
  async addQuestionNote(noteData: sqliteSchema.InsertQuestionNote): Promise<sqliteSchema.QuestionNote> {
    // Directly call SqliteStorage method
    return await this.sqliteStorage.addQuestionNote(noteData);
  }

  async getAllNotes(timeFilter?: string, tagFilter?: string): Promise<sqliteSchema.QuestionNote[]> {
    // Directly call SqliteStorage method
    return await this.sqliteStorage.getAllNotes(timeFilter, tagFilter);
  }

  async updateQuestionNote(noteId: number, noteText: string): Promise<sqliteSchema.QuestionNote | undefined> {
    // Directly call SqliteStorage method
    return await this.sqliteStorage.updateQuestionNote(noteId, noteText);
  }

  async exportNotesToMarkdown(timeFilter?: string, tagFilter?: string): Promise<string> {
    // Directly call SqliteStorage method
    return await this.sqliteStorage.exportNotesToMarkdown(timeFilter, tagFilter);
  }

  // --- Heatmap Feature ---
  async getHeatmapData(year: number, month: number): Promise<HeatmapData[]> { // Use imported HeatmapData
    // Directly call SqliteStorage method
    return await this.sqliteStorage.getHeatmapData(year, month);
  }

  // --- Application Settings ---
  async getAppSettings(): Promise<ApplicationConfiguration | undefined> {
    // Directly call SqliteStorage method, no schema conversion needed for settings
    return await this.sqliteStorage.getAppSettings();
  }

  async updateAppSettings(settings: Partial<InsertApplicationConfiguration>): Promise<ApplicationConfiguration | undefined> {
    // Directly call SqliteStorage method, no schema conversion needed for settings
    return await this.sqliteStorage.updateAppSettings(settings);
  }
} // End of SqliteAdapter class