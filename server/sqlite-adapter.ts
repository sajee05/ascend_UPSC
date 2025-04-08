import { IStorage } from "./storage";
import { SqliteStorage } from "./sqlite-storage";
import * as pgSchema from "../shared/schema";
import * as sqliteSchema from "../shared/sqlite-schema";
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
      attemptCount: sqliteTest.attemptCount,
      subjects: sqliteTest.subjects || [],
    };
  }

  private convertPgQuestionToSqliteQuestion(pgQuestion: pgSchema.InsertQuestion): sqliteSchema.InsertQuestion {
    return {
      testId: pgQuestion.testId,
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
      questionNumber: 0, // Default
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
      attemptNumber: null,
      answerTimeSeconds: sqliteAnswer.answerTime,
      knowledgeLevel: sqliteAnswer.knowledgeFlag ? "high" : null,
      techniqueLevel: sqliteAnswer.techniqueFlag ? "high" : null,
      guessworkLevel: sqliteAnswer.guessworkFlag ? "high" : null,
      confidenceLevel: sqliteAnswer.confidence ? String(sqliteAnswer.confidence) : null,
      notes: sqliteAnswer.notes,
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

  private convertSqliteSubjectStatsToPgSubjectStats(sqliteStats: sqliteSchema.SubjectStats): pgSchema.SubjectStats {
    return {
      subject: {
        id: sqliteStats.subjectId,
        name: sqliteStats.name,
        description: null,
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
      },
      subjectId: sqliteStats.subjectId,
      attempts: 1,
      totalQuestions: sqliteStats.totalQuestions,
      correct: sqliteStats.correctCount,
      incorrect: sqliteStats.incorrectCount,
      unattempted: sqliteStats.leftCount,
      percentage: sqliteStats.percentage,
      averageTime: 0,
      knowledgeGaps: [],
      techniqueMistakes: [],
      guessworkInstances: [],
      weakTopics: [],
      strongTopics: [],
      improvementAreas: [],
      needsPractice: false,
      trend: "stable",
      lastAttemptScore: 0,
      bestAttemptScore: 0,
      avgTimePerQuestion: 0,
      avgAttemptScore: 0,
      recentAttempts: [],
      progressTrend: [],
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
    const subjectStats = sqliteAnalytics.subjectStats.map(s => this.convertSqliteSubjectStatsToPgSubjectStats(s));
    
    return {
      testId: pgTest.id,
      attemptId: pgAttempt.id,
      title: pgTest.title,
      date: pgAttempt.startTime,
      duration: pgAttempt.totalTimeSeconds || 0,
      questions,
      userAnswers,
      subjectStats,
      attempt: pgAttempt,
      test: pgTest,
      timePerQuestion: sqliteAnalytics.timePerQuestion,
      correctPercentage: sqliteAnalytics.correctPercentage, 
      incorrectPercentage: sqliteAnalytics.incorrectPercentage,
      leftPercentage: sqliteAnalytics.leftPercentage,
      overallScore: pgAttempt.score || 0,
      strengths: [],
      weaknesses: [],
      questionAnalysis: [],
      tags: [],
      categoryPerformance: [],
      testSummary: "",
      AIInsights: [],
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
    // Convert dates to strings for SQLite
    const sqliteData: Partial<sqliteSchema.Attempt> = { ...data };
    
    if (data.startTime) {
      sqliteData.startTime = data.startTime.toISOString();
    }
    
    if (data.endTime) {
      sqliteData.endTime = data.endTime.toISOString();
    }
    
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
    
    if (data.selectedOption !== undefined) sqliteData.selectedOption = data.selectedOption;
    if (data.isCorrect !== undefined) sqliteData.isCorrect = data.isCorrect;
    if (data.isLeft !== undefined) sqliteData.isLeft = data.isLeft;
    if (data.answerTimeSeconds !== undefined) sqliteData.answerTime = data.answerTimeSeconds;
    if (data.knowledgeLevel) sqliteData.knowledgeFlag = data.knowledgeLevel === "high";
    if (data.techniqueLevel) sqliteData.techniqueFlag = data.techniqueLevel === "high";
    if (data.guessworkLevel) sqliteData.guessworkFlag = data.guessworkLevel === "high";
    if (data.confidenceLevel) sqliteData.confidence = parseInt(data.confidenceLevel);
    if (data.notes !== undefined) sqliteData.notes = data.notes;
    
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
    // Convert dates to strings
    const sqliteData: Partial<sqliteSchema.Flashcard> = { ...data };
    
    if (data.lastReviewedAt) {
      sqliteData.lastReviewedAt = data.lastReviewedAt.toISOString();
    }
    
    if (data.nextReviewAt) {
      sqliteData.nextReviewAt = data.nextReviewAt.toISOString();
    }
    
    const result = await this.sqliteStorage.updateFlashcard(id, sqliteData);
    if (!result) return undefined;
    
    return this.convertSqliteFlashcardToPgFlashcard(result);
  }

  async getTestAnalytics(attemptId: number): Promise<pgSchema.TestAnalytics | undefined> {
    const analytics = await this.sqliteStorage.getTestAnalytics(attemptId);
    if (!analytics) return undefined;
    
    return this.convertSqliteTestAnalyticsToPgTestAnalytics(analytics);
  }

  async getOverallAnalytics(): Promise<{
    testCount: number;
    attemptCount: number;
    totalCorrect: number;
    totalIncorrect: number;
    totalLeft: number;
    subjectStats: pgSchema.SubjectStats[];
    trendData: { date: string; accuracy: number; score: number }[];
  }> {
    const analytics = await this.sqliteStorage.getOverallAnalytics();
    
    return {
      testCount: analytics.testCount,
      attemptCount: analytics.attemptCount,
      totalCorrect: analytics.totalCorrect,
      totalIncorrect: analytics.totalIncorrect,
      totalLeft: analytics.totalLeft,
      subjectStats: analytics.subjectStats.map(s => this.convertSqliteSubjectStatsToPgSubjectStats(s)),
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
}